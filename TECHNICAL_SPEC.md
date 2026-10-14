# Техническая документация: Landing page «Внедрение ИИ-агентов»
## Версия 2.0 — High-Tech Monospace (SiteAi Direction)

---

## 1. Общее описание

Одностраничный сайт-визитка для услуг по внедрению ИИ-агентов в бизнес-процессы.

**Концепция дизайна:** Industrial Tech Terminal. Визуальный язык — инженерный терминал: моноширинная типографика, тёмный фон с координатной сеткой, циановые акценты, строгая модульная сетка, «печать» текста и характерные tech-детали. Не китч, не «Матрица», а рефайнд индустриальный минимализм.

**Цель:** конверсия посетителя в заявку через форму.

---

## 2. Стек

- **HTML5** — семантическая вёрстка, `index.html`.
- **CSS3** — `css/styles.css`: каскад, Grid, Flexbox, CSS-переменные, keyframe-анимации.
- **JavaScript** — `js/main.js`: валидация формы, маска телефона, отправка, Intersection Observer для scroll-анимаций.
- **Хостинг:** статика (GitHub Pages / Cloudflare Pages).
- **Форма:** Formspree + Telegram Bot API.

---

## 3. Файловая структура

```
project-site/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── main.js
├── assets/
│   └── logo.png       # скопировать из logo's/Project-Ai/VK reserve.png
└── TECHNICAL_SPEC.md
```

---

## 4. Типографика и шрифты

- **Google Fonts CDN:**
  - **Display / H1 / H2 / Nav:** `Share Tech Mono` (400). Технологичный, моноширинный, узнаваемый характер.
  - **Body / Form / UI:** `IBM Plex Mono` (400, 500). Современный, читаемый, моноширинный.
- **Запасные:** `monospace`.
- **Никаких** Inter, Roboto, Arial, system-ui для основного текста.
- **Размеры:**
  - H1: `clamp(2.5rem, 5vw, 4.5rem)`
  - H2: `clamp(1.5rem, 3vw, 2.5rem)`
  - Body: `0.9375rem` (15px)
  - Nav / Labels: `0.8125rem` (13px), uppercase, letter-spacing `0.05em`

---

## 5. Цвета (CSS-переменные)

```css
:root {
  --bg-primary:   #06060a;   /* глубокий near-black с синевой */
  --bg-secondary: #0c0c14;   /* чуть светлее для панелей */
  --bg-card:      #0f0f18;   /* фон карточек */
  --text-primary: #c8c8d4;   /* мягкий светло-серый */
  --text-bright:  #ffffff;    /* чистый белый для акцентов */
  --text-muted:   #505060;   /* тёмный серый для второстепенного */
  --accent:       #00f0ff;   /* циан — primary accent */
  --accent-dim:   #008f99;   /* приглушённый циан */
  --border:       #1a1a2e;   /* рамки панелей */
  --grid-line:    #0e0e18;   /* линии сетки */
  --error:        #ff3366;
  --success:      #00ff99;
}
```

**Принцип:** доминантный тёмный фон, резкий циановый акцент на критичных элементах. Никаких градиентов purple-pink.

---

## 6. Фон и текстуры (только CSS)

### 6.1. Координатная сетка
```css
background-image:
  linear-gradient(to right, var(--grid-line) 1px, transparent 1px),
  linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px);
background-size: 40px 40px;
```

### 6.2. Subtle scanlines
```css
background: repeating-linear-gradient(
  0deg, transparent, transparent 2px, rgba(0,240,255,0.015) 2px, rgba(0,240,255,0.015) 4px
);
```

### 6.3. Film grain (noise)
SVG-фильтр `feTurbulence` в inline SVG, применён через CSS `filter: url(#noise)` к псевдоэлементу с pointer-events: none.

---

## 7. Секции

### 7.1. Hero (id="hero")

- **Nav:** фиксированная панель сверху (`position: fixed`), фон `--bg-primary` с `backdrop-filter: blur(4px)`.
  - Лево: логотип `assets/logo.png` (~32px высота), alt="ЭСПБ".
  - Право: якорные ссылки `> УСЛУГИ`, `> ПОЧЕМУ МЫ`, `> ФОРМА`, `> КОНТАКТЫ`.
  - Активный пункт: перед текстом добавляется символ `>` с цветом `--accent` и анимацией пульсации.
