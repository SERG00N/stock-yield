import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Container, Row, Col, Card, Button, Badge, Nav, Alert } from 'react-bootstrap'
import { fetchStocks, fetchBonds, fetchCandles, formatDate, fetchCouponHistory, fetchDividendHistory } from '../api/moex'
import { transformBondData, transformStockData } from '../api/moex'
import CandlestickChart from '../components/CandlestickChart'
import CouponHistoryDetail from '../components/CouponHistoryDetail'
import DividendHistoryDetail from '../components/DividendHistoryDetail'
import PriceHistoryChart from '../components/PriceHistoryChart'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorDisplay from '../components/ErrorDisplay'
import Header from '../components/Header'

/**
 * Страница с деталями бумаги (акции или облигации)
 * Показывает: свечи, историю цен, все купоны/дивиденды
 */
function SecurityDetailPage() {
  const { type, secid } = useParams() // type: 'stock' или 'bond'
  const navigate = useNavigate()

  const [security, setSecurity] = useState(null)
  const [candles, setCandles] = useState([])
  const [couponHistory, setCouponHistory] = useState([])
  const [dividendHistory, setDividendHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('candles') // 'candles', 'price', 'coupons', 'dividends'

  // Загрузка данных о бумаге
  useEffect(() => {
    const loadSecurity = async () => {
      setLoading(true)
      setError(null)

      try {
        if (type === 'stock') {
          const stocks = await fetchStocks()
          const stock = stocks.find(s => s.SECID === secid)
          if (!stock) {
            setError('Акция не найдена')
            return
          }
          setSecurity(transformStockData(stock))
        } else if (type === 'bond') {
          const bonds = await fetchBonds()
          const bond = bonds.find(b => b.SECID === secid)
          if (!bond) {
            setError('Облигация не найдена')
            return
          }
          setSecurity(transformBondData(bond))
        } else {
          setError('Неверный тип бумаги')
          return
        }
      } catch (err) {
        setError('Ошибка загрузки данных: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    loadSecurity()
  }, [type, secid])

  // Загрузка свечей
  useEffect(() => {
    if (!security) return

    const loadCandles = async () => {
      try {
        const candleData = await fetchCandles(secid)
        const columns = candleData.candles?.columns || []
        const data = candleData.candles?.data || []

        const beginIdx = columns.indexOf('begin')
        const openIdx = columns.indexOf('open')
        const closeIdx = columns.indexOf('close')
        const highIdx = columns.indexOf('high')
        const lowIdx = columns.indexOf('low')
        const volumeIdx = columns.indexOf('value')

        const formattedCandles = data.map(candle => ({
          date: candle[beginIdx],
          open: candle[openIdx],
          close: candle[closeIdx],
          high: candle[highIdx],
          low: candle[lowIdx],
          volume: candle[volumeIdx]
        }))

        setCandles(formattedCandles)
      } catch (err) {
        console.error('Ошибка загрузки свечей:', err)
      }
    }

    loadCandles()
  }, [security, secid])

  // Загрузка истории купонов (для облигаций)
  useEffect(() => {
    if (!security || type !== 'bond') return

    const loadCouponHistory = async () => {
      try {
        const history = await fetchCouponHistory(secid)
        setCouponHistory(history)
      } catch (err) {
        console.error('Ошибка загрузки истории купонов:', err)
      }
    }

    loadCouponHistory()
  }, [security, type, secid])

  // Загрузка истории дивидендов (для акций)
  useEffect(() => {
    if (!security || type !== 'stock') return

    const loadDividendHistory = async () => {
      try {
        const history = await fetchDividendHistory(secid)
        setDividendHistory(history)
      } catch (err) {
        console.error('Ошибка загрузки истории дивидендов:', err)
      }
    }

    loadDividendHistory()
  }, [security, type, secid])

  if (loading) {
    return (
      <div className="app">
        <Header />
        <Container fluid className="py-4">
          <LoadingSpinner />
        </Container>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app">
        <Header />
        <Container fluid className="py-4">
          <ErrorDisplay message={error} onRetry={() => window.location.reload()} />
        </Container>
      </div>
    )
  }

  if (!security) {
    return (
      <div className="app">
        <Header />
        <Container fluid className="py-4">
          <Alert variant="warning">
            <Alert.Heading>Бумага не найдена</Alert.Heading>
            <p>К сожалению, бумага с таким тикером не найдена.</p>
            <hr />
            <Button variant="outline-primary" as={Link} to="/portfolio">
              <i className="bi bi-arrow-left"></i> Вернуться в портфель
            </Button>
          </Alert>
        </Container>
      </div>
    )
  }

  return (
    <div className="app">
      <Header />
      <Container fluid className="py-4">
        {/* Заголовок и кнопка назад */}
        <Row className="mb-4">
          <Col>
            <Button variant="outline-secondary" size="sm" onClick={() => navigate(-1)} className="me-2">
              <i className="bi bi-arrow-left"></i> Назад
            </Button>
            <Badge bg={type === 'bond' ? 'info' : 'primary'} className="me-2">
              {type === 'bond' ? 'Облигация' : 'Акция'}
            </Badge>
            <h3 className="d-inline">{security.ticker}</h3>
            <span className="text-white-50 ms-2">{security.name}</span>
          </Col>
        </Row>

        {/* Основная информация */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="portfolio-summary">
              <Card.Body>
                <Card.Title>Текущая цена</Card.Title>
                <Card.Text className="summary-value">
                  {security.currency === 'RUB' ? '₽' : security.currency} {security.price.toFixed(2)}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="portfolio-summary">
              <Card.Body>
                <Card.Title>Изменение за день</Card.Title>
                <Card.Text className={`summary-value ${security.change >= 0 ? 'text-success' : 'text-danger'}`}>
                  {security.change >= 0 ? '+' : ''}{security.change.toFixed(2)} ({security.changePercent >= 0 ? '+' : ''}{security.changePercent.toFixed(2)}%)
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="portfolio-summary">
              <Card.Body>
                <Card.Title>Объём торгов</Card.Title>
                <Card.Text className="summary-value">{security.volume}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          {type === 'bond' && (
            <>
              <Col md={3}>
                <Card className="portfolio-summary">
                  <Card.Body>
                    <Card.Title>Купон</Card.Title>
                    <Card.Text className="summary-value text-success">
                      ₽{security.couponValue?.toFixed(2) || '0.00'}
                    </Card.Text>
                    <div className="text-white-50 small">
                      {security.couponPeriod ? `${security.couponPeriod} дн.` : ''}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="portfolio-summary">
                  <Card.Body>
                    <Card.Title>Дата погашения</Card.Title>
                    <Card.Text className="summary-value">
                      {formatDate(security.maturityDate)}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            </>
          )}
          {type === 'stock' && (
            <Col md={3}>
              <Card className="portfolio-summary">
                <Card.Body>
                  <Card.Title>Дивидендная доходность</Card.Title>
                  <Card.Text className="summary-value text-success">
                    {security.yield?.toFixed(2) || '0.00'}%
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>

        {/* Вкладки */}
        <Row className="mb-4">
          <Col>
            <Nav variant="pills" activeKey={activeTab} onSelect={setActiveTab}>
              <Nav.Item>
                <Nav.Link eventKey="candles">
                  <i className="bi bi-graph-up"></i> Свечи
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="price">
                  <i className="bi bi-currency-exchange"></i> История цен
                </Nav.Link>
              </Nav.Item>
              {type === 'bond' && (
                <Nav.Item>
                  <Nav.Link eventKey="coupons">
                    <i className="bi bi-cash-coin"></i> Купоны
                  </Nav.Link>
                </Nav.Item>
              )}
              {type === 'stock' && (
                <Nav.Item>
                  <Nav.Link eventKey="dividends">
                    <i className="bi bi-cash-stack"></i> Дивиденды
                  </Nav.Link>
                </Nav.Item>
              )}
            </Nav>
          </Col>
        </Row>

        {/* Содержимое вкладок */}
        <Row>
          <Col>
            {activeTab === 'candles' && (
              <Card className="bg-dark text-white">
                <Card.Body>
                  <Card.Title>График свечей</Card.Title>
                  {candles.length > 0 ? (
                    <CandlestickChart candles={candles} />
                  ) : (
                    <p className="text-muted text-center py-5">Нет данных о свечах</p>
                  )}
                </Card.Body>
              </Card>
            )}

            {activeTab === 'price' && (
              <Card className="bg-dark text-white">
                <Card.Body>
                  <Card.Title>История изменения цены</Card.Title>
                  {candles.length > 0 ? (
                    <PriceHistoryChart candles={candles} />
                  ) : (
                    <p className="text-muted text-center py-5">Нет данных о ценах</p>
                  )}
                </Card.Body>
              </Card>
            )}

            {activeTab === 'coupons' && type === 'bond' && (
              <CouponHistoryDetail couponHistory={couponHistory} />
            )}

            {activeTab === 'dividends' && type === 'stock' && (
              <DividendHistoryDetail dividendHistory={dividendHistory} />
            )}
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default SecurityDetailPage
