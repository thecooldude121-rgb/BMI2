import { Router } from 'express';
import { getContacts, createContact, updateContact, deleteContact } from '../controllers/contactsController';

const router = Router();

// TODO: restore protect middleware after auth is wired on the frontend
router.get('/', getContacts);
router.post('/', createContact);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);

export default router;
