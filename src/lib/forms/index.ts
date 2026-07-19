/**
 * @astro-shad/forms -- shared server-side building blocks for form
 * endpoints: honeypot spam signal, HTML-escaping for email bodies, a
 * provider-agnostic mailer (Resend / Cloudflare Email Sending), and
 * captcha verification (Turnstile / reCAPTCHA) for bulk spam protection.
 * See docs/forms-and-submissions.md and docs/forms-email-providers.md.
 *
 * Every form endpoint (contact, newsletter, story submission, ...) owns its
 * own POST handler and field shape, but pulls its safety net from here --
 * one place to fix a security gap instead of one per endpoint.
 */
export * from './honeypot';
export * from './escape-html';
export * from './mailer';
export * from './captcha';
