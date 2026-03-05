/**
 * Smart-Lab API
 * Резервный источник для купонной истории облигаций
 * 
 * Внимание: Smart-Lab не имеет официального API, используем парсинг
 */

const BASE_URL = 'https://smart-lab.ru'

/**
 * Получение купонной истории облигации с Smart-Lab
 * @param {string} ticker - Тикер облигации (например, RU000A108Z93)
 * @returns {Promise<Array>} - История купонов [{date, value, accrued, paid}]
 */
export async function fetchCouponHistoryFromSmartLab(ticker) {
  try {
    // Smart-Lab использует URL вида /bond/{TICKER}/
    const url = `${BASE_URL}/bond/${ticker}/`

    // Пробуем несколько CORS-прокси по очереди
    const proxyUrls = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
    ]

    let lastError = null
    
    for (const proxyUrl of proxyUrls) {
      try {
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        const html = data.contents || data.body || ''

        if (!html || html.length < 100) {
          throw new Error('Пустой ответ')
        }

        // Парсим HTML для получения купонов
        const coupons = parseCouponsFromHTML(html, ticker)

        if (coupons.length > 0) {
          console.log(`Smart-Lab вернул ${coupons.length} купонов для ${ticker}`)
          return coupons
        }
        
        // Если купонов не найдено, пробуем следующий прокси
        lastError = new Error('Купоны не найдены')
      } catch (proxyErr) {
        console.warn(`Прокси не сработал (${proxyUrl}):`, proxyErr.message)
        lastError = proxyErr
        // Продолжаем пробовать следующий прокси
      }
    }

    // Если все прокси не сработали
    console.error(`Все прокси не сработали для ${ticker}:`, lastError)
    return []
  } catch (err) {
    console.error(`Smart-Lab API error for ${ticker}:`, err)
    return [] // Возвращаем пустой массив при ошибке
  }
}

/**
 * Парсинг HTML для извлечения купонов
 * @param {string} html - HTML страница
 * @param {string} ticker - Тикер облигации
 * @returns {Array} - Массив купонов
 */
