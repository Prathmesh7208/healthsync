import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AuthorizationError, AuthenticationError } from '../utils/errors';

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role) && req.user.role !== UserRole.ADMIN) {
      return next(
        new AuthorizationError(
          `Access forbidden for role ${req.user.role}. Required: ${allowedRoles.join(', ')}`
        )
      );
    }

    next();
  };
};

export default authorize;
