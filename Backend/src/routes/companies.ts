import { Router } from 'express';
import { getCompanies, getCompanyById, createCompany, updateCompany, deleteCompany, importCompanies, getIndustries, getCompanyAccountIntelligence } from '../controllers/companiesController';
import { protect, requireRole, DESTRUCTIVE_ACTION_ROLES } from '../middleware/auth';

const router = Router();

router.use(protect);
router.get('/', getCompanies);
// Declared before the parameterised routes so a future POST '/:id' cannot
// swallow '/import'. Mirrors the contacts and deals routers.
router.post('/import', importCompanies);
// Before '/:id', or GET /industries would be read as a company whose id is
// "industries" and answer 404.
router.get('/industries', getIndustries);
router.get('/:id', getCompanyById);
// Read-only, ungated: any user who can see the account can see its external
// signals. The workspace's Lead Gen credential never leaves the server, and the
// domain queried is the one on this company's own row.
router.get('/:id/account-intelligence', getCompanyAccountIntelligence);
router.post('/', createCompany);
router.put('/:id', updateCompany);
router.delete('/:id', requireRole(...DESTRUCTIVE_ACTION_ROLES), deleteCompany);

export default router;
