/**
 * api/contact.ts -- dummy endpoint for the Forms dev-board (dev.astro,
 * board 6). Demonstrates the minimum a real handler needs to do: honeypot
 * check, parse the submitted FormData, re-validate server-side (the
 * browser's checkValidity() in Form.astro is UX only -- never trust it),
 * escape user input before it ever becomes part of an HTML string, and
 * respond with JSON so the caller can render request/response in the log
 * panel. Building blocks are shared via @astro-shad/forms so every form
 * endpoint (this one, a newsletter signup, a story submission, ...) gets
 * the same safety net instead of re-implementing it per-route -- see
 * docs/forms-and-submissions.md and docs/forms-email-providers.md.
 *
 * `prerender = false` opts this route out of static prerendering so it runs
 * on every request. `astro dev` runs a server regardless of `output` mode,
 * so this works locally with no adapter installed. Shipping it to
 * production requires an adapter (e.g. @astrojs/node, @astrojs/vercel) --
 * none is configured in this repo yet.
 *
 * Swap the console.log + response body for the real action (send an email,
 * write a row, queue a notification) when this stops being a dummy. The
 * mailer swap is a couple of lines, not a rewrite:
 *
 *   import { createResendMailer, createCloudflareMailer } from '../../lib/forms';
 *   // const mailer = createResendMailer(import.meta.env.RESEND_API_KEY);
 *   // const mailer = createCloudflareMailer((locals as any).runtime.env.EMAIL);
 *   // await mailer.send({ to: [...], from: {...}, replyTo: data.email, subject, html, text });
 *
 * Bulk/bot spam protection (a widget + token, not just the honeypot) is a
 * captcha check before the honeypot/validation below:
 *
 *   import { verifyTurnstile } from '../../lib/forms';
 *   // const { success } = await verifyTurnstile(data['cf-turnstile-response'], secret);
 *   // if (!success) return json({ ok: false, error: 'Captcha failed.' }, 400);
 */
import type { APIRoute } from 'astro';
import { isHoneypotTripped, escapeHtml } from '../../lib/forms';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('multipart/form-data') && !contentType.includes('application/x-www-form-urlencoded')) {
    return json({ ok: false, errors: { _form: 'Expected a form submission.' } }, 415);
  }

  const formData = await request.formData();

  // Honeypot: bots that fill every field they find trip this hidden one.
  // Reply exactly like a normal success -- never reveal that a trap fired.
  if (isHoneypotTripped(formData)) {
    return json({ ok: true, receivedAt: new Date().toISOString(), data: {} }, 200);
  }

  const data: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    data[key] = typeof value === 'string' ? value : value.name;
  }

  // Server-side validation: the client's constraint validation already
  // stopped most bad input, but the client is not trusted -- re-check here.
  const errors: Record<string, string> = {};
  if (!data.name || data.name.trim().length < 2) errors.name = 'Name is required.';
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'A valid email is required.';
  if (!data.province) errors.province = 'Province is required.';
  if (!data.visit_date) errors.visit_date = 'Preferred visit date is required.';
  if (!data.consent) errors.consent = 'Consent is required.';

  if (Object.keys(errors).length > 0) {
    console.warn('[api/contact] rejected submission:', errors);
    return json({ ok: false, errors }, 422);
  }

  // Every field is untrusted input -- escape before it becomes part of any
  // HTML string. This dummy only logs the preview a real mailer would send;
  // the escaping still has to happen here, not deferred to the mailer.
  const htmlPreview = `<p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
<p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
<p><strong>Message:</strong> ${escapeHtml(data.message ?? '')}</p>`;

  // Dummy action: print what a real handler would receive/send. Swap this
  // for the real side effect later (see the header comment for the mailer
  // toggle) -- htmlPreview is exactly the string a real mailer.send() call
  // would pass as `html`.
  console.log('[api/contact] received submission:', data);
  console.log('[api/contact] escaped HTML preview:\n', htmlPreview);

  return json({ ok: true, receivedAt: new Date().toISOString(), data }, 200);
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
