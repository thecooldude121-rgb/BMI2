import { EmailService, SendResult, TransactionalMessage } from '../types';
import { renderTemplate } from '../templates';

/**
 * Development transport: renders the message and writes it to the log instead of
 * delivering it.
 *
 * This is the verification mechanism until a sender domain is provisioned — the
 * full rendered body is logged at info level so copy, links and interpolated
 * values can all be checked without sending mail to a real person.
 *
 * `delivers` is false, and callers are expected to surface that rather than
 * report a send. Silently swallowing mail while telling a user "invite sent" is
 * the same class of untruth as a fabricated success toast.
 */
export class LogEmailTransport implements EmailService {
  readonly transportName = 'log';
  readonly delivers = false;

  async sendTransactional(message: TransactionalMessage): Promise<SendResult> {
    const body = renderTemplate(message);
    // One multi-line block rather than several calls, so concurrent requests
    // cannot interleave halves of two different emails in the log.
    console.info(
      [
        '',
        '──────────── EMAIL (log transport — NOT DELIVERED) ────────────',
        `to:       ${message.to}`,
        `subject:  ${message.subject}`,
        `template: ${message.template}`,
        '',
        body.text,
        '───────────────────────────────────────────────────────────────',
        '',
      ].join('\n'),
    );
    // ok:true means "handled as configured", which is what the caller needs to
    // distinguish from a real failure. `delivers` is how it knows nobody was
    // actually emailed.
    return { ok: true, id: `log-${Date.now()}` };
  }
}
