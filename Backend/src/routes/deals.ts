import { Router } from 'express';
import {
  getDeals,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
  transitionDealStage,
  getDealStageHistory,
} from '../controllers/dealsController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);
router.get('/', getDeals);
router.get('/:id', getDealById);
router.post('/', createDeal);
router.put('/:id', updateDeal);
router.delete('/:id', deleteDeal);

// Stage changes go through their own endpoint so every move is audited — see
// transitionDealStage. Declared after /:id so they cannot shadow it.
router.post('/:id/stage-transition', transitionDealStage);
router.get('/:id/stage-history', getDealStageHistory);

export default router;
