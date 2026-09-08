/**
 * Newsletter & Form submission handler for Finance with Flow
 * Handles:
 * 1. Dedicated Newsletter Sign-up footer form
 * 2. Dedicated Newsletter Sign-up page form (/finance-with-flow-newsletter-sign-up/)
 * 3. Contact form (enrolling to Mailchimp if newsletter opt-in is checked, plus Netlify Forms submission)
 */

function clearMessage(form: HTMLFormElement) {
  const existing = form.parentNode?.querySelector('.fwf-form-message');
  if (existing) {
    existing.remove();
  }
}

function showMessage(form: HTMLFormElement, text: string, type: 'success' | 'danger') {
  clearMessage(form);
  const msgDiv = document.createElement('div');
  msgDiv.className = `fwf-form-message elementor-message elementor-message-${type}`;
  msgDiv.setAttribute('role', 'alert');

  const isFooter = !!form.closest('.elementor-site-footer');
  const isSuccess = type === 'success';

  let colorsCss = '';
  if (isFooter) {
    colorsCss = isSuccess
      ? 'background: rgba(49, 205, 176, 0.18); color: #31CDB0; border: 1px solid #31CDB0;'
      : 'background: rgba(220, 53, 69, 0.25); color: #ff9999; border: 1px solid rgba(255, 100, 100, 0.5);';
  } else {
    colorsCss = isSuccess
      ? 'background: #e6f9f5; color: #0b6855; border: 1px solid #a3ebd9;'
      : 'background: #f8d7da; color: #842029; border: 1px solid #f5c2c7;';
  }

  msgDiv.style.cssText = `
    margin-top: 14px;
    padding: 12px 16px;
    border-radius: 6px;
    font-size: 14px;
    line-height: 1.4;
    text-align: center;
    font-family: inherit;
    font-weight: 600;
    transition: all 0.3s ease;
    ${colorsCss}
  `;
  msgDiv.textContent = text;

  // Insert directly below the form
  form.insertAdjacentElement('afterend', msgDiv);
}

function attachNewsletterHandler(form: HTMLFormElement) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailInput = form.querySelector<HTMLInputElement>(
      'input[type="email"], input[name="form_fields[email]"], input[name="email"]'
    );
    const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const buttonTextSpan = submitBtn?.querySelector('.elementor-button-text') || submitBtn;

    if (!emailInput) return;

    const email = emailInput.value.trim();
    if (!email) {
      showMessage(form, 'Please enter your email address.', 'danger');
      return;
    }

    const originalText = buttonTextSpan ? buttonTextSpan.textContent : 'Join';

    // Set loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.7';
      submitBtn.style.cursor = 'wait';
    }
    if (buttonTextSpan) {
      buttonTextSpan.textContent = 'Joining...';
    }
    clearMessage(form);

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        showMessage(
          form,
          data.message || 'Thank you for subscribing! You have been enrolled in our newsletter.',
          'success'
        );
        emailInput.value = '';
      } else {
        showMessage(
          form,
          data.message || 'Something went wrong. Please check your email and try again.',
          'danger'
        );
      }
    } catch (err) {
      console.error('[Newsletter] Submission error:', err);
      showMessage(
        form,
        'Network error. Please check your connection and try again.',
        'danger'
      );
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '';
        submitBtn.style.cursor = '';
      }
      if (buttonTextSpan && originalText) {
        buttonTextSpan.textContent = originalText;
      }
    }
  });
}

