import { Router } from 'express';
import { register, login, getMe, updateMe, changePassword } from '../controllers/authController';
import { protect } from '../middleware/auth';
import { loginIpLimiter, loginEmailLimiter, registerIpLimiter, changePasswordLimiter } from '../middleware/rateLimit';

const router = Router();

// Both limiters run on every login attempt and either can reject: per-IP alone
// is beaten by spraying one password across accounts from a botnet, per-email
// alone by rotating accounts from one host.
router.post('/login', loginIpLimiter, loginEmailLimiter, login);

// Invite-only, but still limited: this bounds invite-token brute force and stops
// the endpoint being used to probe which emails already exist.
router.post('/register', registerIpLimiter, register);

router.get('/me', protect, getMe);

// Editing your own profile. No role check and no :id — the row is the one the
// token names, so this can only ever act on yourself.
router.patch('/me', protect, updateMe);

// Verifying a password makes this a credential endpoint, so it gets the same
// brute-force treatment as login: 5 failed attempts per account per 15 minutes,
// keyed off the AUTHENTICATED identity rather than anything the caller supplies.
router.post('/change-password', protect, changePasswordLimiter, changePassword);

export default router;
