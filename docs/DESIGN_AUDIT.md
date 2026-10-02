# 🎨 Дизайн-аудит: Gym Tracker (Telegram WebApp)

**Дата:** 2026-10-03  
**Стек:** React 18 + TypeScript + Tailwind CSS + Vite  
**Платформа:** Telegram Mini App (мобильный, max-w-md)  
**Иконографика:** lucide-react  

---

## 📊 Общая оценка: 6.5 / 10

Приложение имеет крепкую функциональную базу и грамотную мобильную структуру, но страдает от **двух конкурирующих дизайн-систем**, хаотичных токенов и отсутствия единого визуального языка.

---

## 🔴 Критические проблемы

### 1. Две конфликтующие цветовые системы

В приложении одновременно сосуществуют **два разных акцентных цвета**:

| Область | Акцент | Палитра |
|---------|--------|---------|
| `App.tsx`, `BottomNavigation`, `LiveWorkoutView` | **Синий** `#0A84FF`, `sky-400` | iOS Glass |
| `ProgramsView`, `AnalyticsView`, `ProfileView`, `OnboardingQuiz`, `WorkoutExerciseCard`, `RestTimer` | **Зелёный** `green-500` | Gym Dark |

**Проблема:** Пользователь видит разные цвета навигации, кнопок, чекбоксов и фокуса на разных вкладках. Это разрушает целостность продукта.

**Рекомендация:** Выбрать один акцентный цвет и один набор семантических токенов. Синий (`#0A84FF`) более ассоциативен с iOS/Telegram, зелёный — с фитнесом. Варианты:
- **Единый синий** (рекомендуется — соответствует Telegram Design Language)
- **Единый зелёный** (если бренд — фитнес-зелёный)
- **Двухуровневый**: синий для навигации/CTA, зелёный только для success-состояний (выполненные подходы)

### 2. `AppleFitnessHomeView` — мёртвый компонент

Компонент `AppleFitnessHomeView.tsx` (320+ строк) + `AppleActivityRings.tsx` + `QuickWeightModal.tsx` **не используются** в `App.tsx`. Это ~500 строк мёртвого кода с отдельной дизайн-системой (glassmorphism, neon radial blurs, gradient text).

**Рекомендация:** Либо интегрировать, либо удалить. Хранение неиспользуемого кода создаёт путаницу.

### 3. Четыре разных фона

```
#07090E  — App.tsx, LiveWorkoutView (основной)
#0B101B  — AppleFitnessHomeView (gradient start)
#0F1115  — OnboardingQuiz
#080B11  — tailwind config (ios.bgDark / gym.bg)
```

**Рекомендация:** Один фиксированный фон. `#07090E` или `#080B11` — оба работают.

---

## 🟡 Средние проблемы

### 4. Несогласованные карточки

| Компонент | Фон карточки | Border | Blur | Radius |
|-----------|-------------|--------|------|--------|
| LiveWorkoutView | `#0F172A/80` | `white/7%` | `backdrop-blur-md` | `2xl` |
| ProgramsView | `#181B22` | `#262B37` | нет | `2xl` / `3xl` |
| AnalyticsView | `#181B22` | `#262B37` | нет | `2xl` |
| ProfileView | `#181B22` | `#262B37` | нет | `3xl` |
| ExerciseCatalogView | `#181B22` | `#252936` | нет | `2xl` |
| WorkoutExerciseCard | `#181B22` | `#262B37` | нет | `2xl` |
| BottomNavigation | `#0F172A/70` | `white/10` | `backdrop-blur-2xl` | `full` |

**Проблема:** Часть экранов использует glassmorphism (blur + полупрозрачность), часть — плоские тёмные карточки. Визуально это создаёт разрыв при переключении вкладок.

**Рекомендация:** Унифицировать. Выбрать один стиль:
- **Glass** (для premium-ощущения) — все карточки с `backdrop-blur-xl` + `bg-white/[0.04-0.07]` + `border-white/[0.06-0.1]`
- **Solid** (для производительности на слабых устройствах) — фиксированные `bg-[#131B2E]` + `border-white/[0.08]`

