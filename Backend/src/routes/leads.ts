import { Router } from 'express';
import {
  getLeads, getLeadById, createLead, updateLead, deleteLead,
  transitionLeadStage, getLeadStageHistory,
} from '../controllers/leadsController';
import { convertLead } from '../controllers/leadConversionController';
import {
  getActivities, createActivity, updateActivity,
  getNotes, createNote, updateNote, deleteNote,
  getTasks, createTask, updateTask,
  getEmails, logEmail,
  getCalls, logCall,
  getMeetings, scheduleMeeting, updateMeeting,
  getTags, createTag,
  getViews, createView, updateView, deleteView,
  enrichLead,
} from '../controllers/leadSubController';
import { protect, requireRole, DESTRUCTIVE_ACTION_ROLES } from '../middleware/auth';

const router = Router();
router.use(protect);

// ── Core CRUD ─────────────────────────────────────────────────────────────────
router.get('/',    getLeads);
router.post('/',   createLead);
router.get('/:id', getLeadById);
router.put('/:id', updateLead);
router.delete('/:id', requireRole(...DESTRUCTIVE_ACTION_ROLES), deleteLead);

// ── Stage transitions (step 5, ratified 2026-10-03) ──────────────────────────
// The ONLY way a lead's stage changes. No requireRole: every role moves leads;
// the manager/admin rule for overriding the qualification gate is enforced
// inside the handler, where the gate's outcome is known.
router.post('/:id/stage-transition', transitionLeadStage);
router.get('/:id/stage-history', getLeadStageHistory);
// Real conversion (step 5 slice B): creates / links the contact, company and
// deal in one transaction. No requireRole — every role converts (ratified
// 2026-10-03, step 4); the qualified-only rule is enforced in the handler.
router.post('/:id/convert', convertLead);

// ── Sub-resources ─────────────────────────────────────────────────────────────
router.get( '/:leadId/activities',           getActivities);
router.post('/:leadId/activities',           createActivity);
router.put( '/:leadId/activities/:activityId', updateActivity);

router.get(   '/:leadId/notes',          getNotes);
router.post(  '/:leadId/notes',          createNote);
router.put(   '/:leadId/notes/:noteId',  updateNote);
router.delete('/:leadId/notes/:noteId',  deleteNote);

router.get( '/:leadId/tasks',          getTasks);
router.post('/:leadId/tasks',          createTask);
router.put( '/:leadId/tasks/:taskId',  updateTask);

router.get( '/:leadId/emails',  getEmails);
router.post('/:leadId/emails',  logEmail);

router.get( '/:leadId/calls',  getCalls);
router.post('/:leadId/calls',  logCall);

router.get( '/:leadId/meetings',              getMeetings);
router.post('/:leadId/meetings',              scheduleMeeting);
router.put( '/:leadId/meetings/:meetingId',   updateMeeting);

router.post('/:leadId/enrich', enrichLead);

// ── Global resources (no leadId) ─────────────────────────────────────────────
router.get( '/meta/tags',      getTags);
router.post('/meta/tags',      createTag);

router.get(   '/meta/views',           getViews);
router.post(  '/meta/views',           createView);
router.put(   '/meta/views/:viewId',   updateView);
router.delete('/meta/views/:viewId',   deleteView);

export default router;
