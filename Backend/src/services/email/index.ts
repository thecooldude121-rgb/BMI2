import { EmailService } from './types';
import { LogEmailTransport } from './transports/logTransport';
import { ResendEmailTransport } from './transports/resendTransport';

export type { EmailService, TransactionalMessage, SendResult, EmailTemplate } from './types';

/**
 * Transport selection, and the guard that keeps the log transport out of
 * production.
 *
 * EMAIL_TRANSPORT = 'log' (default) | 'resend'
 * RESEND_API_KEY, EMAIL_FROM  — required when the transport is 'resend'
 *
 * THE FAILURE THIS PREVENTS. A no-op transport in production means every
 * password reset and every invite is silently swallowed: the API reports success,
 * the log says "sent", and nobody receives anything. That is invisible until a
 * customer says they never got the email, by which time it has been true for
 * weeks. So it is a boot-time refusal, not a warning — the same treatment
 * JWT_SECRET already gets in index.ts.
 */

let cached: EmailService | null = null;

/** Throws on a misconfiguration that would silently drop mail. Called at boot. */
export function assertEmailConfigured(): void {
  const transport = (process.env.EMAIL_TRANSPORT || 'log').toLowerCase();
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && transport === 'log') {
    throw new Error(
      'EMAIL_TRANSPORT is "log" but NODE_ENV is production. The log transport does not ' +
      'deliver mail — password resets and invites would be silently discarded. Set ' +
      'EMAIL_TRANSPORT=resend with RESEND_API_KEY and EMAIL_FROM, or run with NODE_ENV != production.',
    );
  }

  if (transport === 'resend') {
    const missing = ['RESEND_API_KEY', 'EMAIL_FROM'].filter(k => !process.env[k]);
    if (missing.length) {
      throw new Error(
        `EMAIL_TRANSPORT=resend requires ${missing.join(' and ')}. ` +
        'EMAIL_FROM must be on a domain verified in Resend with SPF and DKIM configured.',
      );
    }
  }

  if (transport !== 'log' && transport !== 'resend') {
    throw new Error(`Unknown EMAIL_TRANSPORT "${transport}". Expected "log" or "resend".`);
  }
}

export function getEmailService(): EmailService {
  if (cached) return cached;
  const transport = (process.env.EMAIL_TRANSPORT || 'log').toLowerCase();

  cached = transport === 'resend'
    ? new ResendEmailTransport(process.env.RESEND_API_KEY as string, process.env.EMAIL_FROM as string)
    : new LogEmailTransport();

  return cached;
}

/** Tests only — the module-level cache would otherwise outlive an env change. */
export function resetEmailServiceForTests(): void {
  cached = null;
}