### 5. Инпуты — два стиля

**Стиль A** (ProfileView, OnboardingQuiz):
```
bg-[#12141A] border-[#2A2E3B] rounded-xl focus:border-green-500
```

**Стиль B** (WorkoutExerciseCard):
```
bg-[#1E222D] border-[#2E3444] rounded-lg focus:border-green-500
```

**Стиль C** (ExerciseCatalogView search):
```
bg-[#181B22] border-[#282C3A] rounded-2xl focus:border-green-500
```

Три разных стиля инпутов в одном приложении.

### 6. Эмодзи vs. Иконки

Lucide-react используется системно, но в нескольких местах применяются эмодзи:
- `OnboardingQuiz`: 👨 👩 🌱 🏋️ 🏆 💪 🛡 📏 🦵
- `ProfileView`: 💪 🛡 📏 🦵 (замеры тела)
- `ProgramsView`: ⚡ 📋 (табы)

**Рекомендация:** Заменить эмодзи на иконки lucide-react или SVG. Эмодзи выглядят по-разному на разных ОС и разрушают визуальную целостность.

### 7. Tailwind config не используется

`tailwind.config.js` определяет `gym.*` и `ios.*` цветовые токены, но **большинство компонентов используют hardcoded значения** (`bg-[#181B22]`, `text-green-400`) вместо `bg-gym-card`, `text-ios-cyan`.

**Рекомендация:** Либо удалить неиспользуемые токены из конфига, либо перевести все компоненты на них.

---

## 🟢 Сильные стороны

### 8. Мобильная навигация — отлично
- `BottomNavigation` — плавающая pill-навигация с glassmorphism
- Активная вкладка с glow-эффектом и пульсирующим бейджем
- Haptic feedback через Telegram WebApp API
- `active:scale-90` — тактильный отклик на нажатие

### 9. Accessibility (a11y)
- `prefers-reduced-motion` — отключение всех анимаций ✓
- `prefers-reduced-transparency` — замена blur на solid ✓
- `color-scheme: dark` ✓
- `user-select: none` + `-webkit-tap-highlight-color: transparent` ✓
- Семантические `role` для навигации

### 10. Анимации и micro-interactions
- Пульсирующий live-индикатор тренировки
- Rest timer с circular progress
- `active:scale-95` на всех кнопках
- Плавные transition на карточках программ

### 11. Типографика — хорошая иерархия
- System font stack (-apple-system, SF Pro) — нативно для iOS
- Чёткая шкала: `11px` → `12px` → `13px` → `14px` → `17px` → `20px` → `24px`
- `font-mono` для числовых значений (табличные данные)
- `tracking-tight` для заголовков, `tracking-wider` для labels

### 12. Telegram-интеграция
- Safe area insets через CSS-переменные
- Haptic feedback
- Telegram WebApp init
- Адаптация под viewport

---

## 📋 Токены для единой дизайн-системы

Предлагаемая унификация (на основе текущего синего iOS-стиля):

```js
// tailwind.config.js
colors: {
  surface: {
    bg:       '#07090E',   // основной фон
    card:     '#0F172A',   // карточки (70% opacity + blur)
    elevated: '#1E293B',   // hover, elevated
    input:    '#0F172A',   // инпуты
  },
  border: {
    DEFAULT:  'rgba(255,255,255,0.08)',
    subtle:   'rgba(255,255,255,0.05)',
    focus:    '#0A84FF',
  },
  accent: {
    DEFAULT:  '#0A84FF',   // primary CTA
    hover:    '#0070E0',
    muted:    'rgba(10,132,255,0.15)',
  },
  semantic: {
    success:  '#30D158',   // iOS green
    warning:  '#FF9F0A',   // iOS orange
    danger:   '#FF453A',   // iOS red
    info:     '#64D2FF',   // iOS cyan
  },
  text: {
    primary:   '#F8FAFC',
    secondary: '#94A3B8',
    tertiary:  '#64748B',
    disabled:  '#475569',
  },
}
```

