import { Router } from 'express';
import { getUsers, deactivateUser, reactivateUser } from '../controllers/usersController';
import { protect, requireRole, DESTRUCTIVE_ACTION_ROLES } from '../middleware/auth';

const router = Router();

router.use(protect);

// Listing the workspace's people is not privileged — assignment pickers need it.
router.get('/', getUsers);

// Changing someone's access is. Same requireRole as the rest of the API.
router.post('/:id/deactivate', requireRole(...DESTRUCTIVE_ACTION_ROLES), deactivateUser);
router.post('/:id/reactivate', requireRole(...DESTRUCTIVE_ACTION_ROLES), reactivateUser);

export default router;
