import { Router } from 'express';
import { getUsers, deactivateUser, reactivateUser, changeUserRole, changeUserManager } from '../controllers/usersController';
import { protect, requireRole, DESTRUCTIVE_ACTION_ROLES } from '../middleware/auth';

const router = Router();

router.use(protect);

// Listing the workspace's people is not privileged — assignment pickers need it.
router.get('/', getUsers);

// Changing someone's access is. Same requireRole as the rest of the API.
router.post('/:id/deactivate', requireRole(...DESTRUCTIVE_ACTION_ROLES), deactivateUser);
router.post('/:id/reactivate', requireRole(...DESTRUCTIVE_ACTION_ROLES), reactivateUser);

// Same gate as deactivation, for the same reason: changing someone's role
// changes what they can do. requireRole is the coarse door — who may attempt
// this at all — and the controller applies the fine rule, which is that nobody
// may assign a role above their own or touch someone who already holds one.
// A manager therefore reaches this route and is still refused an admin.
router.patch('/:id/role', requireRole(...DESTRUCTIVE_ACTION_ROLES), changeUserRole);

// Same gate again (migration 041). A reporting line grants no permission by
// itself, but it decides whose numbers roll up to whom, so it is management
// data. The controller adds the fine rules: you cannot restructure someone
// above you, the manager must be in your workspace, and the edge must not
// close a loop.
router.patch('/:id/manager', requireRole(...DESTRUCTIVE_ACTION_ROLES), changeUserManager);

export default router;
