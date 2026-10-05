import { Router } from 'express';
import { protect } from '../middleware/auth';
import { search } from '../controllers/searchController';

const router = Router();
router.use(protect);
router.get('/', search);

export default router;
