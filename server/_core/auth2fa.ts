import { SignJWT, jwtVerify } from "jose";
import type { Request } from "express";
import { ENV } from "./env";

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role?: 'admin' | 'user';
};

const JWT_SECRET = new TextEncoder().encode(ENV.cookieSecret || "default-secret");
const SESSION_COOKIE_NAME = "session";

/**
 * Generate a simple 6-digit OTP for 2FA
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create a JWT session token
 */
export async function createSessionToken(
  payload: SessionPayload
): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify and decode JWT session token
 */
export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as SessionPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Extract session token from request cookies
 */
export function getSessionTokenFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const cookies = parseCookies(cookieHeader);
  return cookies[SESSION_COOKIE_NAME] || null;
}

/**
 * Parse cookie header
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((cookie) => {
    const [name, value] = cookie.split("=").map((c) => c.trim());
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });
  return cookies;
}

/**
 * Authenticate request using session token
 */
export async function authenticateRequest(
  req: Request
): Promise<SessionPayload | null> {
  const token = getSessionTokenFromRequest(req);
  if (!token) return null;

  return verifySessionToken(token);
}
