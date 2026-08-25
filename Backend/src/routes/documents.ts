import { Router } from 'express';
import {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocuments,
  toggleFavorite,
} from '../controllers/documentsController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);
router.get('/', getDocuments);
router.get('/:id', getDocumentById);
router.post('/', createDocument);
router.put('/:id', updateDocument);
// Bulk delete takes { ids: [...] }; the :id form deletes one.
router.delete('/', deleteDocuments);
router.delete('/:id', deleteDocuments);
router.post('/:id/favorite', toggleFavorite);

export default router;
