import crypto from 'node:crypto';

export interface SubscribeOptions {
  email: string;
  firstName?: string;
  lastName?: string;
  tags?: string[];
}

export interface SubscribeResult {
  success: boolean;
  message: string;
  isExisting?: boolean;
}

// In-memory cache for auto-discovered list ID within the serverless lifecycle
let cachedListId: string | null = null;

/**
 * Validates basic email formatting.
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Extracts the Mailchimp data center / server prefix from the API key.
 * Mailchimp API keys always follow the format: <hash>-<dc> (e.g., abc123def456-us21)
 */
function getDatacenterPrefix(apiKey: string): string | null {
  const envPrefix = (process.env.MAILCHIMP_SERVER_PREFIX || (import.meta as any).env?.MAILCHIMP_SERVER_PREFIX)?.trim();
  if (envPrefix) {
    return envPrefix;
  }

  const parts = apiKey.trim().split('-');
  if (parts.length > 1 && parts[parts.length - 1]) {
    return parts[parts.length - 1];
  }

  return null;
}

/**
 * Automatically discovers the primary audience / list ID if not provided in env.
 */
async function getDefaultListId(serverPrefix: string, authHeader: string): Promise<string> {
  if (cachedListId) {
    return cachedListId;
  }

  const response = await fetch(`https://${serverPrefix}.api.mailchimp.com/3.0/lists?count=1`, {
    method: 'GET',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.detail ||
        `Unable to fetch Mailchimp audience list (HTTP ${response.status}). Please set MAILCHIMP_LIST_ID in environment variables.`
    );
  }

  const data = await response.json();
  if (!data.lists || data.lists.length === 0) {
    throw new Error(
      'No audience lists found in your Mailchimp account. Please create an audience list in Mailchimp.'
    );
  }

  const listId = data.lists[0]?.id;
  if (!listId || typeof listId !== 'string') {
    throw new Error(
      'No valid audience list ID found in your Mailchimp account. Please set MAILCHIMP_LIST_ID in environment variables.'
    );
  }

  cachedListId = listId;
  return listId;
}

/**
 * Subscribes or updates an email address in the Mailchimp audience list using PUT (Upsert).
 */
export async function subscribeToMailchimp({
  email,
  firstName,
  lastName,
  tags = ['Website Newsletter'],
}: SubscribeOptions): Promise<SubscribeResult> {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !isValidEmail(cleanEmail)) {
    return {
      success: false,
      message: 'Please provide a valid email address.',
    };
  }

  const apiKey = (process.env.MAILCHIMP_API_KEY || (import.meta as any).env?.MAILCHIMP_API_KEY)?.trim();

  if (!apiKey) {
    console.error('[Mailchimp] Missing MAILCHIMP_API_KEY environment variable.');
    return {
      success: false,
      message: 'Mailchimp API key is not configured. Please set MAILCHIMP_API_KEY in environment variables.',
    };
  }

  const serverPrefix = getDatacenterPrefix(apiKey);
  if (!serverPrefix) {
    console.error(
      '[Mailchimp] Invalid API key format. Key should end with datacenter prefix like "-us21".'
    );
    return {
      success: false,
      message: 'Invalid Mailchimp API key configuration. Data center prefix could not be determined.',
    };
  }

  const authHeader = `Basic ${Buffer.from(`any:${apiKey}`).toString('base64')}`;

  let listId = (process.env.MAILCHIMP_LIST_ID || (import.meta as any).env?.MAILCHIMP_LIST_ID)?.trim();
  if (!listId) {
    try {
      listId = await getDefaultListId(serverPrefix, authHeader);
    } catch (err: any) {
      console.error('[Mailchimp] Error auto-detecting list ID:', err);
      return {
        success: false,
        message: err.message || 'Failed to detect Mailchimp audience list.',
      };
    }
  }

  // Generate MD5 subscriber hash for upsert endpoint
  const subscriberHash = crypto.createHash('md5').update(cleanEmail).digest('hex');

  // Build merge fields if name is supplied
  const mergeFields: Record<string, string> = {};
  if (firstName && firstName.trim()) {
    mergeFields.FNAME = firstName.trim();
  }
  if (lastName && lastName.trim()) {
    mergeFields.LNAME = lastName.trim();
  }

  const payload: Record<string, any> = {
    email_address: cleanEmail,
    status_if_new: 'subscribed',
    status: 'subscribed',
  };

  if (Object.keys(mergeFields).length > 0) {
    payload.merge_fields = mergeFields;
  }

  if (tags && tags.length > 0) {
    payload.tags = tags;
  }

  try {
    const url = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Log the full Mailchimp payload server-side, but never reflect it to the
      // client: `detail` can disclose audience/account information to probes.
      console.error('[Mailchimp] API error response:', data);

      // The one case worth surfacing specifically, because it is actionable.
      const isCompliance =
        response.status === 400 && /compliance state/i.test(String(data.title || ''));

      return {
        success: false,
        message: isCompliance
          ? 'This address cannot be subscribed automatically. Please contact us to be added.'
          : 'We could not complete your subscription right now. Please try again later.',
      };
    }

    return {
      success: true,
      message: 'Thank you for subscribing! You have been successfully added to our mailing list.',
      isExisting: data.status === 'subscribed' && response.status === 200,
    };
  } catch (error: any) {
    console.error('[Mailchimp] Network / unexpected error:', error);
    return {
      success: false,
      message: 'Unable to connect to the mailing service. Please try again later.',
    };
  }
}
