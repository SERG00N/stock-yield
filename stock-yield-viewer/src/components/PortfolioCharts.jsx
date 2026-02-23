import { Card, Row, Col, Nav } from 'react-bootstrap'
import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, LineChart, Line } from 'recharts'

/**
 * Графики доходности портфеля
 * - Распределение активов (акции/облигации)
 * - Динамика стоимости портфеля
 * - Доходность по бумагам
 */
function PortfolioCharts({ positions, couponHistory, dividendHistory }) {
  const [activeTab, setActiveTab] = useState('distribution') // 'distribution', 'dynamics', 'yield'

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

  // Кастомный тултип
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-dark border border-secondary p-2 rounded">
          <div className="text-white small fw-bold">{data.name || data.ticker}</div>
          <div className="text-info">
            ₽{data.value?.toFixed(2) || data.pnl?.toFixed(2)}
          </div>
          {data.pnlPercent && (
            <div className={`small ${data.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
              {data.pnl >= 0 ? '+' : ''}{data.pnlPercent.toFixed(2)}%
            </div>
          )}
        </div>
      )
    }
    return null
  }

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
                  <div style={{ width: '100%', height: '300px' }}>
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
                        <Tooltip content={<CustomTooltip />} />
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

      {activeTab === 'sectors' && (
        <Row>
          <Col md={6}>
            <Card className="bg-dark text-white mb-4">
              <Card.Body>
                <Card.Title>
                  <i className="bi bi-pie-chart-fill"></i> Распределение по тикерам (Топ-10)
                </Card.Title>
                {sectorData.length > 0 ? (
                  <div style={{ width: '100%', height: '300px' }}>
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
                        <Tooltip content={<CustomTooltip />} />
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
              <div style={{ width: '100%', height: '400px' }}>
                <ResponsiveContainer>
                  <BarChart data={yieldData} layout="vertical">
                    <XAxis type="number" tick={{ fill: '#ffffff', fontSize: 12 }} tickLine={{ stroke: '#666' }} axisLine={{ stroke: '#666' }} />
                    <YAxis
                      dataKey="ticker"
                      type="category"
                      tick={{ fill: '#ffffff', fontSize: 12 }}
                      tickLine={{ stroke: '#666' }}
                      axisLine={{ stroke: '#666' }}
                      width={80}
                    />
                    <Tooltip content={<CustomTooltip />} />
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
