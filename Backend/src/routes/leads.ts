import { Router } from 'express';
import { getLeads, getLeadById, createLead, updateLead, deleteLead } from '../controllers/leadsController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);
router.get('/', getLeads);
router.get('/:id', getLeadById);
router.post('/', createLead);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);

export default router;
