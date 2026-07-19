/**
 * honeypot.ts -- @astro-shad/forms. A hidden field real users never fill in
 * (visually hidden, tabindex="-1", autocomplete="off" on the input) but
 * simple bots often do, since they tend to fill every field they find.
 *
 * Convention: when tripped, respond exactly like a normal success
 * ({ ok: true }) rather than an error or a distinct "blocked" response --
 * never reveal to the caller that a trap fired, or a bot can adapt to it.
 *
 *   <input type="text" name="_trap" style="display:none" tabindex="-1" autocomplete="off" />
 *
 *   if (isHoneypotTripped(formData)) return json({ ok: true }, 200); // silent accept
 */
export function isHoneypotTripped(formData: FormData, field = '_trap'): boolean {
  const value = formData.get(field);
  return typeof value === 'string' && value.trim().length > 0;
}
