import { Router } from 'express';
import {
  getMeetings, getMeetingById, createMeeting, updateMeeting,
  setMeetingRelation, createActivityFromMeeting,
} from '../controllers/meetingsController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', getMeetings);
router.post('/', createMeeting);
router.get('/:id', getMeetingById);
router.patch('/:id', updateMeeting);

// The "push to deal or account" action. Its own route, not part of the patch
// above, because it is the one field needing an FK ownership check — and a
// second write path for that field is a second place to forget it.
router.put('/:id/relation', setMeetingRelation);

// Turn a line the USER chose out of the note into a real activity on the
// related record. No inference from the note text — see the controller.
router.post('/:id/activities', createActivityFromMeeting);

// No DELETE: the project rule is soft delete only where noted, and no hard
// deletes without an explicit ask.

export default router;
