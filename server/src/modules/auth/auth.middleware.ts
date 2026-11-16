import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/errors.js';
import { getUserById } from './auth.service.js';
import type { AuthUser } from './auth.types.js';

export function getAuthUser(req: Request): AuthUser {
  if (!req.user) {
    throw AppError.unauthorized();
  }
  return req.user;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw AppError.unauthorized();
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw AppError.unauthorized();
    }

    let payload: JwtPayload;
    try {
      const verified = jwt.verify(token, env.JWT_SECRET);
      if (typeof verified === 'string') {
        throw new Error('Unexpected token payload');
      }
      payload = verified;
    } catch {
      throw new AppError(401, 'INVALID_TOKEN', 'Your session is invalid or has expired');
    }

    const userId = typeof payload.sub === 'string' ? payload.sub : null;
    if (!userId) {
      throw new AppError(401, 'INVALID_TOKEN', 'Your session is invalid or has expired');
    }

    const user = await getUserById(userId);
    if (!user) {
      throw new AppError(401, 'INVALID_TOKEN', 'Your session is invalid or has expired');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
