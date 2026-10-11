import { Router } from 'express';
import {
  getTasks,
  getTasksSummary,
  getTasksByDay,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/tasksController';
import { protect, requireRole, DESTRUCTIVE_ACTION_ROLES } from '../middleware/auth';

const router = Router();

router.use(protect);
router.get('/', getTasks);
// Before '/:id', or Express reads 'summary' as a task id.
router.get('/summary', getTasksSummary);
router.get('/by-day', getTasksByDay);
router.get('/:id', getTaskById);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', requireRole(...DESTRUCTIVE_ACTION_ROLES), deleteTask);

export default router;
