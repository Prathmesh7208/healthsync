import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const requestId = (req as any).id;

  if (err instanceof AppError) {
    logger.warn(`AppError [${err.code}]: ${err.message}`, {
      statusCode: err.statusCode,
      code: err.code,
      details: err.details,
      path: req.path,
      method: req.method,
      requestId,
    });

    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details || {},
      },
    });
  }

  // Unhandled / system errors
  logger.error(`Unhandled Exception: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId,
  });

  const statusCode = 500;
  const isProduction = process.env.NODE_ENV === 'production';

  return res.status(statusCode).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isProduction
        ? 'An unexpected error occurred. Please try again later.'
        : err.message,
      details: isProduction ? {} : { stack: err.stack },
    },
  });
};

export default errorHandler;
