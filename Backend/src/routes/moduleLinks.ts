import { Router } from 'express';
import {
  listModuleLinks, createSetupCode, disconnectModuleLink, redeemSetupCode,
} from '../controllers/moduleLinksController';
import { protect, requireRole, DESTRUCTIVE_ACTION_ROLES } from '../middleware/auth';
import { moduleLinkRedeemLimiter } from '../middleware/rateLimit';

const router = Router();

/**
 * DECLARED BEFORE `router.use(protect)`, AND THAT ORDER IS THE POINT.
 *
 * Express runs middleware in declaration order, so a route registered above the
 * `protect` line never reaches it. This is the one unauthenticated write in
 * this router: Lead Gen has no session here, and the setup code is the entire
 * credential — the same arrangement as accepting an invite, which is
 * unauthenticated for the same reason.
 *
 * Moving this line below `protect` would not fail any test loudly; it would
 * make the handshake permanently impossible, because the caller it exists for
 * is the one caller that can never hold a token. Leave it first.
 */
router.post('/redeem', moduleLinkRedeemLimiter, redeemSetupCode);

router.use(protect);

/**
 * Everything below is administrative. Minting a setup code hands out the
 * ability to attach an external system to this workspace's data, and
 * disconnecting cuts a live integration — both are exactly the class of change
 * DESTRUCTIVE_ACTION_ROLES ('admin', 'manager') already gates elsewhere.
 *
 * The READ is gated too, unlike most reads here: it reports which external
 * system this workspace is wired to and when, which is administrative
 * information rather than something the app shell needs to render. The account
 * detail page does NOT depend on it — the account-intelligence endpoint reports
 * "not linked" on its own, so an ordinary user never needs this route.
 */
router.get('/', requireRole(...DESTRUCTIVE_ACTION_ROLES), listModuleLinks);
router.post('/lead-gen/setup-code', requireRole(...DESTRUCTIVE_ACTION_ROLES), createSetupCode);
router.delete('/lead-gen', requireRole(...DESTRUCTIVE_ACTION_ROLES), disconnectModuleLink);

export default router;
