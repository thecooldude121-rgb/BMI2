import { EmailTemplate, TransactionalMessage } from './types';

/**
 * Message bodies, kept out of the transports so every provider sends identical
 * copy and the text lives in one reviewable place.
 *
 * Both a text and an HTML part: text is what a plain-text client, a screen
 * reader and a spam filter all read most reliably, and an HTML-only
 * transactional mail is a deliverability problem as much as an accessibility one.
 */

export interface RenderedBody {
  text: string;
  html: string;
}

/** HTML-escape every interpolated value. Vars carry user-supplied names. */
const esc = (v: unknown): string =>
  String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * A missing variable is a bug in the caller, not something to paper over: an
 * email reading "You have been invited to undefined" is worse than a failure.
 */
function need(vars: Record<string, string | number>, key: string): string {
  const value = vars[key];
  if (value === undefined || value === null || value === '') {
    throw new Error(`email template variable "${key}" is missing`);
  }
  return String(value);
}

const layout = (bodyHtml: string): string =>
  `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#374151;line-height:1.5">
${bodyHtml}
<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
<p style="font-size:12px;color:#6b7280">BMI Platform</p>
</body></html>`;

const RENDERERS: Record<EmailTemplate, (vars: Record<string, string | number>) => RenderedBody> = {
  'workspace-invite': (vars) => {
    const workspace = need(vars, 'workspaceName');
    const inviter = need(vars, 'inviterName');
    const url = need(vars, 'acceptUrl');
    const days = need(vars, 'expiresInDays');
    return {
      text: [
        `${inviter} has invited you to join the "${workspace}" workspace on BMI Platform.`,
        '',
        'Create your account here:',
        url,
        '',
        `This link works once and expires in ${days} day(s). It was issued for this email address only.`,
        "If you weren't expecting this, you can ignore it — no account is created until you use the link.",
      ].join('\n'),
      html: layout(
        `<p><strong>${esc(inviter)}</strong> has invited you to join the ` +
        `<strong>${esc(workspace)}</strong> workspace on BMI Platform.</p>` +
        `<p><a href="${esc(url)}" style="display:inline-block;background:#4F46E5;color:#fff;` +
        `padding:10px 18px;border-radius:8px;text-decoration:none">Create your account</a></p>` +
        `<p style="font-size:13px;color:#6b7280">This link works once and expires in ` +
        `${esc(days)} day(s). It was issued for this email address only. If you weren't ` +
        `expecting this you can ignore it — no account is created until you use the link.</p>`,
      ),
    };
  },

  // Registered now because the contract has two consumers and the second one
  // should not have to change this file's shape when it arrives. Password reset
  // itself is not built — see CLAUDE.md "Known gaps in the auth shell".
  'password-reset': (vars) => {
    const url = need(vars, 'resetUrl');
    const minutes = need(vars, 'expiresInMinutes');
    return {
      text: [
        'Someone asked to reset the password for this BMI Platform account.',
        '',
        'Reset it here:',
        url,
        '',
        `This link works once and expires in ${minutes} minutes.`,
        "If you didn't request this, ignore this email — your password has not changed.",
      ].join('\n'),
      html: layout(
        `<p>Someone asked to reset the password for this BMI Platform account.</p>` +
        `<p><a href="${esc(url)}" style="display:inline-block;background:#4F46E5;color:#fff;` +
        `padding:10px 18px;border-radius:8px;text-decoration:none">Reset your password</a></p>` +
        `<p style="font-size:13px;color:#6b7280">This link works once and expires in ` +
        `${esc(minutes)} minutes. If you didn't request this, ignore this email — your ` +
        `password has not changed.</p>`,
      ),
    };
  },
};

export function renderTemplate(message: TransactionalMessage): RenderedBody {
  const renderer = RENDERERS[message.template];
  if (!renderer) throw new Error(`Unknown email template: ${message.template}`);
  return renderer(message.vars);
}
