import { Router } from 'express';
import { getCompanies, getCompanyById,
  getCompanyIntelligence, createCompany, updateCompany, deleteCompany, importCompanies, getIndustries } from '../controllers/companiesController';
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
// Declared AFTER /:id but matched independently — Express routes on the full
// path, so this cannot be swallowed by the one above.
router.get('/:id/intelligence', getCompanyIntelligence);
router.post('/', createCompany);
router.put('/:id', updateCompany);
router.delete('/:id', requireRole(...DESTRUCTIVE_ACTION_ROLES), deleteCompany);

export default router;
