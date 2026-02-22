# Stock Yield Viewer

Веб-приложение для просмотра доходности акций и облигаций Московской биржи с функцией управления инвестиционным портфелем.

## Обзор проекта

**Stack технологий:**
- **Frontend:** React 19, Vite 7
- **UI:** React Bootstrap, Bootstrap Icons
- **Роутинг:** React Router DOM
- **Данные:** MOEX ISS API (Московская биржа)
- **Хранение:** localStorage (для портфеля)

**Архитектура:**
```
src/
├── api/
│   └── moex.js          # API клиент для MOEX ISS
├── components/
│   ├── Header.jsx       # Навигационная шапка
│   ├── SearchBar.jsx    # Поиск бумаг
│   ├── StockCard.jsx    # Карточка акции
│   ├── StockTable.jsx   # Таблица акций
│   ├── LoadingSpinner.jsx
│   ├── ErrorDisplay.jsx
│   └── AddToPortfolioModal.jsx  # Модальное окно добавления
├── hooks/
│   ├── useStocks.js     # Хук загрузки акций
│   └── usePortfolio.js  # Хук управления портфелем
├── pages/
│   └── PortfolioPage.jsx  # Страница портфеля
├── App.jsx              # Основной компонент с роутингом
├── App.css              # Глобальные стили (тёмная тема)
└── main.jsx             # Точка входа
```

## Функционал

### Главная страница (`/`)
- Список акций с Мосбиржи (режим торгов TQBR)
- Карточки топ-3 акций с ценой, изменением, объёмом
- Таблица всех акций с сортировкой
- Поиск по тику или названию
- Отображение в рублях (₽)

### Портфель (`/portfolio`)
- Добавление акций и облигаций в портфель
- Раздельные кнопки для акций и облигаций
- Расчёт стоимости портфеля
- Расчёт прибыли/убытка (P&L)
- Сохранение данных в localStorage
- Удаление позиций

### API MOEX
- `fetchStocks()` — список акций
- `fetchBonds()` — список облигаций
- `fetchStockByCode(code)` — данные по акции
- `fetchCandles(code, from, to)` — исторические свечи
- `transformStockData()` / `transformBondData()` — трансформация данных

## Сборка и запуск

```bash
# Перейти в директорию проекта
cd stock-yield-viewer

# Установить зависимости
npm install

# Запуск dev-сервера (http://localhost:5173)
npm run dev

# Сборка для продакшена
npm run build

# Предпросмотр продакшен-сборки
npm run preview

# Линтинг кода
npm run lint
```

## Структура данных

### Акция (Stock)
```javascript
{
  id: string,         // Тикер (SECID)
  ticker: string,
  name: string,
  price: number,      // Цена в рублях
  change: number,     // Изменение в рублях
  changePercent: number,
  yield: number,      // Дивидендная доходность %
  volume: string,     // Объём торгов (форматированный)
  currency: string,   // 'RUB'
  lotSize: number
}
```

### Облигация (Bond)
```javascript
{
  id: string,         // ISIN тикер
  ticker: string,
  shortname: string,  // Короткое название
  name: string,
  price: number,
  change: number,
  changePercent: number,
  yield: number,      // Доходность %
  volume: string,
  currency: string,
  lotSize: number,
  type: 'bond',
  maturityDate: string|null,
  couponRate: number|null
}
```

### Позиция портфеля
```javascript
{
  id: number,         // Уникальный ID (Date.now())
  securityId: string,
  ticker: string,
  name: string,
  type: 'stock'|'bond',
  quantity: number,
  avgPrice: number    // Средняя цена покупки
}
```

## Стили и тема

**Тёмная тема** с CSS переменными:
- `--bg-primary`: #1a1a2e (основной фон)
- `--bg-secondary`: #16213e (вторичный фон)
- `--bg-card`: #0f3460 (фон карточек)
- `--text-primary`: #eee (основной текст)
- `--accent`: #e94560 (акцентный цвет)
- `--success`: #00d26a (рост/прибыль)
- `--danger`: #f8312f (падение/убыток)

## Разработка

### Добавление нового компонента
1. Создать файл в `src/components/ComponentName.jsx`
2. Экспортировать компонент как `export default`
3. Импортировать в нужном месте

### Добавление новой страницы
1. Создать файл в `src/pages/PageName.jsx`
2. Добавить роут в `App.jsx`:
   ```jsx
   <Route path="/new-page" element={<PageName />} />
   ```
3. Добавить ссылку в `Header.jsx`

### Работа с API MOEX
- Документация: https://iss.moex.com/iss/reference/
- Базовый URL: `https://iss.moex.com/iss`
- Режимы торгов: TQBR (акции), TQCB (облигации)
- API бесплатный, не требует ключей

## Известные ограничения

- Облигации загружаются асинхронно при открытии страницы портфеля
- Портфель хранится только в localStorage (теряется при очистке кэша)
- Нет авторизации и синхронизации между устройствами
- Данные обновляются только при перезагрузке страницы