- **Композиция:** асимметричная. H1 смещён влево, занимает 70% ширины.
- **H1:** `ВНЕДРЯЕМ ИИ-АГЕНТОВ` + `<br>` + `В БИЗНЕС-ПРОЦЕССЫ`.
  - Share Tech Mono, uppercase.
  - Каждая строка — staggered reveal (`opacity` + `translateY`), задержка между строками `0.15s`.
- **Подзаголовок (IBM Plex Mono):**
  - Эффект печати (typewriter): `border-right: 2px solid var(--accent)` + `@keyframes blink`.
  - Текст: `Устраняем рутину. Оптимизируем процессы. Измеряем экономику.`
- **CTA:**
  - `[ ОСТАВИТЬ ЗАЯВКУ ]` — рамка `1px solid var(--accent)`, без background.
  - При hover: background `--accent`, color `--bg-primary`, `box-shadow: 0 0 20px rgba(0,240,255,0.3)`.
- **Декор:** справа в Hero — абсолютно позиционированный блок с псевдо-ASCII / декоративной сеткой (сгенерировано CSS, не картинка).

### 7.2. Польза (id="benefits")

- **H2:** `02 // ПОЛЬЗА` (префикс-номер секции в `--text-muted`).
- **Layout:** CSS Grid, 3 колонки на десктопе, 1 на мобиле. Gap `24px`.
- **Карточки (data blocks):**
  - Фон `--bg-card`, border `1px solid var(--border)`.
  - Левый border-top / border-left акцент: `2px solid var(--accent)`.
  - Внутри: номер `01`, `02`, `03` (крупный, `--text-muted`), заголовок H3, описание.
  - **Hover:** border-color переходит в `--accent-dim`, лёгкий `box-shadow: 0 0 15px rgba(0,240,255,0.05)`.
- **Reveal:** секция появляется при скролле через Intersection Observer — opacity + translateY(30px) → 0, duration `0.8s`.

### 7.3. Доверие (id="trust")

- **H2:** `03 // ПОЧЕМУ МЫ`
- **Layout:** нестандартная. Левая колонка — 40%: текст описания. Правая — 60%: 3 горизонтальных «data rows».
- **Data rows:**
  - `10+` / `ЛЕТ В БИЗНЕСЕ`
  - `РФ` / `ФОКУС РЫНКА`
  - `ООО` / `ЭСПБ`
  - Цифры — `Share Tech Mono`, `clamp(2rem, 4vw, 4rem)`, цвет `--accent`.
- **Формат:** разделители-линии между рядами (`border-bottom: 1px solid var(--border)`).

### 7.4. Форма (id="contact-form")

- **H2:** `04 // ОБСУДИМ ЗАДАЧУ`
- **Контейнер:** панель с фоном `--bg-secondary`, border `1px solid var(--border)`, внутренний padding `clamp(1.5rem, 4vw, 3rem)`.
- **Поля:**
  - `<label>`: uppercase, `0.75rem`, `text-muted`, перед полем.
  - `<input>`, `<textarea>`: фон `--bg-primary`, border `1px solid var(--border)`, цвет `--text-primary`, шрифт `IBM Plex Mono`.
  - Placeholder: `--text-muted`.
  - **Focus:** border-color `--accent`, `box-shadow: 0 0 8px rgba(0,240,255,0.15)`.
  - **Мигающий курсор:** псевдоэлемент `::after` на поле в фокусе (`_` мигающий) — опционально, если не мешает UX.
- **Кнопка:**
  - Текст: `[ ОТПРАВИТЬ ]`
  - Рамка `1px solid var(--accent)`, без фона.
  - Hover: фон `--accent`, текст `--bg-primary`, glow.
- **Сообщения:**
  - Успех: `>> ЗАЯВКА ПРИНЯТА. ОЖИДАЙТЕ СВЯЗИ.` цвет `--success`.
  - Ошибка: `>> ОШИБКА ПЕРЕДАЧИ ДАННЫХ.` цвет `--error`.

### 7.5. Контакты (id="contacts")

