import { EmailService, SendResult, TransactionalMessage } from '../types';
import { renderTemplate } from '../templates';

/**
 * Resend adapter.
 *
 * Deliberately uses fetch against the documented HTTP API rather than the SDK:
 * one dependency fewer, and the request shape stays visible at the boundary
 * where provider specifics are allowed to exist. Nothing above this file knows
 * this provider is in use.
 *
 * UNVERIFIED AGAINST A LIVE ACCOUNT. No sender domain is provisioned yet and no
 * test send has been made, by instruction. The request shape follows Resend's
 * POST /emails contract; treat the first real send as the thing that confirms it.
 */
export class ResendEmailTransport implements EmailService {
  readonly transportName = 'resend';
  readonly delivers = true;

  constructor(
    private readonly apiKey: string,
    /** Must be on a domain verified in Resend with SPF and DKIM, or sends fail. */
    private readonly from: string,
  ) {}

  async sendTransactional(message: TransactionalMessage): Promise<SendResult> {
    const body = renderTemplate(message);
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.from,
          to: [message.to],
          subject: message.subject,
          text: body.text,
          html: body.html,
        }),
      });

      const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
      if (!res.ok) {
        // Returned, not thrown: the caller decides what a delivery failure means.
        // The provider's message is kept for the log and never shown to an end
        // user, since it can echo the recipient address back.
        return { ok: false, error: json.message || `Resend responded ${res.status}` };
      }
      return { ok: true, id: json.id };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unknown transport error' };
    }
  }
}
