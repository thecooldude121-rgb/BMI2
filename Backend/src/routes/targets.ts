import { Router } from 'express';
import { getTargets, upsertProfile, getProjection } from '../controllers/targetsController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

// Reading is open to every authenticated role, like GET /quotas and GET /users.
router.get('/', getTargets);

// Computed from real closed-deal history (services/targetProjection.ts). Read
// access matches GET / — the same open visibility question applies.
router.get('/projection', getProjection);

// No requireRole here ON PURPOSE: a sales rep may set their own profile when
// the workspace allows it, so the coarse role gate would be wrong. The fine
// rule — admin: anyone; manager: direct reports; anyone: themselves if
// reps_set_own_targets — is applied in the controller by
// utils/targets.authorizeTargetWrite, the same function PUT /quotas uses.
router.put('/:userId/profile', upsertProfile);

export default router;
