// @ts-nocheck
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'nof-prospect-prod-secret-change-in-production'
);

const COOKIE_NAME = 'nof_token';

export async function signToken(payload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getSessionFromRequest(req) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export const hashPassword = (password) => bcrypt.hash(password, 12);
export const comparePassword = (password, hash) => bcrypt.compare(password, hash);
