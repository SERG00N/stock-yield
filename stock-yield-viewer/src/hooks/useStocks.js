import { useState, useEffect } from 'react'
import { fetchStocks, transformStockData } from '../api/moex'

/**
 * Хук для получения списка акций с MOEX
 */
export function useStocks() {
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadStocks = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await fetchStocks()
      
      // Фильтруем только акции с данными и трансформируем
      const transformed = data
        .filter(stock => stock.MARKET_LAST != null && stock.MARKET_LAST > 0)
        .map(transformStockData)
      
      setStocks(transformed)
    } catch (err) {
      setError(err.message || 'Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStocks()
  }, [])

  return { stocks, loading, error, refetch: loadStocks }
}
