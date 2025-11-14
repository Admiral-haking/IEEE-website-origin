# راهنمای جامع سامانه وب IEEE QUT

این سند، نمای کلی، معماری، فناوری‌ها، ماژول‌ها، APIها، تنظیمات محیطی و فرایندهای عملیاتی پروژه «وب‌سایت شاخه دانشجویی IEEE دانشگاه صنعتی قوچان» را به شکل جامع توضیح می‌دهد.

## اهداف و چشم‌انداز
- ارائه وب‌سایتی مدرن، سریع و دوزبانه برای معرفی فعالیت‌ها، پروژه‌ها، تیم و رویدادها
- فراهم‌کردن زیرسامانه‌های مدیریت محتوا، عضویت، فرصت‌های شغلی، مطالعات موردی، و تعامل (تماس/چت)
- تأمین امنیت، مقیاس‌پذیری، و تجربه توسعه روان برای تیم فنی

## معماری کلی
- Frontend/Backend یکپارچه با Next.js 15 (App Router) و React 18
- Server Components + Route Handlers (`app/api/*/route.ts`)
- TypeScript سراسری، SSR/SSG/ISR با پیکربندی Next
- دیتابیس: MongoDB (Mongoose)
- کش/ریت‌لیمیت و OTP: Redis (اختیاری، با fallback حافظه در توسعه)
- ایمیل: Nodemailer (SMTP)
- SMS/OTP: ارائه‌دهندهٔ SMS قابل پیکربندی
- i18n: i18next + react-i18next (انگلیسی/فارسی + RTL)
- UI: MUI v7 + Emotion (RTL-ready)
- احراز هویت: JWT (کوکی httpOnly در سرور)
- دیپلوی: PM2 + اسکریپت‌ها + GitHub Actions

## فناوری‌ها (Tech Stack)
- Next.js 15، React 18، TypeScript
- MUI v7، Emotion، RTL plugin، Theme Provider و سیستم رنگ
- react-hook-form + zod برای فرم‌ها و اعتبارسنجی سمت کلاینت
- TipTap برای ادیتور محتوایی پیشرفته (برای صفحات/بلاگ)
- axios + axios-hooks برای درخواست‌ها در کلاینت
- i18next + language detector برای دوزبانه‌سازی و تشخیص زبان
- Mongoose برای مدل داده و اعتبارسنجی سمت سرور
- ioredis برای Redis (ریت‌لیمیت/OTP/کش)
- Nodemailer برای ایمیل (تأیید ایمیل، بازیابی رمز، اعلان)
- Cloudflare Turnstile (اختیاری) برای ضد‑بات فرم تماس

## ساختار دایرکتوری‌ها (src/)
- `app/` صفحات، لایه‌ها، و مسیرهای API (App Router)
- `components/` کامپوننت‌های UI مشترک
- `views/` صفحات پیچیده‌تر با منطق و فرم‌ها
- `server/` سرویس‌ها، auth، ایمیل، رسانه، SMS، اعتبارسنجی سروری
- `models/` مدل‌های Mongoose (User, Project, BlogPost, CaseStudy, Job, TeamMember, Channel/Chat, ...)
- `lib/` ابزارهای سراسری (mongoose, redis, rate-limit, metadata, axios)
- `theme/` تم و RTL برای MUI
- `i18n/` راه‌اندازی ترجمه و منابع متنی
- `validators/` شِماهای zod برای فرم‌ها و API

## ماژول‌ها و زیرسامانه‌ها
- محتوا و صفحات عمومی: خانه، راهکارها، قابلیت‌ها، بلاگ، مطالعات موردی، مشاغل، تیم، درباره، تماس، قوانین/حریم خصوصی
- عضویت و کاربران: ثبت‌نام، ورود، تأیید ایمیل، بازیابی رمز، پروفایل، نقش‌ها و دسترسی‌ها
- چت/گفتگو: کانال‌ها و نشست‌ها + پیام‌ها با ریت‌لیمیت سمت سرور
- فرم تماس: ذخیره در DB + ارسال ایمیل (SMTP) + Turnstile اختیاری
- رسانه/آپلود: GridFS روی MongoDB (محدودیت اندازه و نوع فایل)
- اعلان‌ها: شمارش، لیست، خواندن، و ایمیل اعلان در سناریوهای خاص
- سئو: `robots.txt` و `sitemap.xml` بر اساس `NEXT_PUBLIC_SITE_URL`

## مدل داده (نمونه‌ها)
- User: ایمیل/نام‌کاربری/نقش/وضعیت عضویت، هش رمز با bcrypt، شاخص‌ها
- Content: BlogPost, CaseStudy, Job, Solution, Capability, TeamMember, Event
- Chat: Channel, ChannelMessage, ChannelRead, ChatSession, ChatMessage
- Media: فایل‌ها در GridFS (bucket: `media`)

## احراز هویت و مجوزها
- JWT با `JWT_SECRET` قوی؛ کوکی httpOnly، SameSite=Lax، secure در production
- نقش‌ها: `volunteer`, `member`, `executive`, `admin` (+ برخی مسیرها `professor`)
- نگهبان دسترسی سمت سرور: `requireRoleAtLeast(role)` در Route Handlers

## ریت‌لیمیت و Redis
- کتابخانه `src/lib/redis.ts` با fallback حافظه برای توسعه
- استفاده برای: لاگین، ثبت‌نام، تماس، OTP، چت
- کلیدها + TTL جهت محدودسازی درخواست‌ها و نگهداری موقت کد OTP

## ایمیل و اعلان
- `src/server/mail/mailer.ts` پیکربندی SMTP از `.env`
- ارسال: تأیید ایمیل، بازیابی رمز، اعلانات عمومی/سیستمی
- تنظیم برند ایمیل با `MAIL_BRAND` (اختیاری)

