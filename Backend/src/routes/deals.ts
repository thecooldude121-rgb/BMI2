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
import { protect, requireRole, DESTRUCTIVE_ACTION_ROLES } from '../middleware/auth';
import { serviceKeyOrProtect } from '../middleware/serviceAuth';

const router = Router();

/**
 * Above `router.use(protect)` for the same reason as the contacts POST: Express
 * order. Lead Gen reads closed-won deals here for ICP suggestion, and its
 * link-verification probe hits this same endpoint.
 */
router.get('/', serviceKeyOrProtect('deals:read'), getDeals);

router.use(protect);
router.get('/:id', getDealById);
router.post('/', createDeal);
router.put('/:id', updateDeal);
router.delete('/:id', requireRole(...DESTRUCTIVE_ACTION_ROLES), deleteDeal);

// Multi-deal operations run server-side in one transaction — see
// bulkUpdateDeals for why this is not N requests from the browser.
// Safe next to POST '/' because Express matches on method AND path, and there
// is no POST '/:id' that could capture "bulk".
router.post('/bulk', requireRole(...DESTRUCTIVE_ACTION_ROLES), bulkUpdateDeals);

// Stage changes have their own endpoint so every move is audited.
router.post('/:id/stage-transition', transitionDealStage);
router.get('/:id/stage-history', getDealStageHistory);

export default router;
