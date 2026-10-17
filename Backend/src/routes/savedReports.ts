import { Router } from 'express';
import {
  listReports, getReport, createReport, updateReport, deleteReport,
  listGrants, setGrant, revokeGrant, listTransferCandidates, transferReport,
  runAdHoc, runSaved,
} from '../controllers/savedReportsController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

// A report id is a UUID. Anything else names no report, so it is the same 404 as
// an id you may not see — not a masked 500 from Postgres refusing the cast.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
router.param('id', (_req, res, next, id: string) => {
  if (!UUID.test(id)) { res.status(404).json({ success: false, message: 'Report not found' }); return; }
  next();
});

/*
 * No requireRole anywhere here ON PURPOSE. Access to a saved report is decided
 * per report by ownership and grants, not by workspace role — a coarse role gate
 * would be both too strict (a sales rep cannot open a report shared with them)
 * and too loose (a manager could open one never shared with them). The fine rule
 * is enforced IN THE QUERIES, in services/reports/access.ts.
 */
router.get('/', listReports);
router.post('/', createReport);

// Declared BEFORE /:id so "run" is never read as a report id. Express matches
// in order, and a literal segment must win over a parameter.
router.post('/run', runAdHoc);
router.get('/:id', getReport);
router.patch('/:id', updateReport);
router.delete('/:id', deleteReport);

router.get('/:id/run', runSaved);

router.get('/:id/grants', listGrants);
router.put('/:id/grants', setGrant);
router.delete('/:id/grants/:userId', revokeGrant);

// Ownerless reports (step c): an admin only, enforced in the queries. Absent (404)
// to anyone else, and to an admin while the owner is active.
router.get('/:id/transfer-candidates', listTransferCandidates);
router.post('/:id/transfer', transferReport);

export default router;
