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
    
    // Делаем запрос через CORS-прокси (так как Smart-Lab не поддерживает CORS)
    // Используем allorigins.win как прокси
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
    
    const response = await fetch(proxyUrl)
    
    if (!response.ok) {
      throw new Error(`Ошибка при запросе к Smart-Lab: ${response.status}`)
    }
    
    const data = await response.json()
    const html = data.contents
    
    // Парсим HTML для получения купонов
    const coupons = parseCouponsFromHTML(html, ticker)
    
    return coupons
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
