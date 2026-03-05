import { Modal, Row, Col, Card, Badge, Nav, Button, Alert } from 'react-bootstrap'
import { useState, useEffect } from 'react'
import { fetchCouponHistory, fetchDividendHistory, fetchCandles } from '../api/moex'
import CandlestickChart from './CandlestickChart'
import CouponHistoryDetail from './CouponHistoryDetail'
import DividendHistoryDetail from './DividendHistoryDetail'

/**
 * Модальное окно с деталями бумаги
 * Показывает: основную информацию, свечи, историю купонов/дивидендов
 */
function SecurityDetailModal({ show, onHide, position, bonds, stocks }) {
  const [activeTab, setActiveTab] = useState('info') // 'info', 'candles', 'coupons', 'dividends'
  const [couponHistory, setCouponHistory] = useState([])
  const [dividendHistory, setDividendHistory] = useState([])
  const [candles, setCandles] = useState([])
  const [loading, setLoading] = useState(false)

  // Определяем тип и данные бумаги
  const isBond = position?.type === 'bond'
  const securityData = isBond 
    ? bonds.find(b => b.id === position?.securityId)
    : stocks.find(s => s.id === position?.securityId)

  // Загрузка истории купонов (для облигаций)
  useEffect(() => {
    if (!show || !isBond || !position?.securityId) return

    const loadCouponHistory = async () => {
      try {
        const history = await fetchCouponHistory(position.securityId)
        setCouponHistory(history)
      } catch (err) {
        console.error('Ошибка загрузки истории купонов:', err)
      }
    }

    loadCouponHistory()
  }, [show, isBond, position?.securityId])

  // Загрузка истории дивидендов (для акций)
  useEffect(() => {
    if (!show || isBond || !position?.securityId) return

    const loadDividendHistory = async () => {
      try {
        const history = await fetchDividendHistory(position.securityId)
        setDividendHistory(history)
      } catch (err) {
        console.error('Ошибка загрузки истории дивидендов:', err)
      }
    }

    loadDividendHistory()
  }, [show, isBond, position?.securityId])

  // Загрузка свечей
  useEffect(() => {
    if (!show || !position?.securityId) return

    const loadCandles = async () => {
      setLoading(true)
      try {
        const candleData = await fetchCandles(position.securityId)
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
      } finally {
        setLoading(false)
      }
    }

    loadCandles()
  }, [show, position?.securityId])

  if (!position || !securityData) return null

  const currencySymbol = position.currency === 'RUB' ? '₽' : position.currency

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>
          <Badge bg={isBond ? 'info' : 'primary'} className="me-2">
            {isBond ? 'Облигация' : 'Акция'}
          </Badge>
          {position.ticker}
          <span className="text-white-50 ms-2 fw-normal">{position.name}</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Вкладки */}
        <Nav variant="pills" className="mb-4" activeKey={activeTab} onSelect={setActiveTab}>
          <Nav.Item>
            <Nav.Link eventKey="info">
              <i className="bi bi-info-circle"></i> Информация
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="candles">
              <i className="bi bi-graph-up"></i> Свечи
            </Nav.Link>
          </Nav.Item>
          {isBond && (
            <Nav.Item>
              <Nav.Link eventKey="coupons">
                <i className="bi bi-cash-coin"></i> Купоны
              </Nav.Link>
            </Nav.Item>
          )}
          {!isBond && (
            <Nav.Item>
              <Nav.Link eventKey="dividends">
                <i className="bi bi-cash-stack"></i> Дивиденды
              </Nav.Link>
            </Nav.Item>
          )}
        </Nav>

        {/* Содержимое вкладок */}
        {activeTab === 'info' && (
          <Row>
            <Col md={6}>
              <Card className="bg-dark text-white mb-4">
                <Card.Body>
                  <Card.Title>
                    <i className="bi bi-card-text"></i> Основная информация
                  </Card.Title>
                  <Row className="mt-3">
                    <Col xs={6} className="mb-3">
                      <div className="text-white-50 small">Текущая цена</div>
                      <div className="fs-4 fw-bold text-success">
                        {currencySymbol} {position.currentPrice?.toFixed(2)}
                      </div>
                    </Col>
                    <Col xs={6} className="mb-3">
                      <div className="text-white-50 small">Стоимость позиции</div>
                      <div className="fs-5 fw-bold">
                        {currencySymbol} {position.marketValueRub?.toFixed(2)}
                      </div>
                    </Col>
                    <Col xs={6} className="mb-3">
                      <div className="text-white-50 small">Вложено</div>
                      <div className="fs-5">
                        {currencySymbol} {position.investedRub?.toFixed(2)}
                      </div>
                    </Col>
                    <Col xs={6} className="mb-3">
                      <div className="text-white-50 small">Прибыль/Убыток</div>
                      <div className={`fs-5 fw-bold ${position.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                        {position.pnl >= 0 ? '+' : ''}{currencySymbol} {position.pnl?.toFixed(2)} 
                        ({position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent?.toFixed(2)}%)
                      </div>
                    </Col>
                    <Col xs={6} className="mb-3">
                      <div className="text-white-50 small">Количество</div>
                      <div className="fs-5">{position.quantity} шт.</div>
                    </Col>
                    <Col xs={6} className="mb-3">
                      <div className="text-white-50 small">Средняя цена покупки</div>
                      <div className="fs-5">{currencySymbol} {position.avgPrice?.toFixed(2)}</div>
                    </Col>
                    <Col xs={6} className="mb-3">
                      <div className="text-white-50 small">Валюта</div>
                      <div className="fs-5">{position.currency || 'RUB'}</div>
                    </Col>
                    <Col xs={6} className="mb-3">
                      <div className="text-white-50 small">Дата покупки</div>
                      <div className="fs-5">
                        {position.purchaseDate 
                          ? new Date(position.purchaseDate).toLocaleDateString('ru-RU')
                          : '—'
                        }
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="bg-dark text-white mb-4">
                <Card.Body>
                  <Card.Title>
                    <i className="bi bi-file-text"></i> Параметры бумаги
                  </Card.Title>
                  <Row className="mt-3">
                    {isBond ? (
                      <>
                        <Col xs={6} className="mb-3">
                          <div className="text-white-50 small">Номинал</div>
                          <div className="fs-5">₽{securityData.faceValue?.toFixed(2)}</div>
                        </Col>
                        <Col xs={6} className="mb-3">
                          <div className="text-white-50 small">Купон на облигацию</div>
                          <div className="fs-5 text-success">₽{securityData.couponValue?.toFixed(2)}</div>
                        </Col>
                        <Col xs={6} className="mb-3">
                          <div className="text-white-50 small">Периодичность</div>
                          <div className="fs-5">{securityData.couponPeriod || 0} дн.</div>
                        </Col>
                        <Col xs={6} className="mb-3">
                          <div className="text-white-50 small">Дата погашения</div>
                          <div className="fs-5">
                            {securityData.maturityDate 
                              ? new Date(securityData.maturityDate).toLocaleDateString('ru-RU')
                              : '—'
                            }
                          </div>
                        </Col>
                        <Col xs={6} className="mb-3">
                          <div className="text-white-50 small">До погашения</div>
                          <div className="fs-5">{position.daysToMaturity || 0} дн.</div>
                        </Col>
                        <Col xs={6} className="mb-3">
                          <div className="text-white-50 small">Доходность к погашению</div>
                          <div className="fs-5 text-success">
                            {securityData.yield ? `${securityData.yield.toFixed(2)}%` : '—'}
                          </div>
                        </Col>
                        <Col xs={6} className="mb-3">
                          <div className="text-white-50 small">След. купон</div>
                          <div className="fs-5">
                            {position.daysToCoupon !== undefined 
                              ? `через ${position.daysToCoupon} дн.`
                              : '—'
                            }
                          </div>
                        </Col>
                        <Col xs={6} className="mb-3">
                          <div className="text-white-50 small">Купонов в год</div>
                          <div className="fs-5">
                            {securityData.couponPeriod 
                              ? Math.round(365 / securityData.couponPeriod)
                              : '—'
                            }
                          </div>
                        </Col>
                      </>
                    ) : (
                      <>
                        <Col xs={6} className="mb-3">
                          <div className="text-white-50 small">Див. доходность</div>
                          <div className="fs-5 text-success">
                            {securityData.dividendYield ? `${securityData.dividendYield.toFixed(2)}%` : '—'}
                          </div>
                        </Col>
                        <Col xs={6} className="mb-3">
                          <div className="text-white-50 small">P/E</div>
                          <div className="fs-5">
                            {securityData.pe ? securityData.pe.toFixed(2) : '—'}
                          </div>
                        </Col>
                        <Col xs={6} className="mb-3">
                          <div className="text-white-50 small">P/B</div>
                          <div className="fs-5">
                            {securityData.pb ? securityData.pb.toFixed(2) : '—'}
                          </div>
                        </Col>
                        <Col xs={6} className="mb-3">
                          <div className="text-white-50 small">ROE</div>
                          <div className="fs-5">
                            {securityData.roe ? `${securityData.roe.toFixed(2)}%` : '—'}
                          </div>
                        </Col>
                        <Col xs={6} className="mb-3">
                          <div className="text-white-50 small">Капитализация</div>
                          <div className="fs-5">
                            {securityData.marketCap 
                              ? `${(securityData.marketCap / 1e9).toFixed(2)} млрд ₽`
                              : '—'
                            }
                          </div>
                        </Col>
                        <Col xs={6} className="mb-3">
                          <div className="text-white-50 small">Объём торгов</div>
                          <div className="fs-5">
                            {securityData.volume 
                              ? `${(securityData.volume / 1e6).toFixed(2)} млн ₽`
                              : '—'
                            }
                          </div>
                        </Col>
                      </>
                    )}
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {activeTab === 'candles' && (
          <Card className="bg-dark text-white">
            <Card.Body>
              <Card.Title>
                <i className="bi bi-graph-up"></i> График свечей
              </Card.Title>
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">Загрузка...</span>
                  </div>
                </div>
              ) : candles.length > 0 ? (
                <div style={{ height: '400px' }}>
                  <CandlestickChart candles={candles} />
                </div>
              ) : (
                <p className="text-muted text-center py-5">Данные о свечах недоступны</p>
              )}
            </Card.Body>
          </Card>
        )}

        {activeTab === 'coupons' && isBond && (
          <Card className="bg-dark text-white">
            <Card.Body>
              <Card.Title>
                <i className="bi bi-cash-coin"></i> История купонов
              </Card.Title>
              {couponHistory.length > 0 ? (
                <CouponHistoryDetail couponHistory={couponHistory} quantity={position.quantity} />
              ) : (
                <p className="text-muted text-center py-5">История купонов пуста</p>
              )}
            </Card.Body>
          </Card>
        )}

        {activeTab === 'dividends' && !isBond && (
          <Card className="bg-dark text-white">
            <Card.Body>
              <Card.Title>
                <i className="bi bi-cash-stack"></i> История дивидендов
              </Card.Title>
              {dividendHistory.length > 0 ? (
                <DividendHistoryDetail dividendHistory={dividendHistory} quantity={position.quantity} />
              ) : (
                <p className="text-muted text-center py-5">История дивидендов пуста</p>
              )}
            </Card.Body>
          </Card>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Закрыть
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default SecurityDetailModal
