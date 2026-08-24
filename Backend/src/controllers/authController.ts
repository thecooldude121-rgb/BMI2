import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return secret;
};

// Cast: jsonwebtoken types expiresIn as a `StringValue` template literal that an
// env-var string cannot narrow to.
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, first_name, last_name, department } = req.body;
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      res.status(400).json({ success: false, message: 'Email already in use' });
      return;
    }
    // Phase 1 (single-tenant rollout): every new registration joins the one
    // existing tenant. A real signup flow (create-org vs. join-org) is future
    // work — see CRM_REMEDIATION_PLAN.md Phase 1.
    const tenantResult = await pool.query('SELECT id FROM tenants ORDER BY created_at LIMIT 1');
    const tenantId = tenantResult.rows[0]?.id;
    if (!tenantId) {
      res.status(500).json({ success: false, message: 'No tenant configured' });
      return;
    }
    const password_hash = await bcrypt.hash(password, 12);
    // Self-registration always gets the baseline 'sales' role — elevated roles
    // (admin/manager/hr) can only be granted by an existing admin, never by
    // the signup payload itself.
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, department, tenant_id)
       VALUES ($1, $2, $3, $4, 'sales', $5, $6) RETURNING id, email, first_name, last_name, role, tenant_id`,
      [email, password_hash, first_name, last_name, department, tenantId]
    );
    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, tenant_id: user.tenant_id },
      getJwtSecret(),
      { expiresIn: JWT_EXPIRES_IN }
    );
    res.status(201).json({ success: true, token, user });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND is_active = true', [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, tenant_id: user.tenant_id },
      getJwtSecret(),
      { expiresIn: JWT_EXPIRES_IN }
    );
    const { password_hash: _, ...safeUser } = user;
    res.json({ success: true, token, user: safeUser });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request & { user?: any }, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, role, department, avatar_url, is_active FROM users WHERE id = $1',
      [req.user?.id]
    );
    if (!result.rows[0]) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
