import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, role, department
       FROM users WHERE is_active = true ORDER BY first_name`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};
