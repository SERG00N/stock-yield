const BASE_URL = 'https://iss.moex.com/iss'

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
 * Получение списка облигаций
 */
export async function fetchBonds() {
  // Запрашиваем данные с marketdata для получения цен
  // Добавляем ACCRUEDINT (НКД), COUPONVALUE (значение купона), COUPONPERIOD (периодичность в днях)
  // FACEVALUE - номинал облигации
  const url = `${BASE_URL}/engines/stock/markets/bonds/boards/TQCB/securities.json?iss.only=securities,marketdata&securities.columns=SECID,SHORTNAME,SECNAME,LOTSIZE,CURRENCYID,MATDATE,COUPONRATE,COUPONVALUE,ACCRUEDINT,COUPONPERIOD,PREVWAPRICE,PREVPRICE,FACEVALUE,FACEUNIT&marketdata.columns=SECID,LAST,LASTPREV,VOLUME,YIELD`

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Ошибка MOEX API: ${response.status}`)
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

  return bonds
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
 */
export async function fetchCouponHistory(secid, useBackup = true) {
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

    return coupons
  } catch (err) {
    console.error(`Ошибка при получении истории купонов для ${secid}:`, err)
    // Пытаемся получить из резервного источника
    if (useBackup) {
      try {
        const { fetchCouponHistoryFromSmartLab } = await import('./smartlab')
        const smartLabCoupons = await fetchCouponHistoryFromSmartLab(secid)
        if (smartLabCoupons.length > 0) {
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
 */
export async function fetchDividendHistory(secid, useBackup = true) {
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
        return await getDividendsFromBackupSources(secid)
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
        return await getDividendsFromBackupSources(secid)
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

    return dividends
  } catch (err) {
    console.error(`Ошибка при получении истории дивидендов для ${secid}:`, err)
    // Пытаемся получить из резервных источников
    if (useBackup) {
      return await getDividendsFromBackupSources(secid)
    }
    return []
  }
}

/**
 * Получение дивидендов из резервных источников
 * @param {string} secid - Тикер акции
 * @returns {Promise<Array>}
 */
async function getDividendsFromBackupSources(secid) {
  console.log(`MOEX API не вернул дивиденды для ${secid}, пробуем резервные источники...`)
  
  // 1. Пробуем Smart-Lab
  try {
    const { fetchDividendHistoryFromSmartLab } = await import('./smartlab')
    const smartLabDividends = await fetchDividendHistoryFromSmartLab(secid)
    if (smartLabDividends.length > 0) {
      console.log(`Smart-Lab вернул ${smartLabDividends.length} дивидендов для ${secid}`)
      return smartLabDividends
    }
  } catch (smartLabErr) {
    console.log('Smart-Lab не вернул данные:', smartLabErr.message)
  }
  
  // 2. Пробуем встроеннюю базу
  try {
    const { getDividendsFromDatabase } = await import('./dividendDatabase')
    const databaseDividends = getDividendsFromDatabase(secid)
    if (databaseDividends.length > 0) {
      console.log(`Встроенная база вернула ${databaseDividends.length} дивидендов для ${secid}`)
      return databaseDividends
    }
  } catch (dbErr) {
    console.log('Встроенная база не вернула данные:', dbErr.message)
  }
  
  console.log(`Дивиденды для ${secid} не найдены ни в одном источнике`)
  return []
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
    currency: bond.CURRENCYID || 'RUB',
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
