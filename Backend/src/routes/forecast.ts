import { Router } from 'express';
import { getSnapshots, createSnapshot } from '../controllers/forecastController';
import { protect as authenticate } from '../middleware/auth';

const router = Router();

router.get('/snapshots',  authenticate, getSnapshots);
router.post('/snapshots', authenticate, createSnapshot);

export default router;
