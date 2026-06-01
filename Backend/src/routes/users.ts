import { Router } from 'express';
import { getUsers } from '../controllers/usersController';

const router = Router();

// TODO: restore protect middleware after auth is wired on the frontend
router.get('/', getUsers);

export default router;
