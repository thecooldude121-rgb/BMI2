import { Router } from 'express';
import { createInvite, listInvites, revokeInvite } from '../controllers/invitesController';
import { protect, requireRole } from '../middleware/auth';
import { inviteLimiter } from '../middleware/rateLimit';

const router = Router();

router.use(protect);

// Issuing an invite grants workspace access, so it is an admin/manager action.
// RBAC at the API layer, not just hidden in the UI.
router.post('/', requireRole('admin', 'manager'), inviteLimiter, createInvite);
router.get('/', requireRole('admin', 'manager'), listInvites);
router.delete('/:id', requireRole('admin', 'manager'), revokeInvite);

export default router;
