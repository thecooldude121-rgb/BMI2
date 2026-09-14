import crypto from 'crypto';

/**
 * Authenticated encryption for secrets this CRM stores on behalf of a
 * workspace -- today, the API keys in `module_links` (migration 047).
 *
 * WHY THIS EXISTS AT ALL. Nothing in this codebase encrypted anything before
 * now, because nothing in it stored a secret it had to hand back. Passwords are
 * bcrypt HASHES, which are verified and never recovered; RESEND_API_KEY lives
 * in the environment and never touches the database. An outbound module key is
 * the first value that must be stored, read back in full, and put in an
 * Authorization header -- so hashing is not an option and plaintext in a column
 * is not acceptable.
 *
 * AES-256-GCM, not CBC: GCM authenticates as well as encrypts, so a tampered
 * ciphertext fails loudly instead of decrypting to garbage that then gets sent
 * to an external service as a bearer token.
 *
 * THE KEY IS LAZY ON PURPOSE. It is read on first use, not at import and not at
 * boot. A deployment that has no module link configured -- which is every
 * deployment today -- must not be forced to invent an encryption key to start
 * up. The failure only arrives when someone actually tries to store or read a
 * module credential, and it says exactly what to do about it.
 */

const ENV_VAR = 'MODULE_LINK_ENCRYPTION_KEY';
/** Format marker, so a future algorithm change can be told apart on read. */
const VERSION = 'v1';

function key(): Buffer {
  const raw = process.env[ENV_VAR];
  if (!raw) {
    throw new Error(
      `${ENV_VAR} is not set, so module credentials cannot be encrypted or read. ` +
        `Generate one with: openssl rand -hex 32`,
    );
  }
  // 32 bytes as 64 hex characters. Checked rather than trusted: a short key
  // would throw deep inside createCipheriv with a message that names neither
  // the variable nor the fix.
  if (!/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error(
      `${ENV_VAR} must be 64 hex characters (32 bytes). ` +
        `Generate one with: openssl rand -hex 32`,
    );
  }
  return Buffer.from(raw, 'hex');
}

/** Returns "v1:<iv>:<authTag>:<ciphertext>", all base64. */
export function encryptSecret(plaintext: string): string {
  // 12 bytes is the GCM standard nonce length. Random per call, so encrypting
  // the same key twice never produces the same ciphertext.
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return [
    VERSION,
    iv.toString('base64'),
    cipher.getAuthTag().toString('base64'),
    ct.toString('base64'),
  ].join(':');
}

export function decryptSecret(payload: string): string {
  const parts = payload.split(':');
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error('stored secret is not in the expected v1 format');
  }
  const [, iv, tag, ct] = parts;
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(ct, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

/** True when a key is configured, for callers that want to degrade rather than throw. */
export function secretsConfigured(): boolean {
  return Boolean(process.env[ENV_VAR]);
}
