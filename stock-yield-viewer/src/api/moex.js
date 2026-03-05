const BASE_URL = 'https://iss.moex.com/iss'

// ============================================================================
// КЭШИРОВАНИЕ ДАННЫХ
// ============================================================================

// Срок жизни кэша (в миллисекундах)
const CACHE_TTL = {
  COUPON_HISTORY: 24 * 60 * 60 * 1000, // 24 часа
  DIVIDEND_HISTORY: 24 * 60 * 60 * 1000, // 24 часа
  NEXT_COUPON_DATE: 6 * 60 * 60 * 1000, // 6 часов
  STOCKS: 5 * 60 * 1000, // 5 минут
  BONDS: 5 * 60 * 1000 // 5 минут
}

// Ключи для localStorage
const CACHE_KEYS = {
  COUPON_HISTORY: 'moex-cache-coupon-history',
  DIVIDEND_HISTORY: 'moex-cache-dividend-history',
  NEXT_COUPON_DATE: 'moex-cache-next-coupon',
  STOCKS: 'moex-cache-stocks',
  BONDS: 'moex-cache-bonds'
}

/**
 * Получение данных из кэша
 * @param {string} key - Ключ кэша
 * @param {number} ttl - Время жизни кэша в мс
 * @returns {any|null} Данные из кэша или null если кэш устарел/отсутствует
 */
function getFromCache(key, ttl) {
  try {
    const cached = localStorage.getItem(key)
    if (!cached) return null

    const { data, timestamp } = JSON.parse(cached)
    const now = Date.now()

    // Проверяем актуальность кэша
    if (now - timestamp > ttl) {
      localStorage.removeItem(key)
      return null
    }

    return data
  } catch {
    return null
  }
}

/**
 * Сохранение данных в кэш
 * @param {string} key - Ключ кэша
 * @param {any} data - Данные для сохранения
 */
function saveToCache(key, data) {
  try {
    const cacheEntry = {
      data,
      timestamp: Date.now()
    }
    localStorage.setItem(key, JSON.stringify(cacheEntry))
  } catch {
    // Если localStorage переполнен, очищаем старые записи
    clearOldCache()
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now()
      }
      localStorage.setItem(key, JSON.stringify(cacheEntry))
    } catch {
      // Игнорируем ошибки повторного сохранения
    }
  }
}

/**
 * Очистка старого кэша
 */
function clearOldCache() {
  try {
    const now = Date.now()
    const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 дней

    Object.values(CACHE_KEYS).forEach(key => {
      try {
        const cached = localStorage.getItem(key)
        if (!cached) return

        const { timestamp } = JSON.parse(cached)
        if (now - timestamp > maxAge) {
          localStorage.removeItem(key)
        }
      } catch {
        localStorage.removeItem(key)
      }
    })
  } catch {
    // Игнорируем ошибки очистки кэша
  }
}

/**
 * Очистка всего кэша
 */
export function clearAllCache() {
  Object.values(CACHE_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
  console.log('Кэш полностью очищен')
}

// ============================================================================
// API ФУНКЦИИ
// ============================================================================

/**
 * Получение текущих курсов валют (CBR.ru)
 * @returns {Promise<Object>} - Курсы валют { USD: 75.5, EUR: 82.3, ... }
 */
export async function fetchCurrencyRates() {
  const { currencyCache } = await import('./cbr')
  return currencyCache.getRates()
}

/**
 * Конвертация валюты
 * @param {number} amount - Сумма
 * @param {string} from - Из валюты
 * @param {string} to - В валюту
 * @returns {Promise<number>}
 */
export async function convertCurrency(amount, from, to) {
  const { convertCurrency } = await import('./cbr')
  return convertCurrency(amount, from, to)
}

/**
 * Получение списка акций с основными данными
 */
export async function fetchStocks() {
  const url = `${BASE_URL}/engines/stock/markets/shares/boards/TQBR/securities.json?iss.only=securities,marketdata`
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error(`Ошибка MOEX API: ${response.status}`)
  }
  
  const data = await response.json()
  
  // Получаем колонки и данные
  const securitiesColumns = data.securities.columns
  const securitiesData = data.securities.data
  
  const marketdataColumns = data.marketdata?.columns
  const marketdataData = data.marketdata?.data
  
  // Преобразуем в удобный формат
  const stocks = securitiesData.map(sec => {
    const security = {}
    securitiesColumns.forEach((col, i) => {
      security[col] = sec[i]
    })
    
    // Находим соответствующие рыночные данные
    const market = marketdataData?.find(m => m[0] === security.SECID)
    if (market && marketdataColumns) {
      marketdataColumns.forEach((col, i) => {
        security[`MARKET_${col}`] = market[i]
      })
    }
    
    return security
  })
  
  return stocks
}

