import { Router } from 'express';
import { getContacts, getContactById, createContact, updateContact, deleteContact, bulkUpdateContacts } from '../controllers/contactsController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);
router.get('/', getContacts);
// Declared before the parameterised routes. Nothing currently collides — there
// is no POST '/:id' — but keeping the literal path first means adding one later
// cannot quietly swallow '/bulk'. Mirrors the deals router.
router.post('/bulk', bulkUpdateContacts);
router.get('/:id', getContactById);
router.post('/', createContact);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);

export default router;
