import { Router } from 'express';
import { getPipelines, getPipelineById, getPipelineStages } from '../controllers/pipelinesController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);
router.get('/', getPipelines);
router.get('/:id', getPipelineById);
router.get('/:id/stages', getPipelineStages);

export default router;