function parseCouponsFromHTML(html, ticker) {
  const coupons = []
  
  try {
    // Создаём временный DOM элемент для парсинга
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // Ищем таблицу с купонами
    // Smart-Lab обычно использует таблицу с классом "coupons" или similar
    const tables = doc.querySelectorAll('table')
    
    for (const table of tables) {
      const headers = table.querySelectorAll('th')
      const headerText = Array.from(headers).map(th => th.textContent.trim().toLowerCase())
      
      // Проверяем, таблица ли это с купонами
      if (headerText.some(h => h.includes('дата') || h.includes('купон'))) {
        const rows = table.querySelectorAll('tr')
        
        for (let i = 1; i < rows.length; i++) { // Пропускаем заголовок
          const cells = rows[i].querySelectorAll('td')
          if (cells.length >= 3) {
            const couponData = extractCouponData(cells, ticker)
            if (couponData) {
              coupons.push(couponData)
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Error parsing Smart-Lab HTML:', err)
  }
  
  return coupons
}

/**
 * Извлечение данных купона из ячеек таблицы
 * @param {NodeList} cells - Ячейки таблицы
 * @param {string} ticker - Тикер облигации
 * @returns {Object|null} - Данные купона или null
 */
function extractCouponData(cells, ticker) {
  try {
    // Пытаемся извлечь дату, сумму купона и накопленный доход
    const dateCell = cells[0]?.textContent.trim()
    const valueCell = cells[1]?.textContent.trim()
    const accruedCell = cells[2]?.textContent.trim()
    
    // Парсим дату (формат может быть DD.MM.YYYY)
    const date = parseRussianDate(dateCell)
    
    // Парсим сумму купона (может быть в формате "15.23 ₽" или "15.23")
    const value = parseRussianMoney(valueCell)
    
    // Парсим накопленный доход
    const accrued = parseRussianMoney(accruedCell)
    
    if (date && value) {
      return {
        date: date.toISOString(),
        value,
        accrued: accrued || 0,
        source: 'smart-lab'
      }
    }
  } catch (err) {
    console.error('Error extracting coupon data:', err)
  }
  
  return null
}

/**
 * Парсинг русской даты в формате DD.MM.YYYY
 * @param {string} dateStr - Строка даты
 * @returns {Date|null}
 */
function parseRussianDate(dateStr) {
  if (!dateStr) return null
  
  // Пробуем формат DD.MM.YYYY
  const match = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/)
  if (match) {
    const [, day, month, year] = match
    return new Date(year, month - 1, day)
  }
  
  // Пробуем формат DD.MM.YY
  const matchShort = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{2})/)
  if (matchShort) {
    const [, day, month, year] = matchShort
    return new Date(2000 + parseInt(year), month - 1, day)
  }
  
  return null
}

/**
 * Парсинг денежной суммы в рублях
 * @param {string} moneyStr - Строка с суммой
 * @returns {number|null}
 */
function parseRussianMoney(moneyStr) {
  if (!moneyStr) return null
  
  // Удаляем символы валюты и пробелы
  const clean = moneyStr
    .replace(/[₽$€]/g, '')
    .replace(/\s/g, '')
    .replace(/,/g, '.')
  
  const value = parseFloat(clean)
  return isNaN(value) ? null : value
}

/**
 * Получение календаря купонов (будущие выплаты)
 * @param {string} ticker - Тикер облигации
 * @returns {Promise<Array>} - Будущие купоны
 */
export async function fetchUpcomingCoupons(ticker) {
  try {
    const url = `${BASE_URL}/bond/${ticker}/`
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
    
    const response = await fetch(proxyUrl)
    if (!response.ok) {
      throw new Error(`Ошибка при запросе к Smart-Lab: ${response.status}`)
    }
    
    const data = await response.json()
    const html = data.contents
    
    // Парсим будущие купоны
    const upcomingCoupons = parseUpcomingCouponsFromHTML(html)
    
    return upcomingCoupons
  } catch (err) {
    console.error(`Smart-Lab upcoming coupons error for ${ticker}:`, err)
    return []
  }
}

/**
 * Парсинг будущих купонов из HTML
 * @param {string} html - HTML страница
 * @returns {Array} - Будущие купоны
 */
function parseUpcomingCouponsFromHTML(html) {
  const coupons = []
  
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // Ищем секцию с будущими купонами
    // Обычно это таблица с заголовком "Купоны" или "Предстоящие выплаты"
    const tables = doc.querySelectorAll('table')
    
    for (const table of tables) {
      const headers = table.querySelectorAll('th')
      const headerText = Array.from(headers).map(th => th.textContent.trim().toLowerCase())
      
      if (headerText.some(h => h.includes('дата') || h.includes('выплата'))) {
        const rows = table.querySelectorAll('tr')
        
        for (let i = 1; i < rows.length; i++) {
          const cells = rows[i].querySelectorAll('td')
          if (cells.length >= 2) {
            const dateStr = cells[0]?.textContent.trim()
            const date = parseRussianDate(dateStr)
            
            // Если дата в будущем, добавляем купон
            if (date && date > new Date()) {
              const value = parseRussianMoney(cells[1]?.textContent)
              if (value) {
                coupons.push({
                  date: date.toISOString(),
                  value,
                  isEstimated: true
                })
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Error parsing upcoming coupons:', err)
  }
  
  return coupons
}

/**
 * Получение информации об облигации
 * @param {string} ticker - Тикер облигации
 * @returns {Promise<Object>} - Информация об облигации
 */
export async function fetchBondInfo(ticker) {
  try {
    const url = `${BASE_URL}/bond/${ticker}/`
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
    
    const response = await fetch(proxyUrl)
    if (!response.ok) {
      throw new Error(`Ошибка при запросе к Smart-Lab: ${response.status}`)
    }
    
    const data = await response.json()
    const html = data.contents
    
    const info = parseBondInfoFromHTML(html, ticker)
    
    return info
  } catch (err) {
    console.error(`Smart-Lab bond info error for ${ticker}:`, err)
    return null
  }
}

/**
 * Парсинг информации об облигации
 * @param {string} html - HTML страница
 * @param {string} ticker - Тикер
 * @returns {Object} - Информация об облигации
 */
function parseBondInfoFromHTML(html, ticker) {
  const info = {
    ticker,
    name: '',
    faceValue: null,
    couponRate: null,
    maturityDate: null,
    currentPrice: null
  }
  
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // Ищем основную информацию
    const title = doc.querySelector('h1')
    if (title) {
      info.name = title.textContent.replace(ticker, '').trim()
    }
    
    // Ищем параметры в таблице или списке
    const tables = doc.querySelectorAll('table')
    
    for (const table of tables) {
      const rows = table.querySelectorAll('tr')
      
      for (const row of rows) {
        const cells = row.querySelectorAll('td, th')
        if (cells.length >= 2) {
          const label = cells[0]?.textContent.trim().toLowerCase()
          const value = cells[1]?.textContent.trim()
          
          if (label.includes('номинал') || label.includes('face value')) {
            info.faceValue = parseRussianMoney(value)
          }
          
          if (label.includes('купон') || label.includes('coupon rate')) {
            info.couponRate = parseFloat(value.replace('%', ''))
          }
          
          if (label.includes('погашение') || label.includes('maturity')) {
            info.maturityDate = parseRussianDate(value)
          }
          
          if (label.includes('цена') || label.includes('price')) {
            info.currentPrice = parseRussianMoney(value)
          }
        }
      }
    }
  } catch (err) {
    console.error('Error parsing bond info:', err)
  }
  
  return info
}

/**
 * Получение истории дивидендов по акции с Smart-Lab
 * @param {string} ticker - Тикер акции (например, SBER, GAZP)
 * @returns {Promise<Array>} - История дивидендов [{date, amount, type, period}]
 */
export async function fetchDividendHistoryFromSmartLab(ticker) {
  try {
    // Smart-Lab использует URL вида /q/{TICKER}/d/ для дивидендов
    const url = `${BASE_URL}/q/${ticker}/d/`

    // Пробуем несколько CORS-прокси по очереди
    const proxyUrls = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
    ]

    let lastError = null
    
    for (const proxyUrl of proxyUrls) {
      try {
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        const html = data.contents || data.body || ''

        if (!html || html.length < 100) {
          throw new Error('Пустой ответ')
        }

        // Парсим HTML для получения дивидендов
        const dividends = parseDividendsFromHTML(html, ticker)

        if (dividends.length > 0) {
          console.log(`Smart-Lab вернул ${dividends.length} дивидендов для ${ticker}`)
          return dividends
        }
        
        // Если дивидендов не найдено, пробуем следующий прокси
        lastError = new Error('Дивиденды не найдены')
      } catch (proxyErr) {
        console.warn(`Прокси не сработал (${proxyUrl}):`, proxyErr.message)
        lastError = proxyErr
        // Продолжаем пробовать следующий прокси
      }
    }

    // Если все прокси не сработали
    console.error(`Все прокси не сработали для ${ticker}:`, lastError)
    return []
  } catch (err) {
    console.error(`Smart-Lab dividend history error for ${ticker}:`, err)
    return [] // Возвращаем пустой массив при ошибке
  }
}

/**
 * Парсинг HTML для извлечения дивидендов
 * @param {string} html - HTML страница
 * @param {string} ticker - Тикер акции
 * @returns {Array} - Массив дивидендов
 */
function parseDividendsFromHTML(html, ticker) {
  const dividends = []
  
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // Ищем таблицу с дивидендами
    // Smart-Lab обычно использует таблицу с заголовком "Дивиденды"
    const tables = doc.querySelectorAll('table')
    
    for (const table of tables) {
      const headers = table.querySelectorAll('th')
      const headerText = Array.from(headers).map(th => th.textContent.trim().toLowerCase())
      
      // Проверяем, таблица ли это с дивидендами
      if (headerText.some(h => h.includes('дата') || h.includes('дивиденд') || h.includes('выплата'))) {
        const rows = table.querySelectorAll('tr')
        
        for (let i = 1; i < rows.length; i++) { // Пропускаем заголовок
          const cells = rows[i].querySelectorAll('td')
          if (cells.length >= 2) {
            const dividendData = extractDividendData(cells, ticker)
            if (dividendData) {
              dividends.push(dividendData)
            }
          }
        }
      }
    }
    
    // Если не нашли в таблицах, ищем в других элементах
    if (dividends.length === 0) {
      // Ищем элементы с классами, связанными с дивидендами
      const dividendElements = doc.querySelectorAll('[class*="dividend"], [class*="дивиденд"]')
      
      dividendElements.forEach(el => {
        const text = el.textContent
        const match = text.match(/(\d{1,2}\.\d{2}\.\d{4})\s*[:\-]?\s*(\d+\.?\d*)\s*₽?/i)
        if (match) {
          const [, dateStr, amountStr] = match
          const date = parseRussianDate(dateStr)
          const amount = parseFloat(amountStr)
          
          if (date && !isNaN(amount)) {
            dividends.push({
              date: date.toISOString(),
              amount,
              ticker,
              source: 'smart-lab'
            })
          }
        }
      })
    }
  } catch (err) {
    console.error('Error parsing Smart-Lab dividends HTML:', err)
  }
  
  return dividends
}

/**
 * Извлечение данных дивиденда из ячеек таблицы
 * @param {NodeList} cells - Ячейки таблицы
 * @param {string} ticker - Тикер акции
 * @returns {Object|null} - Данные дивиденда или null
 */
function extractDividendData(cells, ticker) {
  try {
    // Пытаемся извлечь дату, сумму и тип дивиденда
    const dateCell = cells[0]?.textContent.trim()
    const amountCell = cells[1]?.textContent.trim()
    const typeCell = cells[2]?.textContent.trim()
    const periodCell = cells[3]?.textContent.trim()
    
    // Парсим дату
    const date = parseRussianDate(dateCell)
    
    // Парсим сумму дивиденда (может быть в формате "15.23 ₽" или "15.23")
    const amount = parseRussianMoney(amountCell)
    
    // Тип дивиденда (обычный, привилегированный)
    const type = parseDividendType(typeCell)
    
    // Период (год или квартал)
    const period = periodCell || extractYearFromDate(date)
    
    if (date && amount) {
      return {
        date: date.toISOString(),
        amount,
        type,
        period,
        ticker,
        source: 'smart-lab'
      }
    }
  } catch (err) {
    console.error('Error extracting dividend data:', err)
  }
  
  return null
}

/**
 * Определение типа дивиденда
 * @param {string} typeStr - Строка типа
 * @returns {string} - Тип дивиденда
 */
function parseDividendType(typeStr) {
  if (!typeStr) return 'common'
  
  const lower = typeStr.toLowerCase()
  
  if (lower.includes('прив')) return 'preferred'
  if (lower.includes('обыкн')) return 'common'
  if (lower.includes('кварт')) return 'quarterly'
  if (lower.includes('год')) return 'annual'
  
  return 'common'
}

/**
 * Извлечение года из даты
 * @param {Date} date - Дата
 * @returns {string} - Год
 */
function extractYearFromDate(date) {
  if (!date) return ''
  return date.getFullYear().toString()
}

/**
 * Получение календаря дивидендов (будущие выплаты)
 * @param {string} ticker - Тикер акции
 * @returns {Promise<Array>} - Будущие дивиденды
 */
export async function fetchUpcomingDividends(ticker) {
  try {
    const url = `${BASE_URL}/q/${ticker}/d/`
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
    
    const response = await fetch(proxyUrl)
    if (!response.ok) {
      throw new Error(`Ошибка при запросе к Smart-Lab: ${response.status}`)
    }
    
    const data = await response.json()
    const html = data.contents
    
    // Парсим будущие дивиденды
    const upcomingDividends = parseUpcomingDividendsFromHTML(html, ticker)
    
    return upcomingDividends
  } catch (err) {
    console.error(`Smart-Lab upcoming dividends error for ${ticker}:`, err)
    return []
  }
}

/**
 * Парсинг будущих дивидендов из HTML
 * @param {string} html - HTML страница
 * @param {string} ticker - Тикер
 * @returns {Array} - Будущие дивиденды
 */
function parseUpcomingDividendsFromHTML(html, ticker) {
  const dividends = []
  
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // Ищем секцию с будущими дивидендами
    const tables = doc.querySelectorAll('table')
    
    for (const table of tables) {
      const headers = table.querySelectorAll('th')
      const headerText = Array.from(headers).map(th => th.textContent.trim().toLowerCase())
      
      if (headerText.some(h => h.includes('дата') || h.includes('выплата'))) {
        const rows = table.querySelectorAll('tr')
        
        for (let i = 1; i < rows.length; i++) {
          const cells = rows[i].querySelectorAll('td')
          if (cells.length >= 2) {
            const dateStr = cells[0]?.textContent.trim()
            const date = parseRussianDate(dateStr)
            
            // Если дата в будущем, добавляем дивиденд
            if (date && date > new Date()) {
              const amountStr = cells[1]?.textContent.trim()
              const amount = parseRussianMoney(amountStr)
              
              if (amount) {
                dividends.push({
                  date: date.toISOString(),
                  amount,
                  ticker,
                  isEstimated: true,
                  source: 'smart-lab'
                })
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Error parsing upcoming dividends:', err)
  }
  
  return dividends
}

/**
 * Получение информации об акции
 * @param {string} ticker - Тикер акции
 * @returns {Promise<Object>} - Информация об акции
 */
export async function fetchStockInfoFromSmartLab(ticker) {
  try {
    const url = `${BASE_URL}/q/${ticker}/`
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
    
    const response = await fetch(proxyUrl)
    if (!response.ok) {
      throw new Error(`Ошибка при запросе к Smart-Lab: ${response.status}`)
    }
    
    const data = await response.json()
    const html = data.contents
    
    const info = parseStockInfoFromHTML(html, ticker)
    
    return info
  } catch (err) {
    console.error(`Smart-Lab stock info error for ${ticker}:`, err)
    return null
  }
}

/**
 * Парсинг информации об акции
 * @param {string} html - HTML страница
 * @param {string} ticker - Тикер
 * @returns {Object} - Информация об акции
 */
function parseStockInfoFromHTML(html, ticker) {
  const info = {
    ticker,
    name: '',
    sector: '',
    marketCap: null,
    peRatio: null,
    dividendYield: null,
    lastPrice: null
  }
  
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // Ищем заголовок с названием
    const title = doc.querySelector('h1')
    if (title) {
      info.name = title.textContent.replace(ticker, '').trim()
    }
    
    // Ищем параметры в таблице
    const tables = doc.querySelectorAll('table')
    
    for (const table of tables) {
      const rows = table.querySelectorAll('tr')
      
      for (const row of rows) {
        const cells = row.querySelectorAll('td, th')
        if (cells.length >= 2) {
          const label = cells[0]?.textContent.trim().toLowerCase()
          const value = cells[1]?.textContent.trim()
          
          if (label.includes('капитализация') || label.includes('market cap')) {
            info.marketCap = parseRussianMoney(value)
          }
          
          if (label.includes('p/e') || label.includes('price earnings')) {
            info.peRatio = parseFloat(value)
          }
          
          if (label.includes('дивидендн') || label.includes('dividend yield')) {
            info.dividendYield = parseFloat(value.replace('%', ''))
          }
          
          if (label.includes('цена') || label.includes('last price')) {
            info.lastPrice = parseRussianMoney(value)
          }
          
          if (label.includes('сектор') || label.includes('sector')) {
            info.sector = value
          }
        }
      }
    }
  } catch (err) {
    console.error('Error parsing stock info:', err)
  }
  
  return info
}