/**
 * Получение данных по конкретной акции
 */
export async function fetchStockByCode(code) {
  const url = `${BASE_URL}/engines/stock/markets/shares/boards/TQBR/securities/${code}.json`
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error(`Ошибка MOEX API: ${response.status}`)
  }
  
  return await response.json()
}

/**
 * Получение исторических данных (свечи)
 */
export async function fetchCandles(code, from = null, to = null) {
  let url = `${BASE_URL}/engines/stock/markets/shares/boards/TQBR/securities/${code}/candles.json`
  const params = new URLSearchParams()
  
  if (from) params.append('from', from)
  if (to) params.append('to', to)
  
  if (params.toString()) {
    url += `?${params.toString()}`
  }
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error(`Ошибка MOEX API: ${response.status}`)
  }
  
  return await response.json()
}

/**
 * Форматирование объёма торгов
 */
function formatVolume(volume) {
  if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`
  if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`
  return volume.toString()
}

/**
 * Преобразование сырых данных MOEX в формат приложения
 */
export function transformStockData(stock) {
  const lastPrice = stock.MARKET_LAST || 0
  const previousPrice = stock.MARKET_LASTPREV || lastPrice
  const change = lastPrice - previousPrice
  const changePercent = previousPrice ? (change / previousPrice) * 100 : 0
  const volume = stock.MARKET_VOLUME || 0

  return {
    id: stock.SECID,
    ticker: stock.SECID,
    name: stock.name || stock.SHORTNAME || stock.SECID,
    price: lastPrice,
    change: change,
    changePercent: changePercent,
    yield: stock.MARKET_YIELD ? parseFloat(stock.MARKET_YIELD) : 0,
    volume: formatVolume(volume),
    currency: stock.CURRENCYID || 'RUB',
    lotSize: stock.LOTSIZE || 1
  }
}

/**
 * Получение списка облигаций с нескольких торговых досок
 * TQCB - корпоративные облигации
 * TQOB - облигации для квалифицированных инвесторов (включая ОФЗ)
 * TQRU - облигации в рублях
 */
export async function fetchBonds() {
  const boards = ['TQCB', 'TQOB', 'TQRU']
  const allBonds = []

  for (const board of boards) {
    try {
      const url = `${BASE_URL}/engines/stock/markets/bonds/boards/${board}/securities.json?iss.only=securities,marketdata&securities.columns=SECID,SHORTNAME,SECNAME,LOTSIZE,CURRENCYID,MATDATE,COUPONRATE,COUPONVALUE,ACCRUEDINT,COUPONPERIOD,PREVWAPRICE,PREVPRICE,FACEVALUE,FACEUNIT&marketdata.columns=SECID,LAST,LASTPREV,VOLUME,YIELD`

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        console.warn(`Не удалось загрузить облигации с доски ${board}: ${response.status}`)
        continue
      }

      const data = await response.json()

      const securitiesColumns = data.securities?.columns || []
      const securitiesData = data.securities?.data || []

      const marketdataColumns = data.marketdata?.columns || []
      const marketdataData = data.marketdata?.data || []

      const bonds = securitiesData.map(sec => {
        const security = {}
        securitiesColumns.forEach((col, i) => {
          security[col] = sec[i]
        })

        const market = marketdataData?.find(m => m[0] === security.SECID)
        if (market && marketdataColumns) {
          marketdataColumns.forEach((col, i) => {
            security[`MARKET_${col}`] = market[i]
          })
        }

        return security
      })

      allBonds.push(...bonds)
    } catch (err) {
      console.warn(`Ошибка при загрузке облигаций с доски ${board}:`, err.message)
    }
  }

  // Удаляем дубликаты по SECID (если облигация торгуется на нескольких досках)
  const uniqueBonds = allBonds.filter((bond, index, self) =>
    index === self.findIndex(b => b.SECID === bond.SECID)
  )

  return uniqueBonds
}

