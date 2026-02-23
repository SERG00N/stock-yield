import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'stock-portfolio'
const COUPON_HISTORY_KEY = 'coupon-history'
const DIVIDEND_HISTORY_KEY = 'dividend-history'

/**
 * Экспорт портфеля в JSON формат
 */
export function exportPortfolioJSON(portfolio, couponHistory, dividendHistory) {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    portfolio,
    couponHistory,
    dividendHistory
  }
  return JSON.stringify(data, null, 2)
}

/**
 * Импорт портфеля из JSON формата
 */
export function importPortfolioJSON(jsonString) {
  const data = JSON.parse(jsonString)
  
  if (!data.portfolio || !Array.isArray(data.portfolio)) {
    throw new Error('Неверный формат файла: отсутствует портфель')
  }

  return {
    portfolio: data.portfolio,
    couponHistory: data.couponHistory || [],
    dividendHistory: data.dividendHistory || []
  }
}

/**
 * Экспорт портфеля в CSV формат
 */
export function exportPortfolioCSV(portfolio) {
  const headers = [
    'ID',
    'Тип',
    'Тикер',
    'Название',
    'Количество',
    'Средняя цена',
    'Дата покупки',
    'Получено купонов',
    'Получено дивидендов'
  ]

  const rows = portfolio.map(p => [
    p.id,
    p.type,
    p.ticker,
    `"${p.name.replace(/"/g, '""')}"`, // Экранирование кавычек
    p.quantity,
    p.avgPrice.toFixed(2),
    p.purchaseDate || '',
    p.receivedCoupons || 0,
    p.receivedDividends || 0
  ].join(','))

  return [headers.join(','), ...rows].join('\n')
}

/**
 * Импорт портфеля из CSV формата
 */
export function importPortfolioCSV(csvText) {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) {
    throw new Error('CSV файл пуст или содержит только заголовок')
  }

  // Пропускаем заголовок
  const dataLines = lines.slice(1)
  
  const portfolio = dataLines.map((line, index) => {
    // Парсинг CSV с учётом кавычек
    const values = []
    let current = ''
    let inQuotes = false
    
    for (let char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())

    const [id, type, ticker, name, quantity, avgPrice, purchaseDate, receivedCoupons, receivedDividends] = values

    return {
      id: parseInt(id) || Date.now() + index,
      type: type || 'stock',
      ticker: ticker || '',
      name: name.replace(/^"|"$/g, '').replace(/""/g, '"'), // Убираем кавычки
      quantity: parseInt(quantity) || 0,
      avgPrice: parseFloat(avgPrice) || 0,
      purchaseDate: purchaseDate || null,
      receivedCoupons: parseInt(receivedCoupons) || 0,
      receivedDividends: parseInt(receivedDividends) || 0,
      securityId: ticker // Используем тикер как securityId
    }
  })

  return { portfolio, couponHistory: [], dividendHistory: [] }
}

/**
 * Хук для управления портфелем бумаг
 * Данные сохраняются в localStorage
 */
