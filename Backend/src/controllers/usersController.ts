import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, role, department
       FROM users WHERE is_active = true AND tenant_id = $1 ORDER BY first_name`,
      [tenantId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};
