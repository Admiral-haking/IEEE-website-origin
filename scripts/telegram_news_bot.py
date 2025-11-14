#!/usr/bin/env python3
import asyncio
import json
import logging
import os
from pathlib import Path
from typing import Optional

import httpx
from telegram import Update
from telegram.error import TelegramError
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)


def load_dotenv(path: str = ".env") -> None:
    """Minimal .env loader to avoid extra dependencies."""
    p = Path(path)
    if not p.is_file():
        return
    for line in p.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if key and key not in os.environ:
            os.environ[key] = value


load_dotenv()

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_WEBHOOK_SECRET = os.environ.get("TELEGRAM_WEBHOOK_SECRET", "")
NEWS_API_URL = os.environ.get("NEWS_API_URL", "")
ALLOWED_CHAT_ID = os.environ.get("TELEGRAM_ALLOWED_CHAT_ID")
ADMIN_CHAT_ID = os.environ.get("ADMIN_CHAT_ID")

LOG_FILE = os.environ.get("NEWS_BOT_LOG_FILE", "/var/log/ieee-news-bot.log")

os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger("ieee-news-bot")


def _require_config() -> None:
    missing = []
    if not TELEGRAM_BOT_TOKEN:
        missing.append("TELEGRAM_BOT_TOKEN")
    if not TELEGRAM_WEBHOOK_SECRET:
        missing.append("TELEGRAM_WEBHOOK_SECRET")
    if not NEWS_API_URL:
        missing.append("NEWS_API_URL")
    if missing:
        raise SystemExit(f"Missing required env vars: {', '.join(missing)}")


def _is_allowed_chat(chat_id: int) -> bool:
    if not ALLOWED_CHAT_ID:
        return True
    try:
        return str(chat_id) == str(ALLOWED_CHAT_ID)
    except Exception:
        return True


async def cmd_start(update: Update, _: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message:
        return
    text = (
        "سلام ✋\n"
        "پیام خبری خودت را برای من بفرست؛ "
        "من آن را با کمک هوش مصنوعی (انگلیسی/فارسی) کامل می‌کنم "
        "و به‌صورت خبر در سایت منتشر می‌کنم."
    )
    await update.message.reply_text(text)


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.message
    if not message:
        return

    chat = message.chat
    if not _is_allowed_chat(chat.id):
        return

    raw_text = (message.text or message.caption or "").strip()
    if not raw_text:
        return
    if raw_text.startswith("/"):
        return

    logger.info(
        "incoming message chat_id=%s has_photo=%s text_len=%s",
        chat.id,
        bool(getattr(message, "photo", None)),
        len(raw_text),
    )

    meta_parts = []
    fwd_chat = getattr(message, "forward_from_chat", None)
    fwd_user = getattr(message, "forward_from", None)
    if fwd_chat is not None:
        title = getattr(fwd_chat, "title", None) or getattr(fwd_chat, "username", "") or ""
        if title:
            meta_parts.append(f"Forwarded from channel: {title}")
    elif fwd_user is not None:
        uname = getattr(fwd_user, "username", "") or ""
        if uname:
            meta_parts.append(f"Forwarded from user: @{uname}")

    if meta_parts:
        text_for_api = "\n\n".join(meta_parts + [raw_text])
    else:
        text_for_api = raw_text

    photo_payload = None
    if message.photo:
        p = message.photo[-1]
        photo_payload = {
            "file_id": p.file_id,
            "file_unique_id": p.file_unique_id,
            "width": p.width,
            "height": p.height,
        }

    payload = {
        "text": text_for_api,
        "from": {
            "id": message.from_user.id if message.from_user else None,
            "username": message.from_user.username if message.from_user else None,
            "first_name": message.from_user.first_name if message.from_user else None,
            "last_name": message.from_user.last_name if message.from_user else None,
        },
        "chat": {
            "id": chat.id,
            "type": chat.type,
            "title": getattr(chat, "title", None),
            "username": getattr(chat, "username", None),
        },
    }
    if photo_payload:
        payload["photo"] = photo_payload

    await message.chat.send_action(action="typing")

    try:
        logger.info(
            "calling NEWS_API_URL with has_photo=%s",
            bool(photo_payload),
        )
        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(
                NEWS_API_URL,
                json=payload,
                headers={"x-telegram-bot-api-secret-token": TELEGRAM_WEBHOOK_SECRET},
            )
        data = res.json()
    except Exception as e:  # noqa: BLE001
        logger.exception("Error calling news API: %s", e)
        await message.reply_text("خطا در ارتباط با سرور خبر. لطفاً بعداً دوباره تلاش کن.")
        return

    if not res.is_success or not data.get("ok"):
        logger.error("News API error: status=%s body=%s", res.status_code, json.dumps(data))
        await message.reply_text("هوش مصنوعی نتوانست خبر را پردازش کند.")
        return

    en_url: Optional[str] = data.get("enUrl")
    fa_url: Optional[str] = data.get("faUrl")

    confirm_lines = ["خبر شما در سایت منتشر شد:"]
    if en_url:
        confirm_lines.append(f"EN: {en_url}")
    if fa_url:
        confirm_lines.append(f"FA: {fa_url}")

    await message.reply_text("\n".join(confirm_lines))


async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    logger.exception("Update caused error: %s", context.error)
    if not ADMIN_CHAT_ID:
        return
    try:
        await context.bot.send_message(
            chat_id=int(ADMIN_CHAT_ID),
            text=f"Bot error: {context.error}",
        )
    except (TelegramError, ValueError):
        pass


def main() -> None:
    _require_config()
    logger.info("Starting IEEE news Telegram bot ...")

    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    application.add_handler(CommandHandler("start", cmd_start))
    application.add_handler(
        MessageHandler(
            (filters.TEXT | filters.PHOTO) & ~filters.COMMAND,
            handle_message,
        )
    )
    application.add_error_handler(error_handler)

    application.run_polling()


if __name__ == "__main__":
    main()
