import { useState, useEffect, useRef } from 'react'
import { Container, Row, Col, Button, Card, Table } from 'react-bootstrap'
import { usePortfolio } from '../hooks/usePortfolio'
import { useStocks } from '../hooks/useStocks'
import { fetchBonds, transformBondData, formatCouponPeriod, fetchNextCouponDate, daysUntilCoupon, daysUntilMaturity, formatDate, fetchCouponHistory, fetchDividendHistory } from '../api/moex'
import AddToPortfolioModal from '../components/AddToPortfolioModal'
import AddDividendModal from '../components/AddDividendModal'
import CouponHistoryModal from '../components/CouponHistoryModal'
import DividendHistoryModal from '../components/DividendHistoryModal'
import EditPurchaseDateModal from '../components/EditPurchaseDateModal'
import EditPurchasePriceModal from '../components/EditPurchasePriceModal'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorDisplay from '../components/ErrorDisplay'
import Header from '../components/Header'

function PortfolioPage() {
  const { portfolio, couponHistory, dividendHistory, addPosition, removePosition, updatePurchaseDate, updatePurchasePrice, getTotalValue, getTotalPnL, confirmCoupon, confirmDividend } = usePortfolio()
  const { stocks: stockList, loading: stocksLoading, error: stocksError } = useStocks()
  const [bonds, setBonds] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showDividendHistoryModal, setShowDividendHistoryModal] = useState(false)
  const [showAddDividendModal, setShowAddDividendModal] = useState(false)
  const [addingDividendPosition, setAddingDividendPosition] = useState(null)
  const [showEditDateModal, setShowEditDateModal] = useState(false)
  const [editingPosition, setEditingPosition] = useState(null)
  const [editingPricePosition, setEditingPricePosition] = useState(null)
  const [securityType, setSecurityType] = useState('stock') // 'stock' или 'bond'
  const [loadingBonds, setLoadingBonds] = useState(true)
  const [bondsError, setBondsError] = useState(null)
  const [couponDates, setCouponDates] = useState({}) // { [secid]: daysUntilCoupon }
  const [receivedCoupons, setReceivedCoupons] = useState({}) // { [secid]: true } - подтверждённые купоны
  const [couponHistoryData, setCouponHistoryData] = useState({}) // { [secid]: [{date, value}] }
  const [dividendHistoryData, setDividendHistoryData] = useState({}) // { [secid]: [{date, amount}] }
  const loadedCouponIdsRef = useRef(new Set()) // Отслеживание загруженных ID

  // Обработка подтверждения получения купона
  const handleConfirmCoupon = (position) => {
    const couponAmount = position.totalCoupon
    confirmCoupon(position.id, couponAmount, {
      ticker: position.ticker,
      name: position.name,
      securityId: position.securityId,
      quantity: position.quantity
    })

    // Помечаем купон как полученный
    setReceivedCoupons(prev => ({
      ...prev,
      [position.securityId]: true
    }))

    // Сбрасываем дату следующего купона для пересчёта
    setCouponDates(prev => ({
      ...prev,
      [position.securityId]: undefined
    }))
    loadedCouponIdsRef.current.delete(position.securityId)
  }

  // Обработка открытия модального окна редактирования даты покупки
  const handleEditPurchaseDate = (position) => {
    setEditingPosition(position)
    setShowEditDateModal(true)
  }

  // Обработка сохранения даты покупки
  const handleSavePurchaseDate = (date) => {
    if (editingPosition) {
      updatePurchaseDate(editingPosition.id, date)
    }
    setShowEditDateModal(false)
    setEditingPosition(null)
  }

  // Обработка открытия модального окна редактирования цены покупки
  const handleEditPurchasePrice = (position) => {
    setEditingPricePosition(position)
  }

  // Обработка сохранения цены покупки
  const handleSavePurchasePrice = (price) => {
    if (editingPricePosition) {
      updatePurchasePrice(editingPricePosition.id, parseFloat(price))
    }
    setEditingPricePosition(null)
  }

  // Обработка добавления дивиденда
  const handleAddDividend = (dividendData) => {
    if (addingDividendPosition) {
      confirmDividend(addingDividendPosition.id, dividendData.totalAmount, {
        ticker: addingDividendPosition.ticker,
        name: addingDividendPosition.name,
        securityId: addingDividendPosition.securityId,
        quantity: addingDividendPosition.quantity
      })
    }
    setShowAddDividendModal(false)
    setAddingDividendPosition(null)
  }

  // Загрузка облигаций при загрузке страницы
  useEffect(() => {
    const loadBonds = async () => {
      try {
        setLoadingBonds(true)
        setBondsError(null)
        const data = await fetchBonds()

        const transformed = data
          .map(transformBondData)
          .filter(bond => bond.price > 0)

        setBonds(transformed)
      } catch (err) {
        setBondsError('Не удалось загрузить список облигаций')
      } finally {
        setLoadingBonds(false)
      }
    }
    loadBonds()
  }, [])

  // Загрузка дат следующих купонов и истории купонов при изменении портфеля
  useEffect(() => {
    const loadCouponData = async () => {
      const portfolioBondIds = portfolio.filter(p => p.type === 'bond').map(p => p.securityId)
      if (portfolioBondIds.length === 0) return

      const couponDatesMap = {}
      const couponHistoryMap = {}

      for (const secid of portfolioBondIds) {
        // Пропускаем уже загруженные и подтверждённые
        if (loadedCouponIdsRef.current.has(secid)) continue
        if (receivedCoupons[secid]) continue // Не загружаем для подтверждённых

        // Загружаем дату следующего купона
        const nextCouponDate = await fetchNextCouponDate(secid)
        const days = daysUntilCoupon(nextCouponDate)
        if (days !== null) {
          couponDatesMap[secid] = days
          loadedCouponIdsRef.current.add(secid)
        }

        // Загружаем историю купонов
        const history = await fetchCouponHistory(secid)
        if (history.length > 0) {
          couponHistoryMap[secid] = history
        }
      }

      if (Object.keys(couponDatesMap).length > 0) {
        setCouponDates(prev => ({ ...prev, ...couponDatesMap }))
      }
      if (Object.keys(couponHistoryMap).length > 0) {
        setCouponHistoryData(prev => ({ ...prev, ...couponHistoryMap }))
      }
    }

    loadCouponData()
  }, [portfolio, receivedCoupons])

  // Загрузка истории дивидендов для акций
  useEffect(() => {
    const loadDividendData = async () => {
      const portfolioStockIds = portfolio.filter(p => p.type === 'stock').map(p => p.securityId)
      if (portfolioStockIds.length === 0) return

      const dividendHistoryMap = {}

      for (const secid of portfolioStockIds) {
        // Загружаем историю дивидендов
        const history = await fetchDividendHistory(secid)
        if (history.length > 0) {
          dividendHistoryMap[secid] = history
        }
      }

      if (Object.keys(dividendHistoryMap).length > 0) {
        setDividendHistoryData(prev => ({ ...prev, ...dividendHistoryMap }))
      }
    }

    loadDividendData()
  }, [portfolio])

  // Получаем текущие цены для расчётов
  const currentPrices = [...stockList, ...bonds].map(s => ({ id: s.id, price: s.price }))

  // Позиции портфеля с текущими данными
  const positionsWithData = portfolio.map(position => {
    const currentPrice = currentPrices.find(p => p.id === position.securityId)?.price || 0
    const marketValue = currentPrice * position.quantity
    const invested = position.avgPrice * position.quantity
    const pnl = marketValue - invested
    const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0

    // Купонная доходность для облигаций
    const bond = bonds.find(b => b.id === position.securityId)
    const couponPerBond = bond?.couponValue || 0
    const totalCoupon = couponPerBond * position.quantity
    const couponPeriod = bond?.couponPeriod || 0
    const daysToCoupon = couponDates[position.securityId]
    
    // Дата погашения и дни до погашения
    const maturityDate = bond?.maturityDate || null
    const daysToMaturity = daysUntilMaturity(maturityDate)

    return {
      ...position,
      currentPrice,
      marketValue,
      pnl,
      pnlPercent,
      couponPerBond,
      totalCoupon,
      couponPeriod,
      daysToCoupon,
      maturityDate,
      daysToMaturity
    }
  })

  const totalValue = getTotalValue(currentPrices)
  const totalPnL = getTotalPnL(currentPrices)
  const totalInvested = portfolio.reduce((sum, p) => sum + (p.avgPrice * p.quantity), 0)
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0
  
  // Общая сумма купонов по облигациям
  const totalCoupons = positionsWithData
    .filter(p => p.type === 'bond')
    .reduce((sum, p) => sum + p.totalCoupon, 0)

  // Общая сумма полученных купонов (из истории)
  const totalReceivedCoupons = couponHistory.reduce((sum, item) => sum + item.couponAmount, 0)

  if (stocksLoading) {
    return (
      <div className="app">
        <Header />
        <Container className="py-4">
          <LoadingSpinner />
        </Container>
      </div>
    )
  }

  if (stocksError) {
    return (
      <div className="app">
        <Header />
        <Container className="py-4">
          <ErrorDisplay message={stocksError} onRetry={() => window.location.reload()} />
        </Container>
      </div>
    )
  }

  return (
    <div className="app">
      <Header />
      <Container className="py-4">
        {/* Заголовок */}
        <Row className="mb-4">
          <Col>
            <h2><i className="bi bi-briefcase"></i> Мой портфель</h2>
          </Col>
        </Row>
        <Row className="mb-4">
          <Col>
            <div className="d-flex gap-2">
              <Button variant="primary" onClick={() => { setSecurityType('stock'); setShowModal(true) }}>
                <i className="bi bi-graph-up"></i> Добавить акцию
              </Button>
              <Button variant="info" onClick={() => { setSecurityType('bond'); setShowModal(true) }} disabled={loadingBonds}>
                <i className="bi bi-bank"></i> {loadingBonds ? 'Загрузка...' : 'Добавить облигацию'}
              </Button>
              <Button
                variant="success"
                onClick={() => setShowHistoryModal(true)}
                disabled={couponHistory.length === 0}
              >
                <i className="bi bi-cash-coin"></i> История купонов
                {couponHistory.length > 0 && (
                  <span className="ms-2 badge bg-white text-success">{couponHistory.length}</span>
                )}
              </Button>
              <Button
                variant="success"
                onClick={() => setShowDividendHistoryModal(true)}
                disabled={dividendHistory.length === 0}
              >
                <i className="bi bi-cash-stack"></i> История дивидендов
                {dividendHistory.length > 0 && (
                  <span className="ms-2 badge bg-white text-success">{dividendHistory.length}</span>
                )}
              </Button>
            </div>
          </Col>
        </Row>

        {/* Сводка */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="portfolio-summary">
              <Card.Body>
                <Card.Title className="text-muted">Стоимость портфеля</Card.Title>
                <Card.Text className="summary-value">₽{totalValue.toFixed(2)}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="portfolio-summary">
              <Card.Body>
                <Card.Title className="text-muted">Вложено</Card.Title>
                <Card.Text className="summary-value">₽{totalInvested.toFixed(2)}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="portfolio-summary">
              <Card.Body>
                <Card.Title className="text-muted">Прибыль/Убыток</Card.Title>
                <Card.Text className={`summary-value ${totalPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                  {totalPnL >= 0 ? '+' : ''}₽{totalPnL.toFixed(2)} ({totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%)
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="portfolio-summary">
              <Card.Body>
                <Card.Title className="text-muted">Купоны (облигации)</Card.Title>
                <Card.Text className={`summary-value ${totalCoupons > 0 ? 'text-success' : ''}`}>
                  ₽{totalCoupons.toFixed(2)}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="portfolio-summary">
              <Card.Body>
                <Card.Title className="text-muted">Получено купонов</Card.Title>
                <Card.Text className={`summary-value ${totalReceivedCoupons > 0 ? 'text-success' : ''}`}>
                  ₽{totalReceivedCoupons.toFixed(2)}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Таблица позиций */}
        <Row className="w-100 mx-0">
          <Col fluid="xl">
            <div className="stock-table-container">
              <h3><i className="bi bi-list-ul"></i> Позиции</h3>
              {portfolio.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-inbox" style={{ fontSize: '3rem' }}></i>
                  <p className="mt-3">Портфель пуст. Добавьте первые бумаги!</p>
                </div>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Бумага</th>
                      <th>Тип</th>
                      <th>Количество</th>
                      <th>Цена покупки</th>
                      <th>Текущая цена</th>
                      <th>Рыночная стоимость</th>
                      <th>Прибыль/Убыток</th>
                      <th>Дата покупки</th>
                      <th>Дата погашения</th>
                      <th>До погашения</th>
                      <th>Купон (шт)</th>
                      <th>Периодичность</th>
                      <th>До купона</th>
                      <th>Купоны (сумма)</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {positionsWithData.map(position => (
                      <tr key={position.id}>
                        <td>
                          <div className="table-ticker">{position.ticker}</div>
                          <div className="table-name">{position.name}</div>
                        </td>
                        <td>
                          <span className={`badge ${position.type === 'bond' ? 'bg-info' : 'bg-primary'}`}>
                            {position.type === 'bond' ? 'Облигация' : 'Акция'}
                          </span>
                        </td>
                        <td>{position.quantity}</td>
                        <td>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0"
                            onClick={() => handleEditPurchasePrice(position)}
                          >
                            <span className="text-info">
                              ₽{position.avgPrice.toFixed(2)}
                            </span>
                            <i className="bi bi-pencil-fill ms-1" style={{ fontSize: '0.7rem' }}></i>
                          </Button>
                        </td>
                        <td>₽{position.currentPrice.toFixed(2)}</td>
                        <td>₽{position.marketValue.toFixed(2)}</td>
                        <td className={position.pnl >= 0 ? 'text-success' : 'text-danger'}>
                          {position.pnl >= 0 ? '+' : ''}₽{position.pnl.toFixed(2)} ({position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%)
                        </td>
                        <td>
                          {(position.type === 'bond' || position.type === 'stock') ? (
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0"
                              onClick={() => handleEditPurchaseDate(position)}
                            >
                              <span className="text-info">
                                {position.purchaseDate ? formatDate(position.purchaseDate) : 'Добавить'}
                              </span>
                              <i className="bi bi-pencil-fill ms-1" style={{ fontSize: '0.7rem' }}></i>
                            </Button>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          {position.type === 'bond' ? (
                            <span className={position.maturityDate ? '' : 'text-muted'}>
                              {position.maturityDate ? formatDate(position.maturityDate) : '—'}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          {position.type === 'bond' ? (
                            position.daysToMaturity !== null ? (
                              <span className={position.daysToMaturity <= 30 ? 'text-danger' : position.daysToMaturity <= 90 ? 'text-warning' : 'text-success'}>
                                {position.daysToMaturity} дн.
                              </span>
                            ) : (
                              <span className="text-muted">—</span>
                            )
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          {position.type === 'bond' ? (
                            <span className="text-info">{formatCouponPeriod(position.couponPeriod)}</span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          {position.type === 'bond' ? (
                            receivedCoupons[position.securityId] ? (
                              // Купон подтверждён - показываем кнопку загрузки новых данных
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => {
                                  setReceivedCoupons(prev => ({
                                    ...prev,
                                    [position.securityId]: undefined
                                  }))
                                  setCouponDates(prev => ({
                                    ...prev,
                                    [position.securityId]: undefined
                                  }))
                                  loadedCouponIdsRef.current.delete(position.securityId)
                                }}
                              >
                                <i className="bi bi-arrow-clockwise"></i>
                              </Button>
                            ) : position.daysToCoupon === 0 ? (
                              // 0 дней - показываем кнопку подтверждения и красный таймер
                              <div className="d-flex align-items-center gap-2">
                                <span className="text-danger fw-bold">0 дн.</span>
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleConfirmCoupon(position)}
                                >
                                  <i className="bi bi-check-lg"></i> Получить купон
                                </Button>
                              </div>
                            ) : position.daysToCoupon !== undefined ? (
                              <span className={position.daysToCoupon <= 7 ? 'text-danger' : 'text-info'}>
                                {position.daysToCoupon} дн.
                              </span>
                            ) : (
                              <span className="text-muted">—</span>
                            )
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          {position.type === 'bond' ? (
                            <span className="text-success">₽{position.totalCoupon.toFixed(2)}</span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          {position.type === 'stock' && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              className="me-2"
                              onClick={() => {
                                setAddingDividendPosition(position)
                                setShowAddDividendModal(true)
                              }}
                            >
                              <i className="bi bi-plus-circle"></i> Дивиденд
                            </Button>
                          )}
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => removePosition(position.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          </Col>
        </Row>

        {/* Модальное окно */}
        <AddToPortfolioModal
          show={showModal}
          onClose={() => setShowModal(false)}
          onAdd={addPosition}
          stocks={stockList}
          bonds={bonds}
          securityType={securityType}
          loading={securityType === 'bond' && loadingBonds}
          bondsError={bondsError}
        />

        {/* Модальное окно истории купонов */}
        <CouponHistoryModal
          show={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          couponHistory={couponHistory}
          portfolioPositions={positionsWithData}
          bonds={bonds}
          couponHistoryData={couponHistoryData}
        />

        {/* Модальное окно редактирования даты покупки */}
        <EditPurchaseDateModal
          show={showEditDateModal}
          onClose={() => {
            setShowEditDateModal(false)
            setEditingPosition(null)
          }}
          onSave={handleSavePurchaseDate}
          position={editingPosition}
        />

        {/* Модальное окно редактирования цены покупки */}
        <EditPurchasePriceModal
          show={!!editingPricePosition}
          onClose={() => setEditingPricePosition(null)}
          onSave={handleSavePurchasePrice}
          position={editingPricePosition}
        />

        {/* Модальное окно добавления дивиденда */}
        <AddDividendModal
          show={showAddDividendModal}
          onClose={() => {
            setShowAddDividendModal(false)
            setAddingDividendPosition(null)
          }}
          onSave={handleAddDividend}
          position={addingDividendPosition}
        />

        {/* Модальное окно истории дивидендов */}
        <DividendHistoryModal
          show={showDividendHistoryModal}
          onClose={() => setShowDividendHistoryModal(false)}
          dividendHistory={dividendHistory}
          portfolioPositions={positionsWithData}
          stocks={stockList}
          dividendHistoryData={dividendHistoryData}
        />
      </Container>
    </div>
  )
}

export default PortfolioPage
