import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  /** Set by multer on upload failures. */
  code?: string;
}

/**
 * Upload failures are the caller's problem, not a server fault, so they must not
 * surface as 500s. Multer signals them with a `code` and its own name.
 */
const UPLOAD_ERRORS: Record<string, { status: number; message: string }> = {
  LIMIT_FILE_SIZE:       { status: 413, message: 'That file is too large. The limit is 25 MB.' },
  LIMIT_FILE_COUNT:      { status: 400, message: 'Only one file can be uploaded at a time.' },
  LIMIT_UNEXPECTED_FILE: { status: 400, message: 'Unexpected file field — the file must be sent as "file".' },
  LIMIT_FIELD_COUNT:     { status: 400, message: 'Too many form fields in the upload.' },
  LIMIT_PART_COUNT:      { status: 400, message: 'Too many parts in the upload.' },
};

export const errorHandler = (
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err.name === 'MulterError' && err.code && UPLOAD_ERRORS[err.code]) {
    const { status, message } = UPLOAD_ERRORS[err.code];
    console.error(`[${new Date().toISOString()}] upload rejected: ${err.code}`);
    res.status(status).json({ success: false, message });
    return;
  }

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
