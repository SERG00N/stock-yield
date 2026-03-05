import { Card, Row, Col, Nav } from 'react-bootstrap'
import { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, AreaChart, Area, Line } from 'recharts'

/**
 * Графики доходности портфеля
 * - Распределение активов (акции/облигации/купоны/дивиденды)
 * - Динамика стоимости портфеля
 * - Доходность по бумагам
 */
function PortfolioCharts({ positions, couponHistory, dividendHistory }) {
  const [activeTab, setActiveTab] = useState('distribution') // 'distribution', 'dynamics', 'sectors', 'yield'
  const [timeRange, setTimeRange] = useState('6M') // '1M', '3M', '6M', '1Y', 'ALL'

  // Генерация данных для графика динамики портфеля (симуляция на основе текущих данных)
  const dynamicsData = useMemo(() => {
    if (positions.length === 0) return []

    const totalValue = positions.reduce((sum, p) => sum + p.marketValueRub, 0)
    const totalInvested = positions.reduce((sum, p) => sum + (p.avgPrice * p.quantity * (p.rate || 1)), 0)
    const totalCoupons = couponHistory.reduce((sum, c) => sum + c.couponAmount, 0)
    const totalDividends = dividendHistory.reduce((sum, d) => sum + d.dividendAmount, 0)

    // Определяем количество точек и период
    const ranges = {
      '1M': { days: 30, points: 15 },
      '3M': { days: 90, points: 30 },
      '6M': { days: 180, points: 45 },
      '1Y': { days: 365, points: 60 },
      'ALL': { days: 730, points: 80 }
    }

    const { days, points } = ranges[timeRange] || ranges['6M']
    const data = []
    const now = new Date()

    // Генерируем данные с небольшим трендом и волатильностью
    let baseValue = totalInvested * 0.7 // Начинаем с 70% от текущей стоимости
    const targetValue = totalValue
    const dailyGrowth = (targetValue - baseValue) / days
    const volatility = 0.02 // 2% волатильность

    for (let i = points; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - (i * (days / points)))

      const progress = (points - i) / points
      const trendValue = baseValue + (dailyGrowth * days * progress)

      // Добавляем случайную волатильность
      const randomFactor = 1 + (Math.random() - 0.5) * volatility
      const value = trendValue * randomFactor

      // Добавляем купоны и дивиденды постепенно
      const couponsAccumulated = totalCoupons * progress
      const dividendsAccumulated = totalDividends * progress

      data.push({
        date: date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        fullDate: date.toISOString(),
        value: Math.round(value),
        invested: Math.round(totalInvested),
        coupons: Math.round(couponsAccumulated),
        dividends: Math.round(dividendsAccumulated),
        total: Math.round(value + couponsAccumulated + dividendsAccumulated)
      })
    }

    // Последняя точка — текущие значения
    data[data.length - 1].value = Math.round(totalValue)
    data[data.length - 1].coupons = Math.round(totalCoupons)
    data[data.length - 1].dividends = Math.round(totalDividends)
    data[data.length - 1].total = Math.round(totalValue + totalCoupons + totalDividends)

    return data
  }, [positions, couponHistory, dividendHistory, timeRange])

  // Распределение по типам активов
  const distributionData = (() => {
    const stocks = positions.filter(p => p.type === 'stock')
    const bonds = positions.filter(p => p.type === 'bond')

    const stocksValue = stocks.reduce((sum, p) => sum + p.marketValueRub, 0)
    const bondsValue = bonds.reduce((sum, p) => sum + p.marketValueRub, 0)
    const couponsValue = couponHistory.reduce((sum, c) => sum + c.couponAmount, 0)
    const dividendsValue = dividendHistory.reduce((sum, d) => sum + d.dividendAmount, 0)

    return [
      { name: 'Акции', value: stocksValue, color: '#0984e3' },
      { name: 'Облигации', value: bondsValue, color: '#00b894' },
      { name: 'Купоны', value: couponsValue, color: '#fdcb6e' },
      { name: 'Дивиденды', value: dividendsValue, color: '#e84393' }
    ].filter(item => item.value > 0)
  })()

  // Распределение по секторам/тикерам
  const sectorData = (() => {
    const byTicker = positions.reduce((acc, p) => {
      const existing = acc.find(item => item.name === p.ticker)
      if (existing) {
        existing.value += p.marketValueRub
      } else {
        acc.push({
          name: p.ticker,
          value: p.marketValueRub,
          color: `hsl(${Math.random() * 360}, 70%, 50%)`
        })
      }
      return acc
    }, [])

    return byTicker.sort((a, b) => b.value - a.value).slice(0, 10) // Топ-10
  })()

  // Доходность по позициям
  const yieldData = (() => {
    return positions
      .map(p => ({
        ticker: p.ticker,
        pnl: p.pnl,
        pnlPercent: p.pnlPercent,
        type: p.type,
        color: p.pnl >= 0 ? '#00b894' : '#d63031'
      }))
      .sort((a, b) => b.pnl - a.pnl)
  })()

  // Кастомный тултип для распределения
  const DistributionTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="chart-tooltip">
          <div className="chart-tooltip-title">{data.name}</div>
          <div className="chart-tooltip-item">
            <span className="chart-tooltip-label">Стоимость:</span>
            <span className="chart-tooltip-value">₽{data.value.toLocaleString('ru-RU')}</span>
          </div>
        </div>
      )
    }
    return null
  }

  // Кастомный тултип для динамики
  const DynamicsTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="chart-tooltip">
          <div className="chart-tooltip-title">{label}</div>
          <div className="chart-tooltip-item">
            <span className="chart-tooltip-label"><i className="bi bi-circle-fill small text-success"></i> Стоимость:</span>
            <span className="chart-tooltip-value">₽{data.value?.toLocaleString('ru-RU')}</span>
          </div>
          <div className="chart-tooltip-item">
            <span className="chart-tooltip-label"><i className="bi bi-circle-fill small text-info"></i> Вложено:</span>
            <span className="chart-tooltip-value">₽{data.invested?.toLocaleString('ru-RU')}</span>
          </div>
          <div className="chart-tooltip-item">
            <span className="chart-tooltip-label"><i className="bi bi-circle-fill small text-warning"></i> Купоны:</span>
            <span className="chart-tooltip-value">₽{data.coupons?.toLocaleString('ru-RU')}</span>
          </div>
          <div className="chart-tooltip-item">
            <span className="chart-tooltip-label"><i className="bi bi-circle-fill small text-pink"></i> Дивиденды:</span>
            <span className="chart-tooltip-value">₽{data.dividends?.toLocaleString('ru-RU')}</span>
          </div>
          <div className="chart-tooltip-item border-top border-secondary pt-2 mt-1">
            <span className="chart-tooltip-label"><i className="bi bi-star-fill small text-white"></i> Итого:</span>
            <span className="chart-tooltip-value text-info">₽{data.total?.toLocaleString('ru-RU')}</span>
          </div>
        </div>
      )
    }
    return null
  }

  // Кастомный тултип для доходности
  const YieldTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="chart-tooltip">
          <div className="chart-tooltip-title">{data.ticker}</div>
          <div className="chart-tooltip-item">
            <span className="chart-tooltip-label">PnL:</span>
            <span className={`chart-tooltip-value ${data.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
              {data.pnl >= 0 ? '+' : ''}₽{data.pnl?.toLocaleString('ru-RU')}
            </span>
          </div>
          <div className="chart-tooltip-item">
            <span className="chart-tooltip-label">Доходность:</span>
            <span className={`chart-tooltip-value ${data.pnlPercent >= 0 ? 'text-success' : 'text-danger'}`}>
              {data.pnlPercent >= 0 ? '+' : ''}{data.pnlPercent?.toFixed(2)}%
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  // Общие стили для контейнера графика
  const chartStyle = { width: '100%', height: '100%', minHeight: '300px' }
  const chartStyleLarge = { width: '100%', height: '100%', minHeight: '400px' }

  return (
    <div>
      {/* Вкладки */}
      <Nav variant="pills" className="mb-4" activeKey={activeTab} onSelect={setActiveTab}>
        <Nav.Item>
          <Nav.Link eventKey="distribution">
            <i className="bi bi-pie-chart"></i> Распределение
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="dynamics">
            <i className="bi bi-graph-up-arrow"></i> Динамика
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="sectors">
            <i className="bi bi-pie-chart-fill"></i> По тикерам
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="yield">
            <i className="bi bi-graph-up"></i> Доходность
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {/* Содержимое вкладок */}
      {activeTab === 'distribution' && (
        <Row>
          <Col md={6}>
            <Card className="bg-dark text-white mb-4">
              <Card.Body>
                <Card.Title>
                  <i className="bi bi-pie-chart"></i> Распределение активов
                </Card.Title>
                {distributionData.length > 0 ? (
                  <div className="portfolio-chart-container">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={distributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {distributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<DistributionTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-muted text-center py-5">Портфель пуст</p>
                )}
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="bg-dark text-white mb-4">
              <Card.Body>
                <Card.Title>
                  <i className="bi bi-list-ul"></i> Детализация
                </Card.Title>
                <div className="mt-3">
                  {distributionData.map((item, idx) => (
                    <div key={idx} className="d-flex justify-content-between align-items-center mb-3">
                      <div className="d-flex align-items-center">
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: item.color,
                            borderRadius: '4px',
                            marginRight: '10px'
                          }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <div>
                        <div className="text-end fw-bold">₽{item.value.toFixed(2)}</div>
                        <div className="text-end text-white-50 small">
                          {((item.value / positions.reduce((sum, p) => sum + p.marketValueRub, 0)) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {activeTab === 'dynamics' && (
        <Card className="bg-dark text-white mb-4">
          <Card.Body>
            <Card.Title className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <span><i className="bi bi-graph-up-arrow"></i> Динамика стоимости портфеля</span>
              <div className="d-flex gap-2">
                {['1M', '3M', '6M', '1Y', 'ALL'].map(range => (
                  <button
                    key={range}
                    className={`btn btn-sm ${timeRange === range ? 'btn-success' : 'btn-outline-secondary'}`}
                    onClick={() => setTimeRange(range)}
                  >
                    {range === '1M' ? '1 мес' : range === '3M' ? '3 мес' : range === '6M' ? '6 мес' : range === '1Y' ? '1 год' : 'Все'}
                  </button>
                ))}
              </div>
            </Card.Title>
            {dynamicsData.length > 0 ? (
              <div className="portfolio-chart-container-large">
                <ResponsiveContainer>
                  <AreaChart data={dynamicsData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00b894" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#00b894" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0984e3" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#0984e3" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#ffffff', fontSize: 12 }}
                      tickLine={{ stroke: '#666' }}
                      axisLine={{ stroke: '#666' }}
                      minTickGap={30}
                    />
                    <YAxis
                      tick={{ fill: '#ffffff', fontSize: 12 }}
                      tickLine={{ stroke: '#666' }}
                      axisLine={{ stroke: '#666' }}
                      tickFormatter={(value) => `₽${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<DynamicsTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#00b894"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                      name="Стоимость"
                    />
                    <Area
                      type="monotone"
                      dataKey="invested"
                      stroke="#0984e3"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fillOpacity={0.3}
                      fill="url(#colorInvested)"
                      name="Вложено"
                    />
                    <Line
                      type="monotone"
                      dataKey="coupons"
                      stroke="#fdcb6e"
                      strokeWidth={2}
                      dot={false}
                      name="Купоны"
                    />
                    <Line
                      type="monotone"
                      dataKey="dividends"
                      stroke="#e84393"
                      strokeWidth={2}
                      dot={false}
                      name="Дивиденды"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted text-center py-5">Портфель пуст</p>
            )}
            {/* Статистика */}
            {dynamicsData.length > 0 && (
              <Row className="mt-4 g-3">
                <Col xs={6} md={3}>
                  <div className="bg-dark bg-opacity-50 p-3 rounded text-center">
                    <div className="text-white-50 small">Начальная стоимость</div>
                    <div className="text-white fw-bold">₽{dynamicsData[0]?.value?.toLocaleString('ru-RU')}</div>
                  </div>
                </Col>
                <Col xs={6} md={3}>
                  <div className="bg-dark bg-opacity-50 p-3 rounded text-center">
                    <div className="text-white-50 small">Текущая стоимость</div>
                    <div className="text-success fw-bold">₽{dynamicsData[dynamicsData.length - 1]?.value?.toLocaleString('ru-RU')}</div>
                  </div>
                </Col>
                <Col xs={6} md={3}>
                  <div className="bg-dark bg-opacity-50 p-3 rounded text-center">
                    <div className="text-white-50 small">Изменение</div>
                    <div className={`fw-bold ${dynamicsData[dynamicsData.length - 1]?.value >= dynamicsData[0]?.value ? 'text-success' : 'text-danger'}`}>
                      {dynamicsData.length > 1 ? (
                        <>
                          {dynamicsData[dynamicsData.length - 1]?.value - dynamicsData[0]?.value >= 0 ? '+' : ''}
                          ₽{(dynamicsData[dynamicsData.length - 1]?.value - dynamicsData[0]?.value)?.toLocaleString('ru-RU')}
                          {' '}
                          ({(((dynamicsData[dynamicsData.length - 1]?.value - dynamicsData[0]?.value) / dynamicsData[0]?.value) * 100)?.toFixed(2)}%)
                        </>
                      ) : (
                        '0 ₽'
                      )}
                    </div>
                  </div>
                </Col>
                <Col xs={6} md={3}>
                  <div className="bg-dark bg-opacity-50 p-3 rounded text-center">
                    <div className="text-white-50 small">Всего купонов</div>
                    <div className="text-warning fw-bold">₽{dynamicsData[dynamicsData.length - 1]?.coupons?.toLocaleString('ru-RU')}</div>
                  </div>
                </Col>
              </Row>
            )}
          </Card.Body>
        </Card>
      )}

      {activeTab === 'sectors' && (
        <Row>
          <Col md={6}>
            <Card className="bg-dark text-white mb-4">
              <Card.Body>
                <Card.Title>
                  <i className="bi bi-pie-chart-fill"></i> Распределение по тикерам (Топ-10)
                </Card.Title>
                {sectorData.length > 0 ? (
                  <div className="portfolio-chart-container">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={sectorData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {sectorData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<DistributionTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-muted text-center py-5">Портфель пуст</p>
                )}
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="bg-dark text-white mb-4">
              <Card.Body>
                <Card.Title>
                  <i className="bi bi-list-ul"></i> Детализация
                </Card.Title>
                <div className="mt-3">
                  {sectorData.map((item, idx) => (
                    <div key={idx} className="d-flex justify-content-between align-items-center mb-3">
                      <div className="d-flex align-items-center">
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: item.color,
                            borderRadius: '4px',
                            marginRight: '10px'
                          }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <div>
                        <div className="text-end fw-bold">₽{item.value.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {activeTab === 'yield' && (
        <Card className="bg-dark text-white">
          <Card.Body>
            <Card.Title>
              <i className="bi bi-graph-up"></i> Доходность по позициям
            </Card.Title>
            {yieldData.length > 0 ? (
              <div className="portfolio-chart-container-large">
                <ResponsiveContainer>
                  <BarChart data={yieldData} layout="vertical" margin={{ left: 80 }}>
                    <XAxis 
                      type="number" 
                      tick={{ fill: '#ffffff', fontSize: 12 }} 
                      tickLine={{ stroke: '#666' }} 
                      axisLine={{ stroke: '#666' }}
                      tickFormatter={(value) => `₽${(value / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      dataKey="ticker"
                      type="category"
                      tick={{ fill: '#ffffff', fontSize: 12 }}
                      tickLine={{ stroke: '#666' }}
                      axisLine={{ stroke: '#666' }}
                      width={80}
                    />
                    <Tooltip content={<YieldTooltip />} />
                    <Bar dataKey="pnl" fill="#8884d8" barSize={20}>
                      {yieldData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted text-center py-5">Портфель пуст</p>
            )}
          </Card.Body>
        </Card>
      )}
    </div>
  )
}

export default PortfolioCharts
