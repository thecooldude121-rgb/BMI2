import { Router } from 'express';
import authRoutes from './auth';
import leadsRoutes from './leads';
import dealsRoutes from './deals';
import companiesRoutes from './companies';
import contactsRoutes from './contacts';
import pipelinesRoutes from './pipelines';
import activitiesRoutes from './activities';
import tasksRoutes from './tasks';
import usersRoutes from './users';
import quotasRoutes from './quotas';
import forecastRoutes from './forecast';

const router = Router();

router.use('/auth', authRoutes);
router.use('/leads', leadsRoutes);
router.use('/deals', dealsRoutes);
router.use('/companies', companiesRoutes);
router.use('/contacts', contactsRoutes);
router.use('/pipelines', pipelinesRoutes);
router.use('/activities', activitiesRoutes);
router.use('/tasks', tasksRoutes);
router.use('/users', usersRoutes);
router.use('/quotas', quotasRoutes);
router.use('/forecast', forecastRoutes);

export default router;
