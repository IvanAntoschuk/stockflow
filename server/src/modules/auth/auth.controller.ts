import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response.js';
import { getAuthUser } from './auth.middleware.js';
import { loginSchema, registerSchema } from './auth.schemas.js';
import { loginUser, registerUser } from './auth.service.js';

export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  const result = await registerUser(input);
  sendSuccess(res, result, 201);
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const result = await loginUser(input);
  sendSuccess(res, result);
}

export function me(req: Request, res: Response) {
  sendSuccess(res, getAuthUser(req));
}
