import { Router } from 'express';
import {
  getDeals,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
  transitionDealStage,
  bulkUpdateDeals,
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

// Multi-deal operations run server-side in one transaction — see
// bulkUpdateDeals for why this is not N requests from the browser.
// Safe next to POST '/' because Express matches on method AND path, and there
// is no POST '/:id' that could capture "bulk".
router.post('/bulk', bulkUpdateDeals);

// Stage changes have their own endpoint so every move is audited.
router.post('/:id/stage-transition', transitionDealStage);
router.get('/:id/stage-history', getDealStageHistory);

export default router;
