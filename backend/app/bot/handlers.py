from aiogram import Router, types
from aiogram.filters import CommandStart, Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo, MenuButtonWebApp
from app.core.config import settings

router = Router()


@router.message(CommandStart())
async def cmd_start(message: types.Message):
    """
    Handles /start command.
    Sets the bot MenuButton to open WebApp directly, and sends a welcome message with a button.
    """
    # 1. Setup MenuButtonWebApp in Telegram UI
    try:
        await message.bot.set_chat_menu_button(
            chat_id=message.chat.id,
            menu_button=MenuButtonWebApp(
                text="💪 Открыть зал",
                web_app=WebAppInfo(url=settings.WEBAPP_URL)
            )
        )
    except Exception:
        pass

    # 2. Inline Keyboard
    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🚀 Начать тренировку (Mini App)",
                    web_app=WebAppInfo(url=settings.WEBAPP_URL)
                )
            ],
            [
                InlineKeyboardButton(
                    text="📋 Подобрать программу",
                    web_app=WebAppInfo(url=f"{settings.WEBAPP_URL}#programs")
                )
            ]
        ]
    )

    welcome_text = (
        f"👋 Привет, {message.from_user.first_name}!\n\n"
        "🏋️ **Добро пожаловать в твой умный Telegram-дневник тренировок!**\n\n"
        "Здесь ты можешь:\n"
        "• 🎯 **Сгенерировать программу** под свой вес, опыт и цели (Full Body, Сплит, Верх/Низ)\n"
        "• ⏱ **Записывать подходы прямо во время отдыха** с автоматическим таймером и виброоткликом\n"
        "• 📈 **Следить за ростом 1RM** и суммарным тоннажем\n"
        "• 📖 Использовать встроенную базу из 30+ базовых упражнений с техникой выполнения\n\n"
        "Нажми кнопку ниже или кнопку **«💪 Открыть зал»** в меню слева от поля ввода сообщения!"
    )

    await message.answer(welcome_text, reply_markup=kb, parse_mode="Markdown")


@router.message(Command("workout"))
async def cmd_workout(message: types.Message):
    """Direct shortcut to open live workout session."""
    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="⚡ Открыть тренировку сейчас",
                    web_app=WebAppInfo(url=settings.WEBAPP_URL)
                )
            ]
        ]
    )
    await message.answer("Готов к подходу? Открывай дневник:", reply_markup=kb)


@router.message(Command("help"))
async def cmd_help(message: types.Message):
    """Help instructions."""
    text = (
        "💡 **Как пользоваться приложением:**\n\n"
        "1. Нажми **«💪 Открыть зал»** внизу экрана.\n"
        "2. Во вкладке **«Программы»** укажи свой вес, уровень подготовки и желаемый формат (например, Full Body 3 дня или Жим/Тяга/Ноги).\n"
        "3. Нажми **«Сгенерировать»** — программа автоматически рассчитает сеты, повторы и время отдыха.\n"
        "4. Нажимай **«Начать тренировку»** в зале. Вводи рабочие веса и жми галочку — сразу запустится таймер отдыха!\n\n"
        "Удачной тренировки и новых рекордов! 🔥"
    )
    await message.answer(text, parse_mode="Markdown")
