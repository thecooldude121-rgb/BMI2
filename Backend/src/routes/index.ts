import { Router } from 'express';
import authRoutes from './auth';
import leadsRoutes from './leads';
import dealsRoutes from './deals';
import companiesRoutes from './companies';
import contactsRoutes from './contacts';
import usersRoutes from './users';

const router = Router();

router.use('/auth', authRoutes);
router.use('/leads', leadsRoutes);
router.use('/deals', dealsRoutes);
router.use('/companies', companiesRoutes);
router.use('/contacts', contactsRoutes);
router.use('/users', usersRoutes);

export default router;
