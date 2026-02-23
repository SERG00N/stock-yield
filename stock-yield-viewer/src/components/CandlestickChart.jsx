import { ResponsiveContainer, ComposedChart, XAxis, YAxis, Tooltip, Bar, Line } from 'recharts'

/**
 * График свечей (японские свечи)
 * Использует Recharts ComposedChart для отрисовки
 */
function CandlestickChart({ candles }) {
  if (!candles || candles.length === 0) {
    return <div className="text-muted">Нет данных</div>
  }

  // Преобразуем данные для Recharts
  const data = candles.map(candle => ({
    date: new Date(candle.date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short'
    }),
    open: candle.open,
    close: candle.close,
    high: candle.high,
    low: candle.low,
    volume: candle.volume,
    // Цвет свечи
    fill: candle.close >= candle.open ? '#00b894' : '#d63031',
    // Для линии цены закрытия
    closeLine: candle.close
  }))

  // Кастомная форма свечи
  const Candlestick = (props) => {
    const { x, y, width, height, low, high, open, close } = props
    const candleY = Math.min(open, close)
    const candleHeight = Math.abs(close - open)
    const isGreen = close >= open

    return (
      <g>
        {/* Тень (high-low) */}
        <line
          x1={x + width / 2}
          y1={y + high}
          x2={x + width / 2}
          y2={y + low}
          stroke={isGreen ? '#00b894' : '#d63031'}
          strokeWidth={1}
        />
        {/* Тело свечи */}
        <rect
          x={x}
          y={y + candleY}
          width={width}
          height={Math.max(candleHeight, 1)}
          fill={isGreen ? '#00b894' : '#d63031'}
          stroke={isGreen ? '#00b894' : '#d63031'}
        />
      </g>
    )
  }

  // Кастомный тултип
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-dark border border-secondary p-2 rounded">
          <div className="text-white small">{data.date}</div>
          <div className="text-info small">O: {data.open.toFixed(2)}</div>
          <div className="text-info small">H: {data.high.toFixed(2)}</div>
          <div className="text-info small">L: {data.low.toFixed(2)}</div>
          <div className={`small ${data.close >= data.open ? 'text-success' : 'text-danger'}`}>
            C: {data.close.toFixed(2)}
          </div>
          <div className="text-white-50 small">V: {data.volume.toLocaleString()}</div>
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <ResponsiveContainer>
        <ComposedChart data={data}>
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
            domain={['dataMin', 'dataMax']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="close"
            shape={<Candlestick />}
            barSize={8}
          />
          <Line
            type="monotone"
            dataKey="closeLine"
            stroke="#0984e3"
            strokeWidth={1}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export default CandlestickChart
