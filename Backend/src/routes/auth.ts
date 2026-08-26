import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController';
import { protect } from '../middleware/auth';
import { loginIpLimiter, loginEmailLimiter, registerIpLimiter } from '../middleware/rateLimit';

const router = Router();

// Both limiters run on every login attempt and either can reject: per-IP alone
// is beaten by spraying one password across accounts from a botnet, per-email
// alone by rotating accounts from one host.
router.post('/login', loginIpLimiter, loginEmailLimiter, login);

// Invite-only, but still limited: this bounds invite-token brute force and stops
// the endpoint being used to probe which emails already exist.
router.post('/register', registerIpLimiter, register);

router.get('/me', protect, getMe);

export default router;
