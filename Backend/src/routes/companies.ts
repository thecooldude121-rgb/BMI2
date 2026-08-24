import { Router } from 'express';
import { getCompanies, getCompanyById, createCompany, updateCompany, deleteCompany } from '../controllers/companiesController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);
router.get('/', getCompanies);
router.get('/:id', getCompanyById);
router.post('/', createCompany);
router.put('/:id', updateCompany);
router.delete('/:id', deleteCompany);

export default router;
