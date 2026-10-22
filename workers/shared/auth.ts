import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, captcha } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';
import type { DB } from './client';
import * as schema from './schema';

export interface AuthEnv {
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  ADMIN_EMAILS?: string;
  RESEND_API_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
}

export function isAdminEmail(email: string, adminEmailsRaw: string | undefined): boolean {
  if (!adminEmailsRaw) return false;
  const set = new Set(
    adminEmailsRaw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
  return set.has(email.trim().toLowerCase());
}

const adminAc = createAccessControl({
  user: ['list', 'ban', 'impersonate', 'delete'],
  session: ['list', 'revoke'],
});

export const adminRoles = {
  admin: adminAc.newRole({
    user: ['ban', 'impersonate', 'delete', 'list'],
    session: ['list'],
  }),
  user: adminAc.newRole({ user: [], session: [] }),
};

function socialProviders(e: AuthEnv): Record<string, { clientId: string; clientSecret: string }> {
  const p: Record<string, { clientId: string; clientSecret: string }> = {};
  if (e.GOOGLE_CLIENT_ID && e.GOOGLE_CLIENT_SECRET)
    p.google = { clientId: e.GOOGLE_CLIENT_ID, clientSecret: e.GOOGLE_CLIENT_SECRET };
  if (e.GITHUB_CLIENT_ID && e.GITHUB_CLIENT_SECRET)
    p.github = { clientId: e.GITHUB_CLIENT_ID, clientSecret: e.GITHUB_CLIENT_SECRET };
  return p;
}

export function createAuth(authEnv: AuthEnv, db: DB) {
  return betterAuth({
    secret: authEnv.BETTER_AUTH_SECRET,
    baseURL: authEnv.BETTER_AUTH_URL || 'https://inflatablepoolfactory.com',
    database: drizzleAdapter(db, { provider: 'sqlite', schema }),
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async () => {},
    },
    session: { cookieCache: { enabled: true, maxAge: 5 * 60 } },
    rateLimit: { enabled: true, storage: 'database' },
    advanced: { ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] } },
    socialProviders: socialProviders(authEnv),
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ['github', 'google'],
      },
    },
    user: {
      deleteUser: { enabled: true },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (u) => ({
            data: {
              ...u,
              role: isAdminEmail(u.email, authEnv.ADMIN_EMAILS) ? 'admin' : 'user',
            },
          }),
        },
      },
    },
    plugins: [
      admin({ roles: adminRoles }),
      // Bot protection on sign-in/sign-up/password-reset — active only when a
      // secret key is configured (blank env degrades gracefully to no captcha).
      ...(authEnv.TURNSTILE_SECRET_KEY
        ? [captcha({ provider: 'cloudflare-turnstile', secretKey: authEnv.TURNSTILE_SECRET_KEY })]
        : []),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
