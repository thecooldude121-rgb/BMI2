import { Router } from 'express';
import { getWorkspace, updateWorkspace } from '../controllers/workspaceController';
import { protect, requireRole, DESTRUCTIVE_ACTION_ROLES } from '../middleware/auth';

const router = Router();

router.use(protect);

// Reading the workspace's own name, timezone and currency is not privileged —
// the app shell needs them to render for everyone.
router.get('/', getWorkspace);

// Changing them is administrative: the slug appears in the login workspace
// picker and the currency drives every deal created afterwards. Gated with the
// SAME requireRole the rest of the API uses, not a second mechanism.
router.put('/', requireRole(...DESTRUCTIVE_ACTION_ROLES), updateWorkspace);

export default router;
