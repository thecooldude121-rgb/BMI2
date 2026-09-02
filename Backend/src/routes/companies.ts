import { Router } from 'express';
import { getCompanies, getCompanyById, createCompany, updateCompany, deleteCompany, importCompanies } from '../controllers/companiesController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);
router.get('/', getCompanies);
// Declared before the parameterised routes so a future POST '/:id' cannot
// swallow '/import'. Mirrors the contacts and deals routers.
router.post('/import', importCompanies);
router.get('/:id', getCompanyById);
router.post('/', createCompany);
router.put('/:id', updateCompany);
router.delete('/:id', deleteCompany);

export default router;
