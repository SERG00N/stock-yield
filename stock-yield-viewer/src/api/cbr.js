/**
 * CBR.ru API (Центральный Банк России)
 * Получение курсов валют
 * 
 * Официальный API: https://www.cbr.ru/development/SXML/
 * Бесплатный, не требует ключей
 */

const CBR_API_URL = 'https://www.cbr.ru/scripts/XML_daily.asp'
const CBR_JSON_URL = 'https://www.cbr-xml-daily.ru/daily_json.js'

/**
 * Коды валют
 */
export const CurrencyCodes = {
  USD: 'USD',
  EUR: 'EUR',
  CNY: 'CNY',
  GBP: 'GBP',
  JPY: 'JPY',
  CHF: 'CHF',
  RUB: 'RUB'
}

/**
 * Получение всех текущих курсов валют
 * @returns {Promise<Object>} - Объект с курсами валют { USD: 75.5, EUR: 82.3, ... }
 */
export async function fetchAllCurrencyRates() {
  try {
    // Используем альтернативный источник с JSON форматом
    // Официальный API CBR возвращает XML, что сложнее парсить
    const response = await fetch(CBR_JSON_URL)
    
    if (!response.ok) {
      throw new Error(`Ошибка CBR API: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Преобразуем в удобный формат
    const rates = {
      RUB: 1, // Базовая валюта
      USD: data.Valute.USD.Value,
      EUR: data.Valute.EUR.Value,
      CNY: data.Valute.CNY.Value,
      GBP: data.Valute.GBP.Value,
      JPY: data.Valute.JPY.Value,
      CHF: data.Valute.CHF.Value
    }
    
    // Добавляем дату обновления
    rates.lastUpdate = new Date(data.Date)
    
    return rates
  } catch (err) {
    console.error('CBR API error:', err)
    // Возвращаем курсы по умолчанию при ошибке
    return getDefaultRates()
  }
}

/**
 * Получение курса конкретной валюты
 * @param {string} currencyCode - Код валюты (USD, EUR, etc.)
 * @returns {Promise<number>} - Курс валюты в рублях
 */
export async function fetchCurrencyRate(currencyCode) {
  const rates = await fetchAllCurrencyRates()
  return rates[currencyCode.toUpperCase()] || null
}

/**
 * Конвертация суммы из одной валюты в другую
 * @param {number} amount - Сумма
 * @param {string} fromCurrency - Из валюты
 * @param {string} toCurrency - В валюту
 * @returns {Promise<number>} - Конвертированная сумма
 */
export async function convertCurrency(amount, fromCurrency, toCurrency) {
  const rates = await fetchAllCurrencyRates()
  
  const fromRate = rates[fromCurrency.toUpperCase()]
  const toRate = rates[toCurrency.toUpperCase()]
  
  if (!fromRate || !toRate) {
    throw new Error(`Неизвестный код валюты: ${fromCurrency} или ${toCurrency}`)
  }
  
  // Конвертируем в рубли, затем в целевую валюту
  const inRubles = amount * fromRate
  const result = inRubles / toRate
  
  return result
}

/**
 * Получение истории курсов валют за период
 * @param {string} currencyCode - Код валюты
 * @param {Date} startDate - Дата начала
 * @param {Date} endDate - Дата окончания
 * @returns {Promise<Array>} - Массив { date, rate }
 */
export async function fetchCurrencyHistory(currencyCode, startDate, endDate) {
  try {
    // Форматируем даты для API
    const startStr = formatDateForCBR(startDate)
    const endStr = formatDateForCBR(endDate)
    
    // Используем официальный XML API для истории
    const url = `${CBR_API_URL}?date_req1=${startStr}&date_req2=${endStr}`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Ошибка CBR API: ${response.status}`)
    }
    
    const xmlText = await response.text()
    const history = parseCBRXML(xmlText, currencyCode.toUpperCase())
    
    return history
  } catch (err) {
    console.error('CBR history error:', err)
    return []
  }
}

/**
 * Форматирование даты для CBR API (DD/MM/YYYY)
 * @param {Date} date - Дата
 * @returns {string}
 */
