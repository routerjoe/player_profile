import { IronSessionOptions } from "iron-session";
import { getIronSession, type IronSession } from "iron-session";
import { cookies } from "next/headers";

export const sessionOptions: IronSessionOptions = {
  cookieName: "app_session",
  password: process.env.SESSION_PASSWORD as string,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    httpOnly: true,
  },
};

declare module "iron-session" {
  interface IronSessionData {
    userId?: string;
    oauth?: { state: string; verifier: string };
  }
}

/**
 * Ensure a strong session password is configured.
 * Throws early in dev to avoid silent misconfiguration.
 */
export function requireSessionPassword() {
  if (!process.env.SESSION_PASSWORD || process.env.SESSION_PASSWORD.length < 16) {
    throw new Error("SESSION_PASSWORD is not set or too short. Set a strong random value in your .env.local.");
  }
}

/**
 * Obtain the iron-session for the current request using Next App Router cookies().
 * Works in Node.js runtime; cookie flags are configured in sessionOptions.
 */
export async function getSession(): Promise<IronSession<IronSessionData>> {
  requireSessionPassword();
  return getIronSession(cookies(), sessionOptions);
}