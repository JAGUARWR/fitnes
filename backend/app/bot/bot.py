import asyncio
import logging
from typing import Optional
from aiogram import Bot, Dispatcher
from aiogram.client.telegram import TelegramAPIServer
from aiogram.client.session.aiohttp import AiohttpSession
from app.core.config import settings
from app.bot.handlers import router as bot_router

logger = logging.getLogger(__name__)

bot: Optional[Bot] = None
dp: Optional[Dispatcher] = None
bot_task: Optional[asyncio.Task] = None


async def start_bot():
    """Initializes and runs the Aiogram bot polling in the background if BOT_TOKEN is provided."""
    global bot, dp, bot_task

    if not settings.BOT_TOKEN or settings.BOT_TOKEN == "YOUR_TELEGRAM_BOT_TOKEN_HERE":
        logger.info("BOT_TOKEN not set. Bot not started, REST API active.")
        return

    try:
        proxy_url = getattr(settings, 'TELEGRAM_API_PROXY', '')
        if proxy_url:
            custom_api = TelegramAPIServer.from_base(proxy_url)
            session = AiohttpSession(api=custom_api)
            bot = Bot(token=settings.BOT_TOKEN, session=session)
            logger.info(f"Using Telegram API proxy: {proxy_url}")
        else:
            bot = Bot(token=settings.BOT_TOKEN)

        dp = Dispatcher()
        dp.include_router(bot_router)

        logger.info("Starting Telegram bot (polling)...")
        bot_task = asyncio.create_task(dp.start_polling(bot))
    except Exception as e:
        logger.error(f"Bot start error: {e}", exc_info=True)


async def stop_bot():
    """Gracefully stops the bot polling."""
    global bot, dp, bot_task
    if bot_task:
        bot_task.cancel()
    if bot:
        await bot.session.close()
        logger.info("Telegram bot stopped.")