---

## 🎯 Приоритетный план исправлений

| # | Задача | Влияние | Сложность |
|---|--------|---------|-----------|
| 1 | Унифицировать акцентный цвет (выбрать синий ИЛИ зелёный) | 🔴 Критично | Низкая |
| 2 | Унифицировать фоны (`#07090E` везде) | 🔴 Критично | Низкая |
| 3 | Унифицировать стили карточек (glass vs solid) | 🟡 Средне | Средняя |
| 4 | Перевести hardcoded цвета на tailwind-токены | 🟡 Средне | Средняя |
| 5 | Заменить эмодзи на иконки | 🟡 Средне | Низкая |
| 6 | Удалить или интегрировать `AppleFitnessHomeView` | 🟢 Низкое | Низкая |
| 7 | Унифицировать стили инпутов | 🟡 Средне | Низкая |
| 8 | Создать `DESIGN.md` с фиксированными токенами | 🟢 Превентивное | Средняя |

---

## 🔍 Детали по компонентам

### BottomNavigation ⭐ (эталон)
- Glass pill, floating, glow-индикатор
- Единственный компонент, использующий `backdrop-blur-2xl`
- **Проблема:** `bottom-4` — может конфликтовать с Telegram safe area

### LiveWorkoutView
- Использует синий акцент (`#0A84FF`) — **не совпадает** с зелёным в ProgramsView
- Отличная информационная архитектура: sticky header, чёткие секции
- Import bottom sheet — грамотный паттерн

### ProgramsView
- Зелёный акцент (`green-500`) — конфликт с навигацией
- Табы `grid grid-cols-2` — хорошо для mobile
- Генератор программ — хороший wizard-паттерн
- **Проблема:** `font-black` + `text-black` на зелёном фоне — слишком жирный, выглядит дёшево

### AnalyticsView
- Зелёный акцент — конфликт
- `font-black` + `font-mono` для чисел — хорошо
- Grid `grid-cols-2` для stat cards — правильно для mobile
- **Проблема:** Пустые состояния выглядят одинаково для всех секций

### ProfileView
- Зелёный акцент — конфликт
- Хорошая группировка форм (базовые параметры → замеры → настройки)
- BodyAnalysisCard — отличный информативный компонент
- **Проблема:** Telegram connection guide — dev-only контент, не нужен конечному пользователю

### OnboardingQuiz
- Зелёный акцент — конфликт
- 7-шаговый wizard с прогресс-баром — отличный UX
- Segmented progress track — визуально привлекательно
- **Проблема:** `min-h-screen justify-between` — может ломаться на коротких экранах

### ExerciseCatalogView
- Смешанный: основной контент — зелёный, модалка упражнения — синий (`#0A84FF`)
- Category pills — хороший паттерн для фильтрации
- **Проблема:** `overflow-x-auto` для pills без визуального индикатора скролла

---

## 📱 Responsive & Mobile

| Аспект | Оценка | Комментарий |
|--------|--------|-------------|
| Max-width constraint | ✅ | `max-w-md` везде — правильно для Telegram |
| Touch targets | ✅ | Все кнопки ≥ 44px |
| Safe areas | ⚠️ | BottomNavigation `bottom-4` без учёта safe-area-inset-bottom |
| Keyboard handling | ⚠️ | Нет обработки поднятия клавиатуры |
| Scroll performance | ✅ | Нет тяжёлых эффектов на scroll |
| Font sizes | ✅ | Минимум 10px, основной текст 13-14px |

---

## 💡 Итог

**Главная проблема приложения — не качество отдельных компонентов, а их визуальная разрозненность.** Каждый экран выглядит как отдельное приложение. Пользователь, переходя между вкладками, теряет ощущение единого продукта.

**Один рефакторинг цветовой системы + унификация карточек поднимут визуальное качество с 6.5 до 8+ баллов** без изменения функциональности.
