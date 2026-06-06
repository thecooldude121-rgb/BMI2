import { Router } from 'express';
import { getQuotas, upsertQuota } from '../controllers/quotasController';
import { protect as authenticate } from '../middleware/auth';

const router = Router();

router.get('/',  authenticate, getQuotas);
router.put('/',  authenticate, upsertQuota);

export default router;
