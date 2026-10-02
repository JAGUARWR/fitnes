# Редизайн главной страницы в премиальный Apple Fitness Glassmorphism (TMA Gym Tracker)

## Стек и архитектура
- **React 18/19 + TypeScript + Vite + Tailwind CSS**
- **Дизайн-система**: Apple Fitness / iOS Glassmorphism (Apple Design Awards standard)
- **Telegram WebApp SDK**: HapticFeedback, viewport safe areas, theme parameters

---

## Реализованные компоненты

### 1. [`frontend/src/components/home/AppleFitnessHomeView.tsx`](file:///c:/Users/user/Documents/antigravity/amazing-babbage/frontend/src/components/home/AppleFitnessHomeView.tsx)
- Главный контейнер экрана в стиле Apple Fitness.
- Премиальный градиент `bg-gradient-to-b from-[#0B101B] via-[#080B11] to-[#040608]` с мягкими фоновыми радиальными размытиями.
- Хедер с текущей датой, приветствием по имени атлета (из Telegram WebApp `initDataUnsafe.user?.first_name`), интерактивным бейджем веса и круглой кнопкой профиля.
- Герой-блок «Готов к тренировке» с неоновым свечением и кнопкой-пилюлей Play.
- Блок программы тренировок с днями сплита, иконками групп мышц, счетчиком упражнений и рекордами.

### 2. [`frontend/src/components/home/AppleActivityRings.tsx`](file:///c:/Users/user/Documents/antigravity/amazing-babbage/frontend/src/components/home/AppleActivityRings.tsx)
- Кольцо активности Apple Fitness с круговым SVG-прогрессбаром.
- Метрики выполненных тренировок за неделю, тоннажа и серии недель.

### 3. [`frontend/src/components/home/QuickWeightModal.tsx`](file:///c:/Users/user/Documents/antigravity/amazing-babbage/frontend/src/components/home/QuickWeightModal.tsx)
- Модальное окно быстрого взвешивания в стеклянном стиле `backdrop-blur-2xl`.
- Кнопки точной регулировки (±0.5 кг) и пресеты.
- Виброотклик Telegram HapticFeedback при взаимодействии.

### 4. [`frontend/src/components/common/BottomNavigation.tsx`](file:///c:/Users/user/Documents/antigravity/amazing-babbage/frontend/src/components/common/BottomNavigation.tsx)
- Плавающий стеклянный бар `fixed bottom-4 left-4 right-4 bg-[#0F172A]/70 backdrop-blur-2xl border border-white/10 rounded-full`.
- 5 вкладок: Тренировка, Программы, Упражнения, Аналитика, Профиль.
- Неоновая точка и свечение активной вкладки.

---

## Запуск и проверка
- **Адрес приложения**: `http://localhost:8000`
- **Бэкенд**: FastAPI + SQLite + Uvicorn
- **Фронтенд**: Vite bundle в `frontend/dist`
