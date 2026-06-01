import { Router } from 'express';
import { getDeals, getDealById, createDeal, updateDeal, deleteDeal } from '../controllers/dealsController';

const router = Router();

// TODO: restore protect middleware after auth is wired on the frontend
// router.use(protect);
router.get('/', getDeals);
router.get('/:id', getDealById);
router.post('/', createDeal);
router.put('/:id', updateDeal);
router.delete('/:id', deleteDeal);

export default router;
