import { Router } from 'express';
import { getContacts, getContactById, createContact, updateContact, deleteContact, bulkUpdateContacts, importContacts } from '../controllers/contactsController';
import { protect, requireRole, DESTRUCTIVE_ACTION_ROLES } from '../middleware/auth';
import { serviceKeyOrProtect } from '../middleware/serviceAuth';

const router = Router();

/**
 * DECLARED ABOVE `router.use(protect)`, AND THE ORDER IS LOAD-BEARING.
 *
 * Express runs middleware in declaration order, so `protect` would reject a
 * key-bearing request before serviceKeyOrProtect ever ran. This is the one
 * route here a module may call with a machine credential: Lead Gen creates a
 * contact per converted prospect and has no session to present.
 *
 * With no key on the request this delegates to `protect` unchanged, so the
 * browser path is exactly as it was.
 */
router.post('/', serviceKeyOrProtect('contacts:write'), createContact);

router.use(protect);
router.get('/', getContacts);
// Declared before the parameterised routes. Nothing currently collides — there
// is no POST '/:id' — but keeping the literal path first means adding one later
// cannot quietly swallow '/bulk'. Mirrors the deals router.
router.post('/bulk', requireRole(...DESTRUCTIVE_ACTION_ROLES), bulkUpdateContacts);
// Literal path, declared before '/:id' for the same reason as '/bulk'.
router.post('/import', importContacts);
router.get('/:id', getContactById);
router.put('/:id', updateContact);
router.delete('/:id', requireRole(...DESTRUCTIVE_ACTION_ROLES), deleteContact);

export default router;
