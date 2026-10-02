import asyncio
import logging
from typing import Optional
from aiogram import Bot, Dispatcher
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
        logger.info("ℹ️ BOT_TOKEN не указан в .env. Бот не запущен, но REST API и Mini App активны.")
        return

    try:
        bot = Bot(token=settings.BOT_TOKEN)
        dp = Dispatcher()
        dp.include_router(bot_router)

        logger.info("🚀 Запуск Telegram-бота (polling)...")
        # Run polling in asyncio background task
        bot_task = asyncio.create_task(dp.start_polling(bot))
    except Exception as e:
        logger.error(f"❌ Ошибка запуска Telegram-бота: {e}")


async def stop_bot():
    """Gracefully stops the bot polling."""
    global bot, dp, bot_task
    if bot_task:
        bot_task.cancel()
    if bot:
        await bot.session.close()
        logger.info("🛑 Telegram-бот остановлен.")
