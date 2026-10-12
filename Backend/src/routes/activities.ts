import { Router } from 'express';
import {
  getActivities,
  getActivitiesSummary,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
} from '../controllers/activitiesController';
import { protect, requireRole, DESTRUCTIVE_ACTION_ROLES } from '../middleware/auth';

const router = Router();

router.use(protect);
router.get('/', getActivities);
// Before '/:id', or Express reads 'summary' as an activity id.
router.get('/summary', getActivitiesSummary);
router.get('/:id', getActivityById);
router.post('/', createActivity);
router.put('/:id', updateActivity);
router.delete('/:id', requireRole(...DESTRUCTIVE_ACTION_ROLES), deleteActivity);

export default router;
