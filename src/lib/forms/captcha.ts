/**
 * captcha.ts -- @astro-shad/forms. Bulk/bot spam protection: verifies a
 * client-submitted challenge token server-side before the form is treated
 * as legitimate. Unlike the honeypot (a passive signal with no setup), this
 * requires a widget on the form and a site/secret keypair from whichever
 * provider you pick -- see docs/forms-email-providers.md for the two
 * documented options and their setup steps.
 *
 * Both Cloudflare Turnstile and Google reCAPTCHA (v2/v3) expose the same
 * shape of server-side check: POST { secret, response (the token), remoteip }
 * to a siteverify endpoint, get back { success, ... }. One shared
 * implementation, two one-line wrappers -- swapping provider (or adding a
 * third that follows the same siteverify convention) is picking which
 * wrapper you call, not rewriting the check.
 *
 *   const { success } = await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY);
 *   if (!success) return json({ ok: false, error: 'Captcha failed.' }, 400);
 */
export interface CaptchaVerifyResult {
  success: boolean;
  /** reCAPTCHA v3 only -- 0.0 (likely bot) to 1.0 (likely human) */
  score?: number;
  errorCodes?: string[];
}

async function verifyCaptchaToken(
  endpoint: string,
  secret: string,
  token: string,
  remoteIp?: string
): Promise<CaptchaVerifyResult> {
  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set('remoteip', remoteIp);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  const json = (await res.json()) as { success: boolean; score?: number; 'error-codes'?: string[] };

  return { success: json.success, score: json.score, errorCodes: json['error-codes'] };
}

/** Cloudflare Turnstile -- widget: https://challenges.cloudflare.com/turnstile/v0/api.js */
export function verifyTurnstile(token: string, secret: string, remoteIp?: string) {
  return verifyCaptchaToken('https://challenges.cloudflare.com/turnstile/v0/siteverify', secret, token, remoteIp);
}

/** Google reCAPTCHA (v2 checkbox or v3 score-based) -- widget: https://www.google.com/recaptcha/api.js */
export function verifyRecaptcha(token: string, secret: string, remoteIp?: string) {
  return verifyCaptchaToken('https://www.google.com/recaptcha/api/siteverify', secret, token, remoteIp);
}
