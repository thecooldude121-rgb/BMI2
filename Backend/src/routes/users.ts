import { Router } from 'express';
import { getUsers } from '../controllers/usersController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);
router.get('/', getUsers);

export default router;