/**
 * Получение даты следующего купона для облигации
 */
export async function fetchNextCouponDate(secid) {
  try {
    const url = `${BASE_URL}/engines/stock/markets/bonds/securities/${secid}/coupons.json`

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    // Пробуем разные источники данных
    // 1. Из coupons.data
    const coupons = data.coupons?.data || []
    if (coupons.length > 0) {
      const columns = data.coupons?.columns || []
      const nextCouponIndex = columns.indexOf('NEXTCOUPON')

      if (nextCouponIndex !== -1 && coupons[0][nextCouponIndex]) {
        return coupons[0][nextCouponIndex]
      }
    }

    // 2. Из securities.data (если coupons не доступен)
    const securities = data.securities?.data || []
    if (securities.length > 0) {
      const columns = data.securities?.columns || []
      const nextCouponIndex = columns.indexOf('NEXTCOUPON')

      if (nextCouponIndex !== -1 && securities[0][nextCouponIndex]) {
        return securities[0][nextCouponIndex]
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Получение истории всех купонов для облигации
 * Возвращает массив объектов с датой и суммой купона
 * Данные кэшируются в localStorage на 24 часа
 */
export async function fetchCouponHistory(secid, useBackup = true, forceRefresh = false) {
  // Проверяем кэш
  const cacheKey = `${CACHE_KEYS.COUPON_HISTORY}:${secid}`
  
  if (!forceRefresh) {
    const cached = getFromCache(cacheKey, CACHE_TTL.COUPON_HISTORY)
    if (cached) {
      console.log(`[Кэш] Купоны для ${secid} загружены из кэша`)
      return cached
    }
  }

  try {
    const url = `${BASE_URL}/engines/stock/markets/bonds/securities/${secid}/coupons.json`

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      // Пытаемся получить из резервного источника (Smart-Lab)
      if (useBackup) {
        console.log(`MOEX API не вернул купоны для ${secid}, пробуем Smart-Lab...`)
        const { fetchCouponHistoryFromSmartLab } = await import('./smartlab')
        const smartLabCoupons = await fetchCouponHistoryFromSmartLab(secid)
        if (smartLabCoupons.length > 0) {
          // Сохраняем в кэш
          saveToCache(cacheKey, smartLabCoupons)
          console.log(`[Кэш] Купоны для ${secid} сохранены в кэш (Smart-Lab)`)
          return smartLabCoupons
        }
      }
      return []
    }

    const data = await response.json()

    // Получаем данные о купонах
    const couponsData = data.coupons?.data || []
    const columns = data.coupons?.columns || []

    if (couponsData.length === 0) {
      // Пустой результат, пробуем Smart-Lab
      if (useBackup) {
        console.log(`MOEX API вернул пустой список купонов для ${secid}, пробуем Smart-Lab...`)
        const { fetchCouponHistoryFromSmartLab } = await import('./smartlab')
        const smartLabCoupons = await fetchCouponHistoryFromSmartLab(secid)
        if (smartLabCoupons.length > 0) {
          // Сохраняем в кэш
          saveToCache(cacheKey, smartLabCoupons)
          console.log(`[Кэш] Купоны для ${secid} сохранены в кэш (Smart-Lab)`)
          return smartLabCoupons
        }
      }
      return []
    }

    // Индексы колонок
    const couponDateIndex = columns.indexOf('COUPONDATE')
    const couponValueIndex = columns.indexOf('COUPONVALUE')
    const couponAccruedIndex = columns.indexOf('COUPONACCRUED')

    // Преобразуем в удобный формат
    const coupons = couponsData.map(coupon => ({
      date: couponDateIndex !== -1 ? coupon[couponDateIndex] : null,
      value: couponValueIndex !== -1 ? (coupon[couponValueIndex] || 0) : 0,
      accrued: couponAccruedIndex !== -1 ? (coupon[couponAccruedIndex] || 0) : 0,
      source: 'moex'
    }))

    // Сортируем по дате (от старых к новым)
    coupons.sort((a, b) => new Date(a.date) - new Date(b.date))

    // Сохраняем в кэш
    saveToCache(cacheKey, coupons)
    console.log(`[Кэш] Купоны для ${secid} сохранены в кэш (MOEX)`)

    return coupons
  } catch (err) {
    console.error(`Ошибка при получении истории купонов для ${secid}:`, err)
    // Пытаемся получить из резервного источника
    if (useBackup) {
      try {
        const { fetchCouponHistoryFromSmartLab } = await import('./smartlab')
        const smartLabCoupons = await fetchCouponHistoryFromSmartLab(secid)
        if (smartLabCoupons.length > 0) {
          // Сохраняем в кэш
          saveToCache(cacheKey, smartLabCoupons)
          console.log(`[Кэш] Купоны для ${secid} сохранены в кэш (Smart-Lab)`)
          return smartLabCoupons
        }
      } catch (smartLabErr) {
        console.error('Smart-Lab также не вернул данные:', smartLabErr)
      }
    }
    return []
  }
}

/**
 * Расчёт дней до следующего купона
 */
export function daysUntilCoupon(nextCouponDate) {
  if (!nextCouponDate) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const couponDate = new Date(nextCouponDate)
  couponDate.setHours(0, 0, 0, 0)

  const diffTime = couponDate - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays >= 0 ? diffDays : 0
}

/**
 * Получение истории дивидендов для акции
 * Возвращает массив объектов с датой и суммой дивиденда
 * Источники: MOEX API → Smart-Lab → Встроенная база
 * Данные кэшируются в localStorage на 24 часа
 */
export async function fetchDividendHistory(secid, useBackup = true, forceRefresh = false) {
  // Проверяем кэш
  const cacheKey = `${CACHE_KEYS.DIVIDEND_HISTORY}:${secid}`
  
  if (!forceRefresh) {
    const cached = getFromCache(cacheKey, CACHE_TTL.DIVIDEND_HISTORY)
    if (cached) {
      console.log(`[Кэш] Дивиденды для ${secid} загружены из кэша`)
      return cached
    }
  }

  try {
    const url = `${BASE_URL}/engines/stock/markets/shares/securities/${secid}/dividends.json`

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      // Пытаемся получить из резервных источников
      if (useBackup) {
        const dividends = await getDividendsFromBackupSources(secid, cacheKey)
        return dividends
      }
      return []
    }

    const data = await response.json()

    // Получаем данные о дивидендах
    const dividendsData = data.dividends?.data || []
    const columns = data.dividends?.columns || []

    if (dividendsData.length === 0) {
      // Пустой результат, пробуем резервные источники
      if (useBackup) {
        const dividends = await getDividendsFromBackupSources(secid, cacheKey)
        return dividends
      }
      return []
    }

    // Индексы колонок
    const divDateIndex = columns.indexOf('DIVIDENDDATE')
    const divAmountIndex = columns.indexOf('DIVIDEND')
    const divPeriodIndex = columns.indexOf('DIVIDENDPERIOD')

    // Преобразуем в удобный формат
    const dividends = dividendsData.map(div => ({
      date: divDateIndex !== -1 ? div[divDateIndex] : null,
      amount: divAmountIndex !== -1 ? (div[divAmountIndex] || 0) : 0,
      period: divPeriodIndex !== -1 ? div[divPeriodIndex] : null,
      source: 'moex'
    }))

    // Сортируем по дате (от старых к новым)
    dividends.sort((a, b) => new Date(a.date) - new Date(b.date))

    // Сохраняем в кэш
    saveToCache(cacheKey, dividends)
    console.log(`[Кэш] Дивиденды для ${secid} сохранены в кэш (MOEX)`)

    return dividends
  } catch (err) {
    console.error(`Ошибка при получении истории дивидендов для ${secid}:`, err)
    // Пытаемся получить из резервных источников
    if (useBackup) {
      return await getDividendsFromBackupSources(secid, cacheKey)
    }
    return []
  }
}

/**
 * Получение дивидендов из резервных источников
 * @param {string} secid - Тикер акции
 * @param {string} cacheKey - Ключ кэша для сохранения
 * @returns {Promise<Array>}
 */
async function getDividendsFromBackupSources(secid, cacheKey) {
  console.log(`MOEX API не вернул дивиденды для ${secid}, пробуем резервные источники...`)

  let result = []

  // 1. Пробуем Smart-Lab
  try {
    const { fetchDividendHistoryFromSmartLab } = await import('./smartlab')
    const smartLabDividends = await fetchDividendHistoryFromSmartLab(secid)
    if (smartLabDividends.length > 0) {
      console.log(`Smart-Lab вернул ${smartLabDividends.length} дивидендов для ${secid}`)
      result = smartLabDividends
    }
  } catch (smartLabErr) {
    console.log('Smart-Lab не вернул данные:', smartLabErr.message)
  }

  // 2. Если Smart-Lab не вернул, пробуем InvestFuture API
  if (result.length === 0) {
    try {
      const { fetchDividendsFromInvestFuture, fetchDividendsFromInvestFutureProxy } = await import('./investfuture')
      let investFutureDividends = await fetchDividendsFromInvestFuture(secid)
      if (investFutureDividends.length === 0) {
        investFutureDividends = await fetchDividendsFromInvestFutureProxy(secid)
      }
      if (investFutureDividends.length > 0) {
        console.log(`InvestFuture вернул ${investFutureDividends.length} дивидендов для ${secid}`)
        result = investFutureDividends
      }
    } catch (ifErr) {
      console.log('InvestFuture не вернул данные:', ifErr.message)
    }
  }

  // 3. Если InvestFuture не вернул, пробуем встроеннюю базу
  if (result.length === 0) {
    try {
      const { getDividendsFromDatabase } = await import('./dividendDatabase')
      const databaseDividends = getDividendsFromDatabase(secid)
      if (databaseDividends.length > 0) {
        console.log(`Встроенная база вернула ${databaseDividends.length} дивидендов для ${secid}`)
        result = databaseDividends
      }
    } catch (dbErr) {
      console.log('Встроенная база не вернула данные:', dbErr.message)
    }
  }

  // Сохраняем результат в кэш
  if (result.length > 0 && cacheKey) {
    saveToCache(cacheKey, result)
    console.log(`[Кэш] Дивиденды для ${secid} сохранены в кэш (резервный источник)`)
  }

  if (result.length === 0) {
    console.log(`Дивиденды для ${secid} не найдены ни в одном источнике`)
  }
  
  return result
}

/**
 * Преобразование данных облигации в формат приложения
 */
export function transformBondData(bond) {
  // Цена в процентах от номинала
  const pricePercent = bond.MARKET_LAST || bond.PREVWAPRICE || 0
  // Номинал (по умолчанию 1000 рублей)
  const faceValue = bond.FACEVALUE || 1000
  
  // Рассчитываем реальную цену в рублях: процент × номинал / 100
  const lastPrice = (pricePercent * faceValue) / 100
  
  const previousPrice = ((bond.MARKET_LASTPREV || bond.PREVPRICE || pricePercent) * faceValue) / 100
  const change = lastPrice - previousPrice
  const changePercent = previousPrice ? (change / previousPrice) * 100 : 0
  const volume = bond.MARKET_VOLUME || bond.VOLUME || 0
  const yieldValue = bond.MARKET_YIELD || bond.YIELD || bond.YIELDATPREVWAPRICE || 0
  const couponValue = bond.COUPONVALUE || bond.COUPONRATE || 0
  const accruedInterest = bond.ACCRUEDINT || 0
  const couponPeriod = bond.COUPONPERIOD || 0

  // Определение валюты с несколькими источниками
  let currency = null
  const secid = bond.SECID || ''
  
  // 1. Сначала проверяем известные ISIN для юаневых облигаций (наивысший приоритет)
  const yuanBonds = [
    'RU000A10BY03', // Газпром капитал 003Р-15 (юани)
    'RU000A10B8H1', // Полюс Золото 001P-06 (юани)
    'RU000A10B7N6', // Роснефть 003P-18 (юани)
    'SU000A10BQ0Y', // ТрансФин-М БО-07 (юани)
    'RU000A10BX50', // Синара 002P-05 (юани)
  ]
  if (yuanBonds.includes(secid)) {
    currency = 'CNY'
  }
  
  // 2. Если не определено, пробуем определить по FACEUNIT (валюта номинала)
  if (!currency) {
    const faceUnit = bond.FACEUNIT || ''
    if (faceUnit.includes('CNY') || faceUnit.includes('юань') || faceUnit.includes('yuan')) {
      currency = 'CNY'
    } else if (faceUnit.includes('USD') || faceUnit.includes('долл')) {
      currency = 'USD'
    } else if (faceUnit.includes('EUR') || faceUnit.includes('евро')) {
      currency = 'EUR'
    }
  }

  // 3. Дополнительная проверка по названию для некоторых облигаций
  if (!currency) {
    const secName = (bond.SECNAME || bond.SHORTNAME || '').toUpperCase()
    if (secName.includes('ЮАНЬ') || secName.includes('CNY')) {
      currency = 'CNY'
    }
  }

  // 4. Если всё ещё не определено, используем CURRENCYID из MOEX
  if (!currency) {
    currency = bond.CURRENCYID || 'RUB'
  }
  
  // Нормализация валюты (SUR -> RUB)
  if (currency === 'SUR') {
    currency = 'RUB'
  }

  // console.log(`[MOEX] Облигация ${secid}, валюта: ${currency} (CURRENCYID: ${bond.CURRENCYID})`)

  return {
    id: bond.SECID,
    ticker: bond.SECID,
    shortname: bond.SHORTNAME || '',
    name: bond.SECNAME || bond.SHORTNAME || bond.SECID,
    price: lastPrice,
    pricePercent: pricePercent, // Сохраняем процент для отображения
    change: change,
    changePercent: changePercent,
    yield: yieldValue ? parseFloat(yieldValue) : 0,
    volume: formatVolume(volume),
    currency: currency,
    lotSize: bond.LOTSIZE || 1,
    type: 'bond',
    maturityDate: bond.MATDATE || null,
    couponRate: bond.COUPONRATE || null,
    couponValue: couponValue ? parseFloat(couponValue) : 0,
    accruedInterest: accruedInterest ? parseFloat(accruedInterest) : 0,
    couponPeriod: couponPeriod ? parseInt(couponPeriod) : 0,
    faceValue: faceValue // Номинал облигации
  }
}

/**
 * Форматирование периодичности купона
 */
export function formatCouponPeriod(days) {
  if (!days || days === 0) return '—'
  return `${days} дн.`
}

/**
 * Расчёт дней до погашения облигации
 */
export function daysUntilMaturity(maturityDate) {
  if (!maturityDate) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const matDate = new Date(maturityDate)
  matDate.setHours(0, 0, 0, 0)

  const diffTime = matDate - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

/**
 * Форматирование даты для отображения
 */
export function formatDate(dateString) {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
