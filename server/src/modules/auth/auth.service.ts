import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/errors.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';
import type { AuthResponse, AuthUser } from './auth.types.js';

export const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

function signToken(user: AuthUser): string {
  const options: SignOptions = {
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign({ email: user.email, role: user.role }, env.JWT_SECRET, options);
}

function toAuthResponse(user: AuthUser): AuthResponse {
  return { token: signToken(user), user };
}

export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  if (existing) {
    throw AppError.conflict('EMAIL_IN_USE', 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: { name: input.name.trim(), email, passwordHash, role: Role.ADMIN },
    select: userSelect,
  });

  return toAuthResponse(user);
}

export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const { passwordHash: _passwordHash, ...publicUser } = user;
  return toAuthResponse(publicUser);
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  return prisma.user.findUnique({ where: { id }, select: userSelect });
}
