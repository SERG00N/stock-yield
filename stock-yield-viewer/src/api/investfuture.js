/**
 * InvestFuture API для получения дивидендов
 * API: https://investfuture.ru/api
 */

const BASE_URL = 'https://investfuture.ru/api'

/**
 * Получить историю дивидендов из InvestFuture
 * @param {string} ticker - Тикер акции (например, YNDX)
 * @returns {Promise<Array>} - Массив дивидендов
 */
export async function fetchDividendsFromInvestFuture(ticker) {
  try {
    // InvestFuture использует публичное API
    const response = await fetch(`${BASE_URL}/dividends/${ticker.toUpperCase()}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        return []
      }
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.dividends || !Array.isArray(data.dividends)) {
      return []
    }

    // Преобразуем в наш формат
    return data.dividends.map(div => ({
      date: div.date, // YYYY-MM-DD
      amount: div.amount, // Сумма на 1 акцию
      period: div.period || div.year?.toString(),
      type: div.type || 'common', // common/preferred
      currency: div.currency || 'RUB'
    }))
  } catch (err) {
    console.error(`InvestFuture API error for ${ticker}:`, err.message)
    return []
  }
}

/**
 * Альтернативный endpoint - через CORS-прокси
 */
export async function fetchDividendsFromInvestFutureProxy(ticker) {
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`${BASE_URL}/dividends/${ticker.toUpperCase()}`)}`
    const response = await fetch(proxyUrl)
    
    if (!response.ok) {
      return []
    }

    const data = await response.json()
    
    if (!data.dividends || !Array.isArray(data.dividends)) {
      return []
    }

    return data.dividends.map(div => ({
      date: div.date,
      amount: div.amount,
      period: div.period || div.year?.toString(),
      type: div.type || 'common',
      currency: div.currency || 'RUB'
    }))
  } catch (err) {
    console.error(`InvestFuture Proxy API error for ${ticker}:`, err.message)
    return []
  }
}