export function usePortfolio() {
  const [portfolio, setPortfolio] = useState([])
  const [redeemedBonds, setRedeemedBonds] = useState([])
  const [couponHistory, setCouponHistory] = useState([])
  const [dividendHistory, setDividendHistory] = useState([])
  const [currencyRates, setCurrencyRates] = useState({ RUB: 1, USD: 75, EUR: 82 })
  const [baseCurrency, setBaseCurrency] = useState('RUB') // Базовая валюта портфеля
  const [loading, setLoading] = useState(true)

  // Загрузка портфеля из localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setPortfolio(JSON.parse(saved))
      }
      // Загрузка погашенных облигаций
      const savedRedeemed = localStorage.getItem('redeemed-bonds')
      if (savedRedeemed) {
        setRedeemedBonds(JSON.parse(savedRedeemed))
      }
      // Загрузка истории купонов
      const savedHistory = localStorage.getItem(COUPON_HISTORY_KEY)
      if (savedHistory) {
        setCouponHistory(JSON.parse(savedHistory))
      }
      // Загрузка истории дивидендов
      const savedDividendHistory = localStorage.getItem(DIVIDEND_HISTORY_KEY)
      if (savedDividendHistory) {
        setDividendHistory(JSON.parse(savedDividendHistory))
      }
      // Загрузка курсов валют из localStorage
      const savedRates = localStorage.getItem('currency-rates')
      if (savedRates) {
        setCurrencyRates(JSON.parse(savedRates))
      }
      // Загрузка базовой валюты портфеля
      const savedBaseCurrency = localStorage.getItem('portfolio-base-currency')
      if (savedBaseCurrency) {
        setBaseCurrency(savedBaseCurrency)
      }
    } catch (err) {
      console.error('Ошибка загрузки портфеля:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Загрузка актуальных курсов валют
  useEffect(() => {
    const loadRates = async () => {
      try {
        const { currencyCache } = await import('../api/cbr')
        const rates = await currencyCache.getRates()
        setCurrencyRates(rates)
        localStorage.setItem('currency-rates', JSON.stringify(rates))
      } catch (err) {
        console.error('Ошибка загрузки курсов валют:', err)
      }
    }
    loadRates()
  }, [])

  // Сохранение портфеля в localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio))
    }
  }, [portfolio, loading])

  // Сохранение погашенных облигаций в localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('redeemed-bonds', JSON.stringify(redeemedBonds))
    }
  }, [redeemedBonds, loading])

  // Сохранение истории купонов в localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(COUPON_HISTORY_KEY, JSON.stringify(couponHistory))
    }
  }, [couponHistory, loading])

  // Сохранение истории дивидендов в localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(DIVIDEND_HISTORY_KEY, JSON.stringify(dividendHistory))
    }
  }, [dividendHistory, loading])

  // Сохранение базовой валюты портфеля в localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('portfolio-base-currency', baseCurrency)
    }
  }, [baseCurrency, loading])

  // Добавление бумаги в портфель
  const addPosition = useCallback((position) => {
    const newPositionId = Date.now()
    
    setPortfolio(prev => {
      const existing = prev.find(p => p.securityId === position.securityId)
      if (existing) {
        // Обновляем существующую позицию
        return prev.map(p =>
          p.securityId === position.securityId
            ? {
                ...p,
                quantity: p.quantity + position.quantity,
                avgPrice: ((p.avgPrice * p.quantity) + (position.avgPrice * position.quantity)) / (p.quantity + position.quantity)
              }
            : p
        )
      }
      // Добавляем новую позицию
      return [...prev, { ...position, id: newPositionId }]
    })

    // Если есть полученные купоны, добавляем их в историю
    if (position.receivedCoupons > 0 && position.totalCouponAmount > 0) {
      // Добавляем запись для авто-купонов
      if (position.receivedCoupons > 0) {
        const autoCouponAmount = position.receivedCoupons * (position.manualCoupons?.length > 0 ? 0 : (position.totalCouponAmount / position.receivedCoupons))
        if (autoCouponAmount > 0) {
          setCouponHistory(prev => [
            ...prev,
            {
              id: Date.now() + 1,
              positionId: newPositionId,
              ticker: position.ticker,
              name: position.name,
              securityId: position.securityId,
              couponAmount: autoCouponAmount,
              quantity: position.quantity,
              date: new Date().toISOString(),
              isInitialCoupon: true,
              couponsCount: position.receivedCoupons - (position.manualCoupons?.length || 0)
            }
          ])
        }
      }
      
      // Добавляем записи для ручных купонов
      if (position.manualCoupons && position.manualCoupons.length > 0) {
        position.manualCoupons.forEach((coupon, idx) => {
          setCouponHistory(prev => [
            ...prev,
            {
              id: Date.now() + 10 + idx,
              positionId: newPositionId,
              ticker: position.ticker,
              name: position.name,
              securityId: position.securityId,
              couponAmount: coupon.amountPerBond * position.quantity,
              quantity: position.quantity,
              date: coupon.date,
              isManualCoupon: true
            }
          ])
        })
      }
    }
    
    // Если есть полученные дивиденды, добавляем их в историю
    if (position.receivedDividends > 0 && position.totalDividendAmount > 0) {
      setDividendHistory(prev => [
        ...prev,
        {
          id: Date.now() + 2,
          positionId: newPositionId,
          ticker: position.ticker,
          name: position.name,
          securityId: position.securityId,
          dividendAmount: position.totalDividendAmount,
          quantity: position.quantity,
          date: new Date().toISOString(),
          isInitialDividend: true, // Флаг для начальных дивидендов
          dividendsCount: position.receivedDividends
        }
      ])
    }
  }, [])

  // Удаление бумаги из портфеля
  const removePosition = useCallback((id) => {
    setPortfolio(prev => prev.filter(p => p.id !== id))
  }, [])

  // Обновление позиции
  const updatePosition = useCallback((id, updates) => {
    setPortfolio(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updates } : p))
    )
  }, [])

  // Обновление даты покупки для облигации
  const updatePurchaseDate = useCallback((id, purchaseDate) => {
    setPortfolio(prev =>
      prev.map(p => (p.id === id ? { ...p, purchaseDate } : p))
    )
  }, [])

  // Обновление цены покупки
  const updatePurchasePrice = useCallback((id, purchasePrice) => {
    setPortfolio(prev =>
      prev.map(p => (p.id === id ? { ...p, avgPrice: purchasePrice } : p))
    )
  }, [])

  // Очистка портфеля
  const clearPortfolio = useCallback(() => {
    setPortfolio([])
  }, [])

  // Расчёт общей стоимости портфеля в базовой валюте с учётом полученных купонов и дивидендов
  const getTotalValue = useCallback((currentPrices, rates = currencyRates, baseCurr = baseCurrency) => {
    // Стоимость позиций
    const positionsValue = portfolio.reduce((total, position) => {
      const currentPrice = currentPrices.find(p => p.id === position.securityId)?.price || 0
      const currency = position.currency || 'RUB'
      const rate = rates[currency] || 1

      // Конвертируем в рубли
      const valueInRub = currentPrice * position.quantity * rate
      // Конвертируем из рублей в базовую валюту
      const baseRate = rates[baseCurr] || 1
      return total + (valueInRub / baseRate)
    }, 0)

    // Добавляем полученные купоны и дивиденды (они уже в рублях)
    const totalCoupons = couponHistory.reduce((sum, item) => sum + item.couponAmount, 0)
    const totalDividends = dividendHistory.reduce((sum, item) => sum + item.dividendAmount, 0)

    // Конвертируем в базовую валюту
    const baseRate = rates[baseCurr] || 1
    return (positionsValue + totalCoupons + totalDividends) / baseRate
  }, [portfolio, couponHistory, dividendHistory, currencyRates, baseCurrency])

  // Расчёт общей прибыли/убытка в базовой валюте с учётом полученных купонов и дивидендов
  const getTotalPnL = useCallback((currentPrices, rates = currencyRates, baseCurr = baseCurrency) => {
    // Прибыль от изменения цены позиций
    const positionsPnL = portfolio.reduce((total, position) => {
      const currentPrice = currentPrices.find(p => p.id === position.securityId)?.price || 0
      const currency = position.currency || 'RUB'
      const rate = rates[currency] || 1

      const invested = position.avgPrice * position.quantity * rate
      const current = currentPrice * position.quantity * rate
      const pnlInRub = current - invested

      // Конвертируем в базовую валюту
      const baseRate = rates[baseCurr] || 1
      return total + (pnlInRub / baseRate)
    }, 0)

    // Добавляем полученные купоны и дивиденды как прибыль (они уже в рублях)
    const totalCoupons = couponHistory.reduce((sum, item) => sum + item.couponAmount, 0)
    const totalDividends = dividendHistory.reduce((sum, item) => sum + item.dividendAmount, 0)

    // Конвертируем в базовую валюту
    const baseRate = rates[baseCurr] || 1
    return positionsPnL + ((totalCoupons + totalDividends) / baseRate)
  }, [portfolio, couponHistory, dividendHistory, currencyRates, baseCurrency])

  // Подтверждение получения купона
  const confirmCoupon = useCallback((positionId, couponAmount, positionData) => {
    // Добавляем запись в историю купонов
    if (positionData) {
      setCouponHistory(prev => [
        ...prev,
        {
          id: Date.now(),
          positionId,
          ticker: positionData.ticker,
          name: positionData.name,
          securityId: positionData.securityId,
          couponAmount,
          quantity: positionData.quantity,
          date: new Date().toISOString()
        }
      ])
    }
  }, [])

  // Добавление ручного купона для облигации
  const addManualCoupon = useCallback((positionId, couponData, positionData) => {
    if (positionData) {
      setCouponHistory(prev => [
        ...prev,
        {
          id: Date.now(),
          positionId,
          ticker: positionData.ticker,
          name: positionData.name,
          securityId: positionData.securityId,
          couponAmount: couponData.totalAmount,
          quantity: positionData.quantity,
          date: couponData.date,
          isManualCoupon: true,
          notes: couponData.notes
        }
      ])
    }
  }, [])

  // Удаление купона из истории
  const removeCoupon = useCallback((couponId) => {
    setCouponHistory(prev => prev.filter(c => c.id !== couponId))
  }, [])

  // Подтверждение получения дивиденда
  const confirmDividend = useCallback((positionId, dividendAmount, positionData) => {
    // Добавляем запись в историю дивидендов
    if (positionData) {
      setDividendHistory(prev => [
        ...prev,
        {
          id: Date.now(),
          positionId,
          ticker: positionData.ticker,
          name: positionData.name,
          securityId: positionData.securityId,
          dividendAmount,
          quantity: positionData.quantity,
          date: new Date().toISOString()
        }
      ])
    }
  }, [])

  // Удаление дивиденда из истории
  const removeDividend = useCallback((dividendId) => {
    setDividendHistory(prev => prev.filter(d => d.id !== dividendId))
  }, [])

  // Экспорт портфеля в JSON файл
  const exportJSON = useCallback(() => {
    const jsonString = exportPortfolioJSON(portfolio, couponHistory, dividendHistory)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `portfolio-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [portfolio, couponHistory, dividendHistory])

  // Экспорт портфеля в CSV файл
  const exportCSV = useCallback(() => {
    const csvString = exportPortfolioCSV(portfolio)
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `portfolio-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [portfolio])

  // Импорт портфеля из JSON
  const importJSON = useCallback((data) => {
    try {
      const imported = importPortfolioJSON(JSON.stringify(data))
      setPortfolio(imported.portfolio)
      setCouponHistory(imported.couponHistory || [])
      setDividendHistory(imported.dividendHistory || [])
      return true
    } catch (err) {
      console.error('Ошибка импорта JSON:', err)
      throw err
    }
  }, [])

  // Импорт портфеля из CSV
  const importCSV = useCallback((csvText) => {
    try {
      const imported = importPortfolioCSV(csvText)
      setPortfolio(imported.portfolio)
      setCouponHistory([])
      setDividendHistory([])
      return true
    } catch (err) {
      console.error('Ошибка импорта CSV:', err)
      throw err
    }
  }, [])

  // Погашение облигации (перенос в погашенные)
  const confirmBondRedemption = useCallback((positionId, redemptionData) => {
    const position = portfolio.find(p => p.id === positionId)
    if (!position) return

    // Создаём запись о погашенной облигации
    const redeemedBond = {
      ...position,
      redeemedDate: redemptionData.date,
      redemptionAmount: redemptionData.redemptionAmount,
      nominalValue: redemptionData.nominalValue,
      redemptionProfit: redemptionData.nominalValue - redemptionData.redemptionAmount,
      notes: redemptionData.notes,
      redeemedYear: new Date(redemptionData.date).getFullYear()
    }

    // Добавляем в погашенные
    setRedeemedBonds(prev => [...prev, redeemedBond])

    // Удаляем из активного портфеля
    setPortfolio(prev => prev.filter(p => p.id !== positionId))

    console.log('Облигация погашена и перенесена в архив:', redeemedBond)
  }, [portfolio])

  return {
    portfolio,
    redeemedBonds,
    couponHistory,
    dividendHistory,
    currencyRates,
    baseCurrency,
    setBaseCurrency,
    loading,
    addPosition,
    removePosition,
    updatePosition,
    updatePurchaseDate,
    updatePurchasePrice,
    confirmCoupon,
    addManualCoupon,
    removeCoupon,
    confirmDividend,
    removeDividend,
    confirmBondRedemption,
    clearPortfolio,
    getTotalValue,
    getTotalPnL,
    exportJSON,
    exportCSV,
    importJSON,
    importCSV
  }
}
 
