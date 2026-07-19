/**
 * escape-html.ts -- @astro-shad/forms. Entity-escapes a string before it's
 * interpolated into an HTML email body (or any other HTML string built from
 * user input). Every form field a user can submit is untrusted input --
 * skip this and a submitted "name" or "message" containing markup gets
 * interpreted as HTML by whatever reads the email (or whatever else
 * consumes the string), not shown as literal text.
 *
 *   const html = `<p>${escapeHtml(name)}</p>`;
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