- **Layout:** footer, минимальный.
- **H2:** `05 // КОНТАКТЫ`
- **Данные:**
  - `TEL: +7 (...) ...` — ссылка `tel:`
  - `EMAIL: ...` — ссылка `mailto:`
  - `TG: t.me/...` — внешняя ссылка
  - `LOC: SAINT PETERSBURG, RU`
  - Шрифт `IBM Plex Mono`, формат `KEY: VALUE`.
- **Разделитель:** линия `border-top: 1px solid var(--border)`.
- **Copyright:** `© 2026 ООО ЭСПБ // EOF` — по центру, `--text-muted`, `0.75rem`.

---

## 8. Анимации и Motion

### 8.1. Page Load
- Nav появляется сразу.
- H1 — staggered reveal строк (`animation-delay` на каждой строке).
- Подзаголовок — typewriter с задержкой после H1.
- CTA — fade-in последним.

### 8.2. Scroll Reveal
- Использовать `IntersectionObserver` (threshold `0.15`).
- Элементы с классом `.reveal` получают класс `.visible` при входе в viewport.
- CSS: `.reveal { opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }`
- CSS: `.reveal.visible { opacity: 1; transform: translateY(0); }`
- Stagger: у дочерних карточек `transition-delay: calc(var(--i) * 0.1s)`.

### 8.3. Micro-interactions
- **Ссылки в nav:** hover → `text-shadow: 0 0 8px var(--accent)`.
- **Кнопки:** hover → background fill + glow (чистый CSS, `transition: all 0.3s ease`).
- **Карточки:** hover → border color shift + subtle lift (`translateY(-2px)`).
- **Фокус инпутов:** рамка пульсирует (`box-shadow` transition).

---

## 9. Адаптивность (Mobile-First)

- **< 768px:**
  - Nav: бургер-меню или перенос в 2 строки (простое, без JS overlay — скрыть часть пунктов или сделать flex-wrap).
  - Hero: H1 по центру, ASCII-декор скрыт.
  - Польза / Доверие: 1 колонка.
  - Форма: поля на всю ширину, кнопка на всю ширину.
- **768px – 1024px:** Польза — 2 колонки.
- **> 1024px:** Польза — 3 колонки. Hero — асимметричная композиция.

---

## 10. Интеграции

### Formspree
- Endpoint: `https://formspree.io/f/XXXXXXXX`.
- POST JSON. При `200` — показать success-сообщение.

### Telegram Bot
- Endpoint: `https://api.telegram.org/bot<BOT_TOKEN>/sendMessage`.
- Параметры: `chat_id`, `parse_mode: HTML`.
- Текст формируется в `main.js`: `<b>Заявка с сайта</b>\nИмя: ...`.
- **Безопасность:** токен хранится в константе внутри `main.js` (приемлемо для статического лендинга).

---

## 11. Чек-лист для агента-разработчика

- [ ] Скопировать логотип `logo's/Project-Ai/VK reserve.png` → `assets/logo.png`.
- [ ] Создать `index.html`:
  - Подключить Google Fonts (Share Tech Mono, IBM Plex Mono).
  - Inline SVG noise filter в `<body>`.
  - 5 семантических секций с якорями.
  - ARIA-labels на навигации и форме.
- [ ] Создать `css/styles.css`:
  - Все CSS-переменные.
  - Сетка, scanlines, noise.
  - Все keyframe-анимации.
  - Mobile-first responsive.
- [ ] Создать `js/main.js`:
  - Intersection Observer.
  - Маска телефона (регулярное выражение или простая логика).
  - Отправка Formspree + Telegram.
  - Typewriter эффект для подзаголовка.
- [ ] **Проверить:** нет ли использования generic шрифтов (Inter, Roboto) в CSS.
- [ ] **Проверить:** DevTools (320px, 768px, 1440px).
- [ ] **Не подключать:** jQuery, Bootstrap, React, Vue, анимационные библиотеки (GSAP).

---

## 12. Anti-Patterns (SiteAi)

- ❌ Generic gradient backgrounds.
- ❌ Purple / pink цветовые схемы.
- ❌ Bootstrap-карточки или Material UI-паттерны.
- ❌ System-ui / -apple-system / Inter / Roboto как основные шрифты.
- ❌ Симметричные, предсказуемые центрированные блоки без характера.
- ❌ Анимации ради анимаций — каждый motion должен усиливать terminal-эстетику.
