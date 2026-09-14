import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';
import { encryptSecret } from '../utils/secretBox';
import { LEAD_GEN_MODULE, normalizeBaseUrl } from '../services/leadGen/link';

/**
 * Connected Modules — the link between this workspace and a sibling module,
 * today only Lead Gen.
 *
 * THE HANDSHAKE, AND WHY IT LOOKS LIKE AN INVITE.
 * module_links (047) stores a credential this CRM uses to CALL Lead Gen, and
 * Lead Gen is the side that issues it. Delivering it is a bootstrap problem:
 * the caller must authenticate to hand over the very secret that would
 * authenticate it. This codebase already answers that question for people —
 * registration is invite-only — so the machine answer is the same shape:
 *
 *   1. an admin here mints a short-lived, single-use setup code (hash stored);
 *   2. the code travels out of band, pasted into Lead Gen's admin console;
 *   3. Lead Gen POSTs its base URL, workspace id and API key, presenting the
 *      code as the only credential;
 *   4. the code is claimed and the link is written.
 *
 * Step 3 is the one unauthenticated write here, exactly as accepting an invite
 * is the one unauthenticated write in auth. See the route file for the ordering
 * that makes that true.
 */

/** 32 bytes, url-safe, prefixed so it is recognisable in an admin console. */
const CODE_BYTES = 32;
const CODE_PREFIX = 'mls_';

/**
 * 20 minutes. An invite lives 7 days because a person has to read an email and
 * find time; this is pasted into another console in the next few minutes, so
 * the window in which it is useful to an attacker is the window in which it is
 * useful at all.
 */
const CODE_TTL_MINUTES = 20;

/** Only the hash is stored — the same rule, and the same reason, as invites. */
const hashCode = (code: string): string =>
  crypto.createHash('sha256').update(code).digest('hex');

/**
 * GET /module-links
 *
 * Status for the Connected Modules screen. Deliberately returns NO secret and
 * no code: an admin looking at this screen must not be able to recover a
 * credential or a code they did not just create.
 */
export const listModuleLinks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const [links, codes] = await Promise.all([
      pool.query(
        `SELECT l.module, l.base_url, l.remote_workspace_id, l.is_active, l.linked_at,
                l.last_verified_at, l.last_verify_error,
                (l.api_key_encrypted IS NOT NULL) AS has_credential,
                NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), '') AS linked_by_name
           FROM module_links l
           LEFT JOIN users u ON u.id = l.linked_by AND u.tenant_id = l.tenant_id
          WHERE l.tenant_id = $1`,
        [tenantId],
      ),
      pool.query(
        `SELECT module, expires_at, created_at
           FROM module_link_setup_codes
          WHERE tenant_id = $1 AND consumed_at IS NULL AND revoked_at IS NULL
            AND expires_at > NOW()`,
        [tenantId],
      ),
    ]);

    const link = links.rows.find(r => r.module === LEAD_GEN_MODULE) ?? null;
    const openCode = codes.rows.find(r => r.module === LEAD_GEN_MODULE) ?? null;

    res.json({
      success: true,
      data: {
        module: LEAD_GEN_MODULE,
        // "Connected" means there is an active link WITH a credential. A row
        // without one cannot call anything, so reporting it as connected would
        // be the false confirmation this codebase keeps getting bitten by.
        connected: Boolean(link?.is_active && link?.has_credential),
        base_url: link?.base_url ?? null,
        remote_workspace_id: link?.remote_workspace_id ?? null,
        connected_since: link?.linked_at ?? null,
        linked_by_name: link?.linked_by_name ?? null,
        last_verified_at: link?.last_verified_at ?? null,
        last_verify_error: link?.last_verify_error ?? null,
        // Only that one is outstanding and when it dies — never the code.
        pending_setup_code: openCode
          ? { expires_at: openCode.expires_at, created_at: openCode.created_at }
          : null,
      },
    });
  } catch (error) { next(error); }
};

/**
 * POST /module-links/lead-gen/setup-code
 *
 * Mints a code and returns it ONCE. It is never retrievable afterwards, because
 * only its hash is kept.
 */
export const createSetupCode = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const client = await pool.connect();
  try {
    const tenantId = requireTenantId(req);
    const code = `${CODE_PREFIX}${crypto.randomBytes(CODE_BYTES).toString('base64url')}`;
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000);

    await client.query('BEGIN');

    // Regenerating REVOKES the previous code rather than adding a second live
    // one. An admin who regenerates because they think the first leaked would
    // otherwise be leaving the leaked one valid. The partial unique index
    // enforces this too; doing it explicitly makes the intent readable and
    // keeps the insert below from failing on a conflict the user cannot see.
    await client.query(
      `UPDATE module_link_setup_codes SET revoked_at = NOW()
        WHERE tenant_id = $1 AND module = $2 AND consumed_at IS NULL AND revoked_at IS NULL`,
      [tenantId, LEAD_GEN_MODULE],
    );

    const inserted = await client.query(
      `INSERT INTO module_link_setup_codes (tenant_id, module, code_hash, expires_at, created_by)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, expires_at, created_at`,
      [tenantId, LEAD_GEN_MODULE, hashCode(code), expiresAt, req.user?.id ?? null],
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: {
        // Shown once, to be copied into Lead Gen. It is not stored in a form
        // that could return it again.
        setup_code: code,
        expires_at: inserted.rows[0].expires_at,
        expires_in_minutes: CODE_TTL_MINUTES,
        // So the other side knows where to send it without being told verbally.
        redeem_url: `${req.protocol}://${req.get('host')}/api/v1/module-links/redeem`,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
  }
};