function formatDateForCBR(date) {
  const d = date.getDate().toString().padStart(2, '0')
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

/**
 * Парсинг XML ответа от CBR
 * @param {string} xmlText - XML строка
 * @param {string} targetCurrency - Целевая валюта
 * @returns {Array}
 */
function parseCBRXML(xmlText, targetCurrency) {
  const history = []
  
  try {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
    
    const valutes = xmlDoc.querySelectorAll('Valute')
    
    valutes.forEach(valute => {
      const charCode = valute.querySelector('CharCode')?.textContent
      
      if (charCode === targetCurrency) {
        const dateEl = valute.parentNode.querySelector('Date') || 
                       xmlDoc.querySelector('Date')
        const value = valute.querySelector('Value')?.textContent
        const nominal = parseFloat(valute.querySelector('Nominal')?.textContent || '1')
        
        // Парсим дату (формат: DD.MM.YYYY)
        const dateStr = dateEl?.textContent || ''
        const dateParts = dateStr.split('.')
        const date = dateParts.length === 3 
          ? new Date(dateParts[2], dateParts[1] - 1, dateParts[0])
          : new Date()
        
        // Парсим значение (формат: XX,XXXX)
        const rate = parseFloat(value?.replace(',', '.') || '0') / nominal
        
        if (rate > 0) {
          history.push({
            date: date.toISOString(),
            rate,
            nominal
          })
        }
      }
    })
  } catch (err) {
    console.error('Error parsing CBR XML:', err)
  }
  
  return history
}

/**
 * Курсы валют по умолчанию (при ошибке API)
 * @returns {Object}
 */
function getDefaultRates() {
  return {
    RUB: 1,
    USD: 75.0,
    EUR: 82.0,
    CNY: 11.5,
    GBP: 95.0,
    JPY: 0.55,
    CHF: 85.0,
    lastUpdate: new Date()
  }
}

/**
 * Хук для получения и кэширования курсов валют
 * Можно использовать в компонентах React
 */
export class CurrencyCache {
  constructor() {
    this.cache = null
    this.cacheTime = null
    this.cacheTTL = 5 * 60 * 1000 // 5 минут
  }
  
  /**
   * Получение актуальных курсов с кэшированием
   * @returns {Promise<Object>}
   */
  async getRates() {
    const now = Date.now()
    
    // Проверяем кэш
    if (this.cache && this.cacheTime && (now - this.cacheTime < this.cacheTTL)) {
      return this.cache
    }
    
    // Загружаем свежие данные
    this.cache = await fetchAllCurrencyRates()
    this.cacheTime = now
    
    // Сохраняем в localStorage для персистентности
    try {
      localStorage.setItem('cbr-currency-rates', JSON.stringify({
        rates: this.cache,
        timestamp: now
      }))
    } catch (err) {
      console.warn('Failed to save currency rates to localStorage:', err)
    }
    
    return this.cache
  }
  
  /**
   * Загрузка из localStorage
   * @returns {Object|null}
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('cbr-currency-rates')
      if (stored) {
        const { rates, timestamp } = JSON.parse(stored)
        const now = Date.now()
        
        // Проверяем актуальность (не старше 1 часа)
        if (now - timestamp < 60 * 60 * 1000) {
          return rates
        }
      }
    } catch (err) {
      console.warn('Failed to load currency rates from localStorage:', err)
    }
    
    return null
  }
}

// Экспорт синглтона кэша
export const currencyCache = new CurrencyCache()

/**
 * Утилита для форматирования суммы с валютой
 * @param {number} amount - Сумма
 * @param {string} currency - Код валюты
 * @param {Object} rates - Курсы валют
 * @returns {string} - Отформатированная строка
 */
export function formatCurrency(amount, currency, rates = {}) {
  const symbols = {
    RUB: '₽',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CNY: '¥',
    CHF: 'Fr'
  }
  
  const symbol = symbols[currency] || currency
  const formatted = amount.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  
  return `${formatted} ${symbol}`
}

/**
 * Определение типа валюты по тикеру облигации
 * @param {string} ticker - Тикер облигации
 * @returns {string} - Код валюты (RUB, USD, EUR, etc.)
 */
export function detectCurrencyFromTicker(ticker) {
  // Российские рублёвые облигации обычно не имеют суффикса
  // Валютные облигации могут иметь суффиксы:
  // - SUXX (USD)
  // - SUEX (EUR)
  // - и т.д.
  
  const tickerUpper = ticker.toUpperCase()
  
  if (tickerUpper.includes('SUXX') || tickerUpper.includes('USD')) {
    return CurrencyCodes.USD
  }
  
  if (tickerUpper.includes('SUEX') || tickerUpper.includes('EUR')) {
    return CurrencyCodes.EUR
  }
  
  if (tickerUpper.includes('CNY')) {
    return CurrencyCodes.CNY
  }
  
  // По умолчанию — рубли
  return CurrencyCodes.RUB
}
