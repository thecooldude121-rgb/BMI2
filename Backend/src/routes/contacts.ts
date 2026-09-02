import { Router } from 'express';
import { getContacts, getContactById, createContact, updateContact, deleteContact, bulkUpdateContacts, importContacts } from '../controllers/contactsController';
import { protect, requireRole, DESTRUCTIVE_ACTION_ROLES } from '../middleware/auth';

const router = Router();

router.use(protect);
router.get('/', getContacts);
// Declared before the parameterised routes. Nothing currently collides — there
// is no POST '/:id' — but keeping the literal path first means adding one later
// cannot quietly swallow '/bulk'. Mirrors the deals router.
router.post('/bulk', requireRole(...DESTRUCTIVE_ACTION_ROLES), bulkUpdateContacts);
// Literal path, declared before '/:id' for the same reason as '/bulk'.
router.post('/import', importContacts);
router.get('/:id', getContactById);
router.post('/', createContact);
router.put('/:id', updateContact);
router.delete('/:id', requireRole(...DESTRUCTIVE_ACTION_ROLES), deleteContact);

export default router;
