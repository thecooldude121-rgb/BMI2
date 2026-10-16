import { Router } from 'express';
import {
  listReports, getReport, createReport, updateReport, deleteReport,
  listGrants, setGrant, revokeGrant, listTransferCandidates, transferReport,
} from '../controllers/savedReportsController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

/*
 * No requireRole anywhere here ON PURPOSE. Access to a saved report is decided
 * per report by ownership and grants, not by workspace role — a coarse role gate
 * would be both too strict (a sales rep cannot open a report shared with them)
 * and too loose (a manager could open one never shared with them). The fine rule
 * is enforced IN THE QUERIES, in services/reports/access.ts.
 */
router.get('/', listReports);
router.post('/', createReport);
router.get('/:id', getReport);
router.patch('/:id', updateReport);
router.delete('/:id', deleteReport);

router.get('/:id/grants', listGrants);
router.put('/:id/grants', setGrant);
router.delete('/:id/grants/:userId', revokeGrant);

// Ownerless reports (step c): an admin only, enforced in the queries. Absent (404)
// to anyone else, and to an admin while the owner is active.
router.get('/:id/transfer-candidates', listTransferCandidates);
router.post('/:id/transfer', transferReport);

export default router;
