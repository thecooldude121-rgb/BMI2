import { Router } from 'express';
import {
  listServiceCredentials, createServiceCredential,
  rotateServiceCredential, revokeServiceCredential,
} from '../controllers/serviceCredentialsController';
import { protect, requireRole, DESTRUCTIVE_ACTION_ROLES } from '../middleware/auth';

const router = Router();

router.use(protect);

/**
 * Administrative throughout. Issuing a key hands another system standing access
 * to this workspace's data, and revoking one cuts a live integration — the same
 * class of change DESTRUCTIVE_ACTION_ROLES already gates.
 *
 * The READ is gated too: it reports which external systems hold credentials
 * here, which is administrative information rather than anything the app shell
 * needs. No route here is reachable with a service key — this router does not
 * use serviceKeyOrProtect, so a key cannot mint or rotate another key.
 */
router.get('/', requireRole(...DESTRUCTIVE_ACTION_ROLES), listServiceCredentials);
router.post('/', requireRole(...DESTRUCTIVE_ACTION_ROLES), createServiceCredential);
router.post('/:id/rotate', requireRole(...DESTRUCTIVE_ACTION_ROLES), rotateServiceCredential);
router.delete('/:id', requireRole(...DESTRUCTIVE_ACTION_ROLES), revokeServiceCredential);

export default router;