## SMS و OTP
- API OTP: درخواست/تأیید کد با محدودیت نرخ
- سرویس SMS قابل‌پیکربندی با `SMS_API_URL`, `SMS_API_KEY`, `SMS_SENDER`
- نرمال‌سازی شماره‌های ایران (`+98...`)

## i18n و RTL
- زبان‌ها: `en` و `fa` با تشخیص خودکار/ذخیره کوکی/LocalStorage
- تم RTL برای MUI و فیکس‌های CSS در `globals.css`

## آپلود رسانه
- Endpoint: `POST /api/media` (حداکثر 10MB، فقط `image/*` و `application/pdf`)
- ذخیره‌سازی: MongoDB GridFS؛ لیست/حذف در سرور

## APIهای شاخص (نمونه)
- وضعیت: `GET /api/health` (جزئیات فقط برای admin)
- تماس: `POST /api/contact`
- احراز هویت: `/api/auth/*` شامل `register`, `login`, `logout`, `me`, `verify/resend`, `forgot-password`, `reset-password`, `otp/request`, `otp/verify`
- محتوا: `/api/blog`, `/api/solutions`, `/api/capabilities`, `/api/case-studies`, `/api/jobs`, `/api/projects`, `/api/team`, `/api/pages`
- چت: `/api/chat/channels/*`, `/api/chat/sessions/*`, ریت‌لیمیت پیام
- رسانه: `/api/media`, `/api/media/profile`, `/api/media/[id]`
- مدیریت: `/api/admin/stats`, اعلانات `/api/notifications/*`

## متغیرهای محیطی مهم
فایل مرجع پیشنهادی: `.env`

- پایگاه‌داده: `MONGODB_URI`
- احراز هویت: `JWT_SECRET`, `ALLOW_FIRST_ADMIN_SIGNUP`
- URLها: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_BASE_URL`
- نسخه و سوشال‌ها (اختیاری): `NEXT_PUBLIC_APP_VERSION`, `NEXT_PUBLIC_GITHUB_URL`, `NEXT_PUBLIC_LINKEDIN_URL`, `NEXT_PUBLIC_TWITTER_URL`, `NEXT_PUBLIC_INSTAGRAM_URL`, `NEXT_PUBLIC_TELEGRAM_URL`
- Redis (اختیاری): `REDIS_URL` یا `UPSTASH_REDIS_REST_URL`
- ایمیل: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `MAIL_TO`, `CONTACT_TO`, `MAIL_BRAND`(اختیاری)
- OTP / SMS: `OTP_WINDOW_SEC`, `OTP_LIMIT_PER_PHONE`, `OTP_LIMIT_PER_IP`, `OTP_CODE_TTL`, `SMS_API_URL`, `SMS_API_KEY`, `SMS_SENDER` (یا `SHAPARAK_*`)
- کپچا (اختیاری): `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `HCAPTCHA_SECRET`
- AI (اختیاری): `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `OPENAI_IMAGE_MODEL`
- CSP / امنیت (اختیاری): `CSP_LEVEL`, `SEC_STRICT_FOREIGN_IP`, `SEC_FOREIGN_WINDOW_SEC`, `SEC_FOREIGN_LIMIT`, `LOCAL_COUNTRY_CODE`

## توسعه محلی
```bash
npm ci
npm run dev
# باز کردن: http://localhost:3000
```

نکته: در صورت خطاهای dev مربوط به `.next/`، یک بار dev را متوقف کنید و مجدداً `npm run dev` اجرا شود (اسکریپت dev کش را پاک می‌کند).

## بیلد و اجرا
```bash
npm run build
npm start
```

## دیپلوی و عملیات (Ops)
- PM2 برای اجرای پایدار Node.js (`ecosystem.config.js` → `npm start`)
- اسکریپت واحد عملیات: `deploy.sh` (زیرفرمان‌ها: ship, deploy, env:push, status)
- CI/CD: GitHub Actions (`.github/workflows/deploy.yml`) با انتقال artifact، SSH و health check
- سرور تولید: Nginx به‌عنوان Reverse Proxy (در راهنما توضیح داده شده)

گام سریع:
```bash
# مقداردهی در .deploy.env (لوکال) و سپس:
bash ./deploy.sh ship
```
جزئیات بیشتر: `DEPLOYMENT_GUIDE.md`

## امنیت
- الزام `MONGODB_URI` و `JWT_SECRET` قوی در production
- کوکی‌های امن، محدودسازی نرخ، پاکسازی ورودی‌ها و regex-safe برای جست‌وجو
- محدودیت نوع/حجم فایل در آپلود و هدرهای کش امن برای رسانه

## پایش و سلامت
- PM2: `pm2 status`, `pm2 logs IEEE-website`
- Health: `GET /api/health` (برای admin)
- لاگ‌های Nginx و اپلیکیشن در سرور (بخش مانیتورینگ راهنمای دیپلوی)

## قراردادهای کدنویسی
- TypeScript everywhere، عدم استفاده از any در منطق اصلی
- Zod برای اعتبارسنجی فرم‌ها/API؛ اسکیماها در `validators/`
- تفکیک concerns: `server/` برای منطق سروری، `views/` برای UI پیچیده

## نقشهٔ راه پیشنهادی (اختیاری)
- تست‌های خودکار (unit/e2e) برای ماژول‌های کلیدی
- ادغام Message Queue برای صف ایمیل/SMS در ترافیک بالا
- داشبورد مدیریت پیشرفته برای محتوا و کاربران

---
به‌روزرسانی: 2025-11-10
