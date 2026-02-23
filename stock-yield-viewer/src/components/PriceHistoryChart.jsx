import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

/**
 * График истории изменения цены
 */
function PriceHistoryChart({ candles }) {
  if (!candles || candles.length === 0) {
    return <div className="text-muted">Нет данных</div>
  }

  // Преобразуем данные для Recharts
  const data = candles.map(candle => ({
    date: new Date(candle.date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short'
    }),
    price: candle.close,
    volume: candle.volume
  }))

  // Находим минимальную и максимальную цену
  const prices = data.map(d => d.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length

  // Кастомный тултип
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-dark border border-secondary p-2 rounded">
          <div className="text-white small">{data.date}</div>
          <div className="text-info fw-bold">{data.price.toFixed(2)} ₽</div>
          <div className="text-white-50 small">Объём: {data.volume.toLocaleString()}</div>
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis
            dataKey="date"
            tick={{ fill: '#ffffff', fontSize: 12 }}
            tickLine={{ stroke: '#666' }}
            axisLine={{ stroke: '#666' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#ffffff', fontSize: 12 }}
            tickLine={{ stroke: '#666' }}
            axisLine={{ stroke: '#666' }}
            domain={[minPrice * 0.95, maxPrice * 1.05]}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={avgPrice}
            stroke="#ffffff"
            strokeDasharray="3 3"
            label={{ value: `Средняя: ${avgPrice.toFixed(2)}`, fill: '#ffffff', fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#00b894"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: '#00b894' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PriceHistoryChart
