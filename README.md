# IEEE Quchan Student Branch Website

![CI](https://github.com/Admiral-haking/IEEE-website-origin/actions/workflows/ci.yml/badge.svg)
![Deploy](https://github.com/Admiral-haking/IEEE-website-origin/actions/workflows/deploy.yml/badge.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.18%20%3C23-339933?logo=node.js&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=222)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)
![MUI](https://img.shields.io/badge/MUI-v7-007FFF?logo=mui&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-8.8-47A248?logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-optional-CC0000?logo=redis&logoColor=white)
![SMTP](https://img.shields.io/badge/Email-SMTP-0A66C2?logo=mail.ru&logoColor=white)
![i18n](https://img.shields.io/badge/i18n-fa%20%7C%20en-FFB300)
![PM2](https://img.shields.io/badge/Process-PM2-2B8A3E?logo=pm2&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![AI Chat](https://img.shields.io/badge/AI-OpenAI%20%2F%20DeepSeek%20(optional)-6E44FF)

Next.js app (App Router + TypeScript) for the IEEE Student Branch at Quchan University of Technology — built with MUI v7, react-hook-form + zod, axios/axios-hooks, and Mongoose.

For a comprehensive Persian overview of systems and technologies, see:

- docs/SITE_OVERVIEW_FA.md

## راهنمای فارسی (خلاصهٔ کامل پروژه)

این پروژه یک وب‌سایت دوزبانه برای شاخهٔ دانشجویی IEEE دانشگاه صنعتی قوچان است که با Next.js (App Router) و TypeScript ساخته شده و شامل بخش‌های عمومی سایت، پنل مدیریت، سیستم عضویت و کاربران، محتوای وبلاگی/مطالعات موردی/فرصت‌های شغلی، رسانه، اعلان‌ها، چت و فرم تماس است. زیرساخت سروری به صورت Route Handlers در مسیر `app/api/*` پیاده‌سازی شده و از MongoDB (Mongoose) استفاده می‌کند. ترجمهٔ فارسی و چیدمان RTL پشتیبانی می‌شود.

- تکنولوژی‌ها (Tech Stack):
  - Next.js 15 (App Router) + React 18 + TypeScript
  - MUI v7 + Emotion + پلاگین RTL (تم روشن/تاریک و سوئیچ سریع)
  - react-hook-form + zod برای فرم‌ها و اعتبارسنجی کلاینتی
  - axios + axios-hooks برای درخواست‌ها در کلاینت
  - i18next + react-i18next برای دوزبانه‌سازی (fa/en)
  - MongoDB + Mongoose، GridFS برای فایل‌های رسانه
  - Redis اختیاری با ioredis (ریت‌لیمیت/کش/OTP با fallback حافظه)
  - Nodemailer (SMTP) برای ایمیل (تأیید ایمیل، بازیابی رمز، پیام‌های تماس)
  - TipTap Editor برای محتوای غنی، framer-motion/motion برای انیمیشن، lucide-react برای آیکون‌ها
  - یکپارچه‌سازی اختیاری با هوش مصنوعی (OpenAI/DeepSeek) برای چت

- ساختار کلی پوشه‌ها (src/):
  - `app/` صفحات رابط کاربری و Route Handlerهای API
  - `components/` اجزای UI مشترک (ThemeToggle, Navbar, Footer, Editor, ...)
  - `views/` صفحات و فرم‌های پیچیده (ادمین، احراز هویت، چت، تماس، ...)
  - `server/` منطق سروری: احراز هویت، سرویس‌های دامنه، ایمیل، رسانه، اعلان، SMS
  - `models/` مدل‌های Mongoose: User, BlogPost, CaseStudy, Job, TeamMember, Media(GridFS), Chat...
  - `lib/` ابزارها: اتصال Mongoose، Redis، ریت‌لیمیت، متادیتا، axios
  - `locales/` متون ترجمه‌ (fa/en)
  - `theme/` تم و RTL برای MUI
  - `validators/` اسکیماهای zod برای فرم‌ها و API

- قابلیت‌ها و ماژول‌ها:
  - محتوای عمومی: خانه، راهکارها (solutions)، قابلیت‌ها (capabilities)، بلاگ، مطالعات موردی، فرصت‌های شغلی، تیم، رویدادها، صفحات ایستا
  - عضویت/کاربران: ثبت‌نام، ورود، تأیید ایمیل، بازیابی رمز، پروفایل، نقش‌ها و مجوزها
  - رسانه: آپلود بر بستر GridFS (فقط تصاویر و PDF تا سقف 10MB)
  - اعلان‌ها: درون‌برنامه‌ای + ایمیلی (اختیاری)
  - فرم تماس: ذخیره در MongoDB و ارسال ایمیل (در صورت تنظیم SMTP) + کپچا اختیاری (Turnstile/hCaptcha)
  - چت: کانال‌ها و نشست‌ها، شمارش پیام‌های خوانده‌نشده، ریت‌لیمیت پیام‌ها؛ ادغام اختیاری با OpenAI/DeepSeek
  - سئو/دسترسی: `sitemap.xml` و `robots.txt`، هدرهای امنیتی و CSP

- نقش‌ها و دسترسی:
  - نقش‌ها (صعودی): `volunteer` < `member` < `executive` < `admin`
  - نگهبان‌های دسترسی سرور: `requireRoleAtLeast`, `requireRoleOrPermission`, `requireExecutiveAreaAccess`, `requireAdminAreaAccess`
  - مقادیر قدیمی `user`/`professor` برای سازگاری نگاشت می‌شوند.
  - کاربر اولی که در سامانه ثبت‌نام کند به‌صورت خودکار «ادمین» می‌شود؛ سایرین «داوطلب» هستند و تأیید ایمیل لازم دارند.

- اسکریپت‌های مهم (package.json):
  - توسعه: `npm run dev` (پاک‌سازی `.next` و اجرای dev)
  - بیلد: `npm run build` و اجرا: `npm start`
  - بستهٔ دیپلوی: `npm run pack` (ایجاد `deployment-package.zip`)
  - دیپلوی محلی/راه‌دور: `npm run deploy:local`, `npm run deploy:remote` (اسکریپت SSH/PM2)
  - وضعیت راه‌دور: `npm run status:remote`
  - مهاجرت نمونهٔ کاربران: `npm run migrate:users[:dry]`
  - لینت: `npm run lint`

- متغیرهای محیطی کلیدی (.env.local):
  - پایگاه‌داده: `MONGODB_URI`
  - احراز هویت: `JWT_SECRET` (قوی و 24+ کاراکتر در production)
  - URLها: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_BASE_URL`
  - Redis (اختیاری): `REDIS_URL` یا `UPSTASH_REDIS_REST_URL`
  - ایمیل/SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `MAIL_TO`, `MAIL_BRAND`(اختیاری)
  - کپچا (اختیاری): `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` یا `HCAPTCHA_SECRET`
  - چت/هوش مصنوعی (اختیاری):
    - محدودیت‌ها: `CHAT_LIMIT_USER`, `CHAT_LIMIT_MEMBER`, `CHAT_LIMIT_PROFESSOR`, `CHAT_LIMIT_ADMIN`, `CHAT_DISABLED`
    - OpenAI: `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_PROJECT`, `OPENAI_ORGANIZATION`
    - DeepSeek: `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`
  - اعلان ایمیلی: `NOTIFICATIONS_EMAIL_ENABLED` (غیرفعال‌سازی با `0`/`false`)
  - فلگ‌های قابلیت/نمایش:
    - Web Vitals: `NEXT_PUBLIC_ENABLE_VITALS` (کلاینت) و `OPS_VITALS_ENABLED` (سرور)
    - Assist Widget: `NEXT_PUBLIC_ENABLE_ASSIST` (کلاینت)
    - چت: `NEXT_PUBLIC_DISABLE_CHAT` (مخفی‌سازی در UI) و `CHAT_DISABLED` (غیرفعال‌سازی API)
  - CORS داخلی API: `CLIENT_ORIGIN` (پیش‌فرض: http://localhost:3000)

- APIهای شاخص (خلاصه‌ی گروه‌ها):
  - سلامت: `GET /api/health` (ساده)، `GET /api/_ops/health` (جزئیات فقط برای ادمین)
  - احراز هویت: `/api/auth/*` شامل `register`, `login`, `logout`, `me`, `verify`, `forgot-password`, `reset-password`, `set-password`, `policy`
  - محتوا: `/api/blog`, `/api/solutions`, `/api/capabilities`, `/api/case-studies`, `/api/jobs`, `/api/projects`, `/api/pages`, `/api/events`
  - تیم: `/api/team`
  - عضویت: `/api/membership`
  - رسانه: `/api/media`, `/api/media/profile`, `/api/media/[id]`
  - تماس: `POST /api/contact`
  - اعلانات: `/api/notifications/*`
  - چت: `/api/chat/channels/*`, `/api/chat/sessions/*`, `/api/chat/remaining`
  - مدیریت: `/api/admin/stats`

- امنیت و پیکربندی:
  - هدرهای امنیتی و CSP در `next.config.mjs` تنظیم شده‌اند (HSTS فقط در production)
  - کوکی احراز هویت: httpOnly + SameSite=Lax + secure در production
  - پاک‌سازی ورودی‌ها، جلوگیری از regex injection در جست‌وجوهای ادمین
  - محدودیت آپلود رسانه: 10MB و فقط `image/*` یا `application/pdf`
  - اتصال Mongoose با timeouts مناسب و `w=majority`

- چندزبانه و RTL:
  - زبان‌ها: `fa` و `en` با تشخیص خودکار/کوکی و پشتیبانی کامل RTL در MUI
  - متون قابل تنظیم در: `src/locales/fa/common.json` و `src/locales/en/common.json`

- دیپلوی و عملیات:
  - PM2: `ecosystem.config.js` (اجرای `npm start`)
  - بسته‌سازی بدون اسرار: `npm run pack` → `deployment-package.zip`
  - اسکریپت واحد عملیات: `deploy.sh` (زیرفرمان‌ها: ship, deploy, env:push, status)
  - راهنمای کامل: `DEPLOYMENT_GUIDE.md`

- خطاهای رایج توسعه و رفع آن:
  - خطاهای `.next/` یا مانفیست/چانک: فقط یک dev را باز نگه دارید و `npm run dev` (پاک‌سازی + اجرا) را استفاده کنید.
  - پورت 3000 مشغول است: پردازش را پیدا/متوقف کنید (`lsof -i:3000 -n -P` سپس `kill -9 <PID>`)، یا اجازه دهید Next پورت دیگری را انتخاب کند.
  - عدم تنظیم SMTP/Redis/AI: قابلیت‌ها به‌صورت امن غیرفعال یا با fallback حافظه کار می‌کنند.

## Requirements

- Node.js 18+ (recommended 18.18+ or 20+)
- npm

See `.nvmrc` for the recommended Node.js version.

## Install

```bash
npm install
# Configure environment (edit .env.local)
# - MONGODB_URI=mongodb://...
# - JWT_SECRET=replace-with-a-long-random-string
# - NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
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

## Build & Run

```bash
npm run build
npm start
```

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

## Deployment

- Local packaging (no secrets): see `DEPLOYMENT_GUIDE.md` or run `bash ./deploy.sh pack`.
- PM2 config: `ecosystem.config.js` (runs `npm start`).
- GitHub Actions:
  - CI: `.github/workflows/ci.yml`
  - Deploy: `.github/workflows/deploy.yml` (requires repo secrets — see guide)

## Contributing & Community

- See `CONTRIBUTING.md` for development flow.
- `CODE_OF_CONDUCT.md` applies to all interactions.
- Security reports: `SECURITY.md`.

## License

MIT — see `LICENSE`.
