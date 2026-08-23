import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

interface ValidationSchema {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

export const validate = (schema: ValidationSchema | AnyZodObject) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if ('parseAsync' in schema) {
        // Direct schema on body
        req.body = await schema.parseAsync(req.body);
      } else {
        if (schema.body) {
          req.body = await schema.body.parseAsync(req.body);
        }
        if (schema.query) {
          req.query = await schema.query.parseAsync(req.query);
        }
        if (schema.params) {
          req.params = await schema.params.parseAsync(req.params);
        }
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorDetails = error.errors.reduce((acc: Record<string, string>, err) => {
          const field = err.path.join('.');
          acc[field] = err.message;
          return acc;
        }, {});

        next(new ValidationError('Invalid request parameters', errorDetails));
      } else {
        next(error);
      }
    }
  };
};

export default validate;
