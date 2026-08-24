import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  console.error(`[${new Date().toISOString()}] ${err.message}`);
  // Below 500, err.message is an intentional, caller-facing validation/lookup
  // message set by our own controllers (e.g. "Contact not found"). A bare 500
  // means an unhandled exception (often a raw driver error) bubbled up here,
  // so only leak its message outside of development.
  const message = statusCode < 500 || process.env.NODE_ENV === 'development'
    ? err.message || 'Internal Server Error'
    : 'Internal Server Error';
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  const err: ApiError = new Error(`Route not found: ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};
