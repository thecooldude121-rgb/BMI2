import { Router } from 'express';
import { getDeals, getDealById, createDeal, updateDeal, deleteDeal } from '../controllers/dealsController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);
router.get('/', getDeals);
router.get('/:id', getDealById);
router.post('/', createDeal);
router.put('/:id', updateDeal);
router.delete('/:id', deleteDeal);

export default router;
