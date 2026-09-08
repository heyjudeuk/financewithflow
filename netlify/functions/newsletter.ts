import { subscribeToMailchimp } from '../../src/lib/mailchimp';

/**
 * Origins permitted to POST to this endpoint. Same-origin browser requests send
 * no Origin header on form posts, so a missing Origin is allowed; a *present but
 * unrecognised* Origin is rejected. This blocks the cross-site list-injection
 * that the previous `Access-Control-Allow-Origin: *` invited.
 */
const ALLOWED_ORIGINS = [
  'https://financewithflow.com',
  'https://www.financewithflow.com',
];

function isAllowedOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true; // same-origin form post
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Netlify deploy previews / branch deploys.
  return /^https:\/\/[a-z0-9-]+--[a-z0-9-]+\.netlify\.app$/i.test(origin);
}

/**
 * Best-effort in-memory rate limit. Serverless instances are short-lived and not
 * shared, so this blunts casual scripted abuse rather than a distributed attack;
 * it is a speed bump, not a guarantee.
 */
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      // No Access-Control-Allow-Origin: this endpoint is same-origin only.
      'Cache-Control': 'no-store',
    },
  });
}

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, message: 'Method Not Allowed' }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json', Allow: 'POST' },
      }
    );
  }

  if (!isAllowedOrigin(req)) {
    console.warn(
      '[newsletter] Rejected cross-origin request from:',
      req.headers.get('origin')
    );
    return json({ success: false, message: 'Forbidden' }, 403);
  }

  const ip =
    req.headers.get('x-nf-client-connection-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown';

  if (isRateLimited(ip)) {
    return json(
      { success: false, message: 'Too many requests. Please try again shortly.' },
      429
    );
  }

  try {
    let email = '';
    let firstName = '';
    let lastName = '';
    let honeypot = '';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({}));
      email = body.email || body['form_fields[email]'] || '';
      firstName = body.firstName || body['form_fields[firstname]'] || '';
      lastName = body.lastName || body['form_fields[lastname]'] || '';
      honeypot = body.website || body['form_fields[website]'] || '';
    } else if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      const formData = await req.formData().catch(() => new FormData());
      const get = (...keys: string[]) =>
        keys.map((k) => formData.get(k)).find((v) => typeof v === 'string') as
          | string
          | undefined;

      email = get('email', 'form_fields[email]') || '';
      firstName = get('firstName', 'form_fields[firstname]') || '';
      lastName = get('lastName', 'form_fields[lastname]') || '';
      honeypot = get('website', 'form_fields[website]') || '';
    } else {
      const rawText = await req.text().catch(() => '');
      try {
        const parsed = JSON.parse(rawText);
        email = parsed.email || parsed['form_fields[email]'] || '';
        firstName = parsed.firstName || parsed['form_fields[firstname]'] || '';
        lastName = parsed.lastName || parsed['form_fields[lastname]'] || '';
        honeypot = parsed.website || parsed['form_fields[website]'] || '';
      } catch {
        email = '';
      }
    }

    // Honeypot: hidden to users, irresistible to bots. Report success so the bot
    // does not learn it was filtered, but do not touch Mailchimp.
    if (honeypot && honeypot.trim()) {
      console.warn('[newsletter] Honeypot triggered; discarding submission.');
      return json(
        {
          success: true,
          message:
            'Thank you for subscribing! You have been successfully added to our mailing list.',
        },
        200
      );
    }

    if (!email || !email.trim()) {
      return json(
        { success: false, message: 'Please enter a valid email address.' },
        400
      );
    }

    const result = await subscribeToMailchimp({ email, firstName, lastName });
    return json(result, result.success ? 200 : 400);
  } catch (error: any) {
    console.error('[Netlify Function /api/newsletter] Error:', error);
    return json(
      {
        success: false,
        message: 'Internal server error occurred while processing your subscription.',
      },
      500
    );
  }
};

export const config = {
  path: '/api/newsletter',
};
