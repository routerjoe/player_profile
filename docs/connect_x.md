# Kilo Code Prompt — Connect X (Twitter) on Dashboard → Settings (No External DB Services)

## Goal
Enable logged-in users to:
1. Click **Connect X** (OAuth 2.0 PKCE) from **Dashboard → Settings**
2. Post tweets (text + optional image) from Settings
3. Optionally schedule posts (MVP)
4. Disconnect any time

**Constraints (enforced):**
- **No Supabase** (or any external DB service).
- Use **SQLite** (file DB) with **Prisma**.
- Encrypt tokens at rest with **libsodium**.
- OAuth: **X OAuth 2.0 (PKCE)**, **Twitter API v2**.
- Framework: **Next.js 15 App Router**, TypeScript, Node server routes.
- Hosting: Render (or your current). Mount a persistent volume for `/data/app.db`.
- Sessions: **iron-session** (httpOnly cookie) — no external auth provider required.

---

## UX — Dashboard → Settings

Add **“Social Connections”** to **/dashboard/settings**:

- **X / Twitter Card**
  - **Not connected**:
    - **Connect X** button → GET `/api/x/auth-url` (server initiates OAuth)
    - Helper: “Connect your X account to post from your dashboard.”
  - **Connected**:
    - Show `@handle`, token expiry (relative), **Disconnect** → POST `/api/x/disconnect`

- **Composer (visible when connected)**
  - Textarea + char counter (warn > 280)
  - Single image upload (MVP)
  - **Post Now** → POST `/api/x/post` (multipart)
  - **Schedule** → POST `/api/x/schedule` with ISO datetime

- **History (last 10)**
  - Status (`posted/scheduled/failed`), time, tweet link, **Retry** on failures

- **Preferences**
  - Toggle: “Auto-share new blog posts to X” → boolean in SQLite

Keep styles consistent with your Settings page.

---

## Required X Scopes
```
tweet.read users.read tweet.write offline.access media.write
```

---

## Security
- **PKCE** (code_verifier + S256).
- Encrypt `access_token`/`refresh_token` with **libsodium** `secretbox`, using a key derived from `APP_SECRET`. Tokens never reach the client.
- Image handling: server-side single-image upload is gated via `X_MEDIA_UPLOAD_ENABLED`. It uses the legacy v1.1 `media/upload` endpoint and may not accept OAuth 2.0 Bearer tokens in all environments. If disabled or unsupported, composer posts text-only; don’t persist user images on disk unless needed.
- Retry on 429/5xx with exponential backoff (2 attempts).

---

## Data Storage — **SQLite + Prisma** (no Supabase)

**`prisma/schema.prisma`**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:/data/app.db" // ensure persistent disk in production
}

model SocialAccount {
  id               String   @id @default(cuid())
  userId           String
  provider         String
  handle           String?
  xUserId          String?
  accessTokenEnc   Bytes
  refreshTokenEnc  Bytes?
  tokenExpiresAt   DateTime?
  scope            String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@unique([userId, provider])
}

model ScheduledPost {
  id            String   @id @default(cuid())
  userId        String
  provider      String
  text          String
  imageUrl      String?
  mediaIdsJson  String?
  status        String   @default("scheduled")
  scheduledFor  DateTime?
  postedAt      DateTime?
  errorMsg      String?
  createdAt     DateTime @default(now())

  @@index([userId, status, scheduledFor])
}

model UserSocialPrefs {
  userId    String  @id
  autoShareBlogToX Boolean @default(false)
  updatedAt DateTime @updatedAt
}
```

**Install & migrate**
```bash
npm i prisma @prisma/client libsodium-wrappers iron-session
npx prisma migrate dev -n init_social_x
```

---

## Environment Variables
```
X_CLIENT_ID=...
X_CLIENT_SECRET=...
X_REDIRECT_URI=https://YOURDOMAIN.com/api/x/callback
APP_URL=https://YOURDOMAIN.com
APP_SECRET=...
SESSION_PASSWORD=...
```

---

## Sessions — **iron-session**

`lib/session.ts`:
```ts
import { IronSessionOptions } from "iron-session";

export const sessionOptions: IronSessionOptions = {
  cookieName: "app_session",
  password: process.env.SESSION_PASSWORD!,
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
```

---

## Server Utilities
- `lib/pkce.ts` — PKCE helpers
- `lib/crypto.ts` — libsodium encrypt/decrypt
- `lib/x-oauth.ts` — OAuth flow, refresh, post, upload media

---

## API Routes
1. **GET `/api/x/auth-url`**
2. **GET `/api/x/callback`**
3. **POST `/api/x/disconnect`**
4. **POST `/api/x/post`**
5. **POST `/api/x/schedule`**
6. **POST `/api/x/retry`**
7. **Cron `/api/cron/run-x-queue`**

---

## Client — Settings Page
- Show connection state
- Show composer & history
- Handle errors & retries

---

## Acceptance Criteria
- Connect/Disconnect works
- Tokens encrypted at rest
- Post Now + Schedule works
- No Supabase
