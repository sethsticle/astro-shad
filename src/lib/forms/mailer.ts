/**
 * mailer.ts -- @astro-shad/forms. One `Mailer` interface, two provider
 * factories (Resend HTTP API, Cloudflare's native Email Sending binding) --
 * see docs/forms-email-providers.md for full setup steps and when to pick
 * which. A form endpoint calls `mailer.send({...})` the same way regardless
 * of provider; swapping providers is swapping which factory built `mailer`,
 * not touching the call site:
 *
 *   const mailer = env.RESEND_API_KEY
 *     ? createResendMailer(env.RESEND_API_KEY)
 *     : createCloudflareMailer(env.EMAIL);
 *
 *   await mailer.send({
 *     to: ['team@example.com'],
 *     from: { email: 'contact@example.com', name: 'Website' },
 *     replyTo: submittedEmail,
 *     subject: 'New enquiry',
 *     html, text,
 *   });
 *
 * A third POST-based provider (Postmark, SendGrid, ...) is a third factory
 * returning the same `Mailer` shape -- nothing else in a form endpoint
 * needs to know it exists.
 */
export interface MailMessage {
  to: string[];
  from: { email: string; name?: string };
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
}

export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

/** Resend (https://resend.com) -- plain HTTP API call, works on any runtime, not just Cloudflare. */
export function createResendMailer(apiKey: string): Mailer {
  return {
    async send(message) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          from: message.from.name ? `${message.from.name} <${message.from.email}>` : message.from.email,
          to: message.to,
          reply_to: message.replyTo,
          subject: message.subject,
          html: message.html,
          text: message.text,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(`Resend send failed (${res.status}): ${body.message ?? res.statusText}`);
      }
    },
  };
}

/** Minimal shape of Cloudflare's native `send_email` binding -- see wrangler's generated types for the full SendEmail interface. */
interface CloudflareSendEmailBinding {
  send(message: MailMessage): Promise<{ messageId?: string }>;
}

/** Cloudflare Email Sending binding -- no third-party account, Worker-identity-authenticated, Cloudflare-only. */
export function createCloudflareMailer(binding: CloudflareSendEmailBinding): Mailer {
  return {
    async send(message) {
      await binding.send(message);
    },
  };
}
