import { Router } from 'express';
import { protect } from '../middleware/auth';
import { listNotifications, dueFollowUps, markRead, markAllRead } from '../controllers/notificationsController';

const router = Router();
router.use(protect);
router.get('/', listNotifications);
router.get('/due', dueFollowUps);
router.post('/read-all', markAllRead);
router.post('/:id/read', markRead);

export default router;
