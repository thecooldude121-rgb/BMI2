import { Router } from 'express';
import multer from 'multer';
import {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocuments,
  toggleFavorite,
  uploadDocument,
  downloadDocument,
} from '../controllers/documentsController';
import { protect, requireRole, DESTRUCTIVE_ACTION_ROLES } from '../middleware/auth';
import { MAX_UPLOAD_BYTES } from '../config/fileStorage';

const router = Router();

/**
 * memoryStorage, not diskStorage: multer's disk storage writes using a filename
 * it derives itself, before any of our validation runs. Buffering means the
 * controller decides the path (from the tenant id and a generated uuid) and can
 * refuse the file without anything having touched the filesystem.
 *
 * Safe because the size limit is enforced by multer BEFORE the buffer grows —
 * a request larger than the cap is rejected mid-stream, not after being read
 * into memory. One file per request.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 20 },
});

router.use(protect);

router.get('/', getDocuments);
// Declared before '/:id' so "upload" is not captured as an id.
router.post('/upload', upload.single('file'), uploadDocument);
router.get('/:id', getDocumentById);
router.get('/:id/content', downloadDocument);
router.post('/', createDocument);
router.put('/:id', updateDocument);
// Bulk delete takes { ids: [...] }; the :id form deletes one.
router.delete('/', requireRole(...DESTRUCTIVE_ACTION_ROLES), deleteDocuments);
router.delete('/:id', requireRole(...DESTRUCTIVE_ACTION_ROLES), deleteDocuments);
router.post('/:id/favorite', toggleFavorite);

export default router;
