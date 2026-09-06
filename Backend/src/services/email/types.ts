/**
 * The EmailService contract.
 *
 * Provider-agnostic on purpose. Two features depend on transactional mail —
 * password reset and workspace invites — and neither should know which provider
 * is behind it. Nothing above this file may import a provider SDK, reference a
 * provider-specific field, or branch on the transport name; if it does, swapping
 * providers stops being a config change and becomes a refactor.
 *
 * `template` + `vars` rather than a pre-rendered body: the caller says WHAT to
 * send, not what it looks like. That keeps copy in one place and means a provider
 * with server-side templates could be adopted later without touching call sites.
 */

/** Every message this system can send. Adding one starts here. */
export type EmailTemplate =
  | 'workspace-invite'
  | 'password-reset';

export interface TransactionalMessage {
  /** A single recipient. Bulk send is deliberately not in this contract. */
  to: string;
  subject: string;
  template: EmailTemplate;
  /** Substituted into the template. Values are escaped when rendering HTML. */
  vars: Record<string, string | number>;
}

/**
 * Delivery is reported, never thrown, so a caller can decide what a failure
 * means. For an invite it means "the record exists but nobody was told" — which
 * the API must state truthfully rather than implying a send happened.
 */
export interface SendResult {
  ok: boolean;
  /** Provider message id when the transport supplies one. */
  id?: string;
  /** Present when ok is false. Safe to log; not intended for an end user. */
  error?: string;
}

export interface EmailService {
  sendTransactional(message: TransactionalMessage): Promise<SendResult>;
  /** For diagnostics and the boot-time guard. Never branch on this in features. */
  readonly transportName: string;
  /** False for transports that do not actually deliver (the log transport). */
  readonly delivers: boolean;
}