function attachContactFormHandler(form: HTMLFormElement) {
  form.addEventListener('submit', async (e) => {
    // Check if user opted into newsletter
    const optInCheckbox = form.querySelector<HTMLInputElement>(
      'input[name="newsletter_opt_in"], input[name="form_fields[field_a44fdac]"]'
    );
    const emailInput = form.querySelector<HTMLInputElement>(
      'input[name="email"], input[name="form_fields[email]"], input[type="email"]'
    );
    const firstNameInput = form.querySelector<HTMLInputElement>(
      'input[name="firstname"], input[name="form_fields[firstname]"]'
    );
    const lastNameInput = form.querySelector<HTMLInputElement>(
      'input[name="lastname"], input[name="form_fields[lastname]"]'
    );

    const email = emailInput?.value.trim();
    const firstName = firstNameInput?.value.trim() || '';
    const lastName = lastNameInput?.value.trim() || '';
    // Marketing consent must be explicit (UK GDPR / PECR). If the opt-in checkbox
    // is absent from the DOM we do NOT enrol -- previously a missing checkbox
    // silently opted the user in.
    const shouldEnrol = Boolean(optInCheckbox?.checked);

    if (shouldEnrol && email) {
      // Send enrollment to Mailchimp in background
      fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
        }),
      }).catch((err) => {
        console.warn('[Mailchimp] Contact opt-in enrollment error:', err);
      });
    }

    // If deployed on Netlify, submit form data to Netlify Forms via AJAX
    const formNameAttr = (form.getAttribute('name') || '').trim().toLowerCase();
    if (form.hasAttribute('data-netlify') || formNameAttr === 'contact form') {
      e.preventDefault();
      const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      const buttonTextSpan = submitBtn?.querySelector('.elementor-button-text') || submitBtn;
      const originalText = buttonTextSpan ? buttonTextSpan.textContent : 'Send';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
        submitBtn.style.cursor = 'wait';
      }
      if (buttonTextSpan) {
        buttonTextSpan.textContent = 'Sending...';
      }
      clearMessage(form);

      try {
        const formData = new FormData(form);
        if (!formData.get('form-name')) {
          formData.set('form-name', (form.getAttribute('name') || 'Contact Form').trim());
        }
        const res = await fetch(form.getAttribute('action') || window.location.pathname, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(formData as any).toString(),
        });

        if (res.ok) {
          showMessage(
            form,
            'Thank you! Your message has been sent successfully.',
            'success'
          );
          form.reset();
        } else if (
          window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1'
        ) {
          // In local dev without Netlify's form bot server, gracefully simulate success
          console.info('[Contact] Form submitted locally. Netlify Forms will process live submissions on deploy.');
          showMessage(
            form,
            'Thank you! Your message has been sent successfully (Local preview mode).',
            'success'
          );
          form.reset();
        } else {
          // Report failures honestly rather than showing a false success: a
          // silent failure means the enquiry is lost with nobody aware of it.
          console.error('[Contact] Submission failed with status', res.status);
          showMessage(
            form,
            'Sorry, your message could not be sent. Please email us at undercontrol@financewithflow.com or call 01206 326610.',
            'danger'
          );
        }
      } catch (err) {
        console.error('[Contact] Submission error:', err);
        showMessage(
          form,
          'Sorry, your message could not be sent. Please email us at undercontrol@financewithflow.com or call 01206 326610.',
          'danger'
        );
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.style.opacity = '';
          submitBtn.style.cursor = '';
        }
        if (buttonTextSpan && originalText) {
          buttonTextSpan.textContent = originalText;
        }
      }
    }
  });
}

export function initForms() {
  const forms = document.querySelectorAll<HTMLFormElement>('form');

  forms.forEach((form) => {
    if (form.dataset.fwfAttached === 'true') return;

    const formName = (form.getAttribute('name') || '').trim().toLowerCase();

    const isNewsletter =
      formName.includes('newsletter') ||
      form.hasAttribute('data-newsletter-form');

    const isContact =
      formName.includes('contact form') ||
      form.hasAttribute('data-contact-form');

    if (isNewsletter) {
      attachNewsletterHandler(form);
      form.dataset.fwfAttached = 'true';
    } else if (isContact) {
      attachContactFormHandler(form);
      form.dataset.fwfAttached = 'true';
    }
  });
}

// Auto-run when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initForms());
  } else {
    initForms();
  }
}
