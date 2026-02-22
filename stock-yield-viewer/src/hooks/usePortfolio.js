import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'stock-portfolio'
const COUPON_HISTORY_KEY = 'coupon-history'
const DIVIDEND_HISTORY_KEY = 'dividend-history'

/**
 * Хук для управления портфелем бумаг
 * Данные сохраняются в localStorage
 */
export function usePortfolio() {
  const [portfolio, setPortfolio] = useState([])
  const [couponHistory, setCouponHistory] = useState([])
  const [dividendHistory, setDividendHistory] = useState([])
  const [loading, setLoading] = useState(true)

  // Загрузка портфеля из localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setPortfolio(JSON.parse(saved))
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
    } catch (err) {
      console.error('Ошибка загрузки портфеля:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Сохранение портфеля в localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio))
    }
  }, [portfolio, loading])

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

  // Расчёт общей стоимости портфеля
  const getTotalValue = useCallback((currentPrices) => {
    return portfolio.reduce((total, position) => {
      const currentPrice = currentPrices.find(p => p.id === position.securityId)?.price || 0
      return total + (currentPrice * position.quantity)
    }, 0)
  }, [portfolio])

  // Расчёт общей прибыли/убытка
  const getTotalPnL = useCallback((currentPrices) => {
    return portfolio.reduce((total, position) => {
      const currentPrice = currentPrices.find(p => p.id === position.securityId)?.price || 0
      const invested = position.avgPrice * position.quantity
      const current = currentPrice * position.quantity
      return total + (current - invested)
    }, 0)
  }, [portfolio])

  // Подтверждение получения купона
  const confirmCoupon = useCallback((positionId, couponAmount, positionData) => {
    setPortfolio(prev =>
      prev.map(p => {
        if (p.id === positionId) {
          // Уменьшаем среднюю цену покупки на сумму полученного купона
          const newAvgPrice = Math.max(0, p.avgPrice - (couponAmount / p.quantity))
          return {
            ...p,
            avgPrice: newAvgPrice,
            lastCouponDate: new Date().toISOString(),
            lastCouponAmount: couponAmount
          }
        }
        return p
      })
    )

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

  // Подтверждение получения дивиденда
  const confirmDividend = useCallback((positionId, dividendAmount, positionData) => {
    setPortfolio(prev =>
      prev.map(p => {
        if (p.id === positionId) {
          // Уменьшаем среднюю цену покупки на сумму полученного дивиденда
          const newAvgPrice = Math.max(0, p.avgPrice - (dividendAmount / p.quantity))
          return {
            ...p,
            avgPrice: newAvgPrice,
            lastDividendDate: new Date().toISOString(),
            lastDividendAmount: dividendAmount
          }
        }
        return p
      })
    )

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

  return {
    portfolio,
    couponHistory,
    dividendHistory,
    loading,
    addPosition,
    removePosition,
    updatePosition,
    updatePurchaseDate,
    updatePurchasePrice,
    confirmCoupon,
    confirmDividend,
    clearPortfolio,
    getTotalValue,
    getTotalPnL
  }
}
