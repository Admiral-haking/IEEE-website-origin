# IEEE Quchan Student Branch Website

Next.js app (App Router + TypeScript) for the IEEE Student Branch at Quchan University of Technology — built with MUI v7, react-hook-form + zod, axios/axios-hooks, and Mongoose.

## Requirements

- Node.js 18+ (recommended 18.18+ or 20+)
- npm

## Install

```bash
npm install
# Configure environment (edit .env.local)
# - MONGODB_URI=mongodb://...
# - JWT_SECRET=replace-with-a-long-random-string
# - NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

## Develop

```bash
npm run dev
```

Open http://localhost:3000

If you see Next.js dev errors like ENOENT for `.next/routes-manifest.json` or `Cannot find module './xxxx.js'` from `.next/server/webpack-runtime.js`, it's almost always a corrupted dev cache or multiple dev servers racing. Use a clean start:

1. Stop all Next dev servers (ensure only one is running).
2. Clean + start in one step (default): `npm run dev`.
3. If port 3000 is in use, either kill the process (`lsof -i:3000 -n -P` then `kill -9 <PID>`) or let Next use another port.

We do not ignore `.next` in webpack watch (see `next.config.mjs`) and `npm run dev` cleans `.next/` before starting to avoid chunk/manifest mismatch.

## Light/Dark Mode

Supports system theme and a header toggle using MUI v7.

## API Routes

- `GET /api/health` — service status
- `GET /api/team` — list team members
- `POST /api/team` — create a team member: `{ name, role, discipline: 'software'|'hardware'|'networking', email? }`

Set `MONGODB_URI` in `.env.local` to enable DB-backed routes.

## Branding & Content

- Update titles, nav labels, and homepage text in:
  - `src/locales/en/common.json`
  - `src/locales/fa/common.json`
- The site name shown in the header/footer comes from the `name`/`title` keys.

## Contact Form Email (SMTP)

Set the following in `.env.local` to enable email for contact messages:

- `SMTP_HOST` (e.g., smtp.gmail.com)
- `SMTP_PORT` (e.g., 465 for secure, 587 for STARTTLS)
- `SMTP_SECURE` (`true` when using 465, else `false`)
- `SMTP_USER` / `SMTP_PASS`
- `MAIL_FROM` (sender address)
- `MAIL_TO` (recipient address)

If SMTP is not configured, messages are still saved to MongoDB and the API responds successfully without sending an email.

## Roles & Permissions

- Roles (ascending): `volunteer` < `member` < `executive` < `admin`
- Admin APIs access:
  - Users management: `admin` only
  - Content (blog, solutions, capabilities, case-studies, jobs, pages, media, team): `executive` and above
  - Public site is unaffected; these guard the admin endpoints only
  - Older values `user`/`professor` are normalized to `member`/`executive` for backward compatibility

## Security Hardening

- Database
  - Enforces `strictQuery`, `sanitizeFilter`, and `runValidators` in Mongoose.
  - Production requires `MONGODB_URI`; app fails fast if missing.
  - Connection tuned with pool/timeout and `w=majority`.
- Auth
  - Production requires strong `JWT_SECRET` (24+ chars), otherwise boot fails.
  - Auth cookie is httpOnly, sameSite=lax, secure in production.
- Query safety
  - All admin search endpoints escape user regex input to prevent ReDoS/regex injection.
  - Email normalized (lowercase/trim) in register/login; `User.email` is lowercased/trimmed in schema.
  - `passwordHash` is not selected by default; login fetches it explicitly.
- Uploads
  - Media upload limited to 10MB and content types `image/*` or `application/pdf`.
  - Served media is cached with long-lived immutable headers.
