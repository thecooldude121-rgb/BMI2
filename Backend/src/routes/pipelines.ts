import { Router } from 'express';
import {
  getPipelines, getPipelineById, getPipelineStages,
  createStage, updateStage, reorderStages, deleteStage, getStagePalette,
} from '../controllers/pipelinesController';
import { protect, requireRole } from '../middleware/auth';

const router = Router();

router.use(protect);

/*
 * READS ARE OPEN to any authenticated user; WRITES ARE ADMIN-ONLY.
 *
 * Reads cannot be gated: the Kanban, the list view, the deal detail page and the
 * dashboard all need the stage list to render at all, so requiring a role here
 * would break the board for every sales user. Configuration is the thing that
 * needs protecting, not the vocabulary.
 *
 * Admin-only is design open question 5, settled. A sales manager owning their
 * team's pipeline is a plausible future ask; widening it is adding 'manager' to
 * the requireRole calls below and nothing else.
 */
router.get('/', getPipelines);
router.get('/palette', getStagePalette);
router.get('/:id', getPipelineById);
router.get('/:id/stages', getPipelineStages);

// `/order` is declared BEFORE `/:stageId` or Express matches "order" as a stage
// id and the reorder never runs — it would 404 on a stage that does not exist.
router.post('/:id/stages', requireRole('admin'), createStage);
router.put('/:id/stages/order', requireRole('admin'), reorderStages);
router.patch('/:id/stages/:stageId', requireRole('admin'), updateStage);
router.delete('/:id/stages/:stageId', requireRole('admin'), deleteStage);

export default router;