/**
 * DELETE /module-links/lead-gen
 *
 * Disconnect. Clears the stored credential and deactivates the link.
 *
 * The ROW is kept rather than deleted, so the screen can still show what was
 * connected and when it was turned off; the secret is what actually goes. Any
 * outstanding setup code is revoked in the same breath, because leaving one
 * live after a deliberate disconnect would let the link reappear on its own.
 */
export const disconnectModuleLink = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const client = await pool.connect();
  try {
    const tenantId = requireTenantId(req);
    await client.query('BEGIN');

    const updated = await client.query(
      `UPDATE module_links
          SET api_key_encrypted = NULL, is_active = FALSE, remote_workspace_id = NULL,
              last_verify_error = NULL, updated_at = NOW()
        WHERE tenant_id = $1 AND module = $2
        RETURNING id`,
      [tenantId, LEAD_GEN_MODULE],
    );

    await client.query(
      `UPDATE module_link_setup_codes SET revoked_at = NOW()
        WHERE tenant_id = $1 AND module = $2 AND consumed_at IS NULL AND revoked_at IS NULL`,
      [tenantId, LEAD_GEN_MODULE],
    );

    await client.query('COMMIT');

    if (!updated.rows[0]) {
      res.status(404).json({ success: false, message: 'This workspace has no Lead Gen link' });
      return;
    }
    res.json({ success: true, message: 'Lead Gen disconnected' });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
  }
};

/**
 * POST /module-links/redeem   — UNAUTHENTICATED except by the setup code.
 *
 * Called by Lead Gen, which has no session here. The code is the sole
 * credential, mirroring how Lead Gen's own account-intelligence endpoint
 * treats its API key — and how accepting an invite works on this side.
 *
 * Body: { setup_code, base_url, workspace_id?, api_key }
 *
 * `module` is NOT read from the body. It comes off the code's own row, so a
 * code minted for Lead Gen cannot be redeemed into another module's slot.
 */
export const redeemSetupCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const client = await pool.connect();
  try {
    const { setup_code, base_url, workspace_id, api_key } = (req.body ?? {}) as {
      setup_code?: unknown; base_url?: unknown; workspace_id?: unknown; api_key?: unknown;
    };

    /**
     * ONE MESSAGE FOR EVERY REJECTION of the code itself.
     *
     * Distinguishing "no such code" from "expired" from "already used" tells a
     * prober which codes once existed and how long ago — the same reasoning as
     * acceptInvite's single message, and as Lead Gen's refusal to separate
     * "unknown key" from "revoked".
     */
    const REJECT = 'That setup code is invalid, expired, or already used';

    if (typeof setup_code !== 'string' || !setup_code.trim()) {
      res.status(400).json({ success: false, message: REJECT });
      return;
    }
    if (typeof api_key !== 'string' || !api_key.trim()) {
      res.status(400).json({ success: false, message: 'api_key is required' });
      return;
    }

    // Validated BEFORE the code is claimed: a malformed URL should not burn a
    // single-use code and force the admin to mint another.
    let baseUrl: string;
    try {
      baseUrl = normalizeBaseUrl(base_url);
    } catch (e) {
      res.status(400).json({ success: false, message: e instanceof Error ? e.message : 'base_url is invalid' });
      return;
    }

    await client.query('BEGIN');

    const found = await client.query(
      `SELECT id, tenant_id, module, expires_at, consumed_at, revoked_at
         FROM module_link_setup_codes WHERE code_hash = $1`,
      [hashCode(setup_code.trim())],
    );
    const codeRow = found.rows[0];

    const unusable =
      !codeRow ||
      codeRow.consumed_at ||
      codeRow.revoked_at ||
      new Date(codeRow.expires_at).getTime() < Date.now();

    if (unusable) {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, message: REJECT });
      return;
    }

    // Claim it FIRST, and only if still open. Two requests racing the same code
    // both pass the read above; this conditional UPDATE is what makes it
    // single-use, because the second one matches no row. Same rule as
    // acceptInvite.
    const claimed = await client.query(
      `UPDATE module_link_setup_codes SET consumed_at = NOW()
        WHERE id = $1 AND consumed_at IS NULL AND revoked_at IS NULL
        RETURNING id`,
      [codeRow.id],
    );
    if (!claimed.rows[0]) {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, message: REJECT });
      return;
    }

    // Upsert: a workspace that disconnected and reconnected already has a row,
    // and the conflict target is the same (tenant_id, module) key the screen
    // reads by.
    await client.query(
      `INSERT INTO module_links (tenant_id, module, base_url, api_key_encrypted, remote_workspace_id, is_active)
       VALUES ($1,$2,$3,$4,$5,TRUE)
       ON CONFLICT (tenant_id, module) DO UPDATE
         SET base_url = EXCLUDED.base_url,
             api_key_encrypted = EXCLUDED.api_key_encrypted,
             remote_workspace_id = EXCLUDED.remote_workspace_id,
             is_active = TRUE,
             last_verify_error = NULL,
             linked_at = NOW(),
             updated_at = NOW()`,
      [
        codeRow.tenant_id,
        codeRow.module,
        baseUrl,
        encryptSecret(api_key.trim()),
        typeof workspace_id === 'string' && workspace_id.trim() ? workspace_id.trim() : null,
      ],
    );

    await client.query('COMMIT');

    // Nothing about the workspace is echoed back. The caller already knows what
    // it sent, and a redeem response is not a place to disclose which tenant a
    // code belonged to.
    res.json({ success: true, message: 'Link established' });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
  }
};

/** Shared with the tests, so the hashing rule lives in one place. */
export { hashCode };
