import { useState, useEffect, useRef } from 'react'
import { Container, Row, Col, Button, Card } from 'react-bootstrap'
import { usePortfolio } from '../hooks/usePortfolio'
import { useStocks } from '../hooks/useStocks'
import { fetchBonds, transformBondData, formatCouponPeriod, fetchNextCouponDate, daysUntilCoupon, daysUntilMaturity, formatDate, fetchCouponHistory, fetchDividendHistory } from '../api/moex'
import AddToPortfolioModal from '../components/AddToPortfolioModal'
import AddDividendModal from '../components/AddDividendModal'
import CouponHistoryModal from '../components/CouponHistoryModal'
import DividendHistoryModal from '../components/DividendHistoryModal'
import EditPurchaseDateModal from '../components/EditPurchaseDateModal'
import EditPurchasePriceModal from '../components/EditPurchasePriceModal'
import ExportImportModal from '../components/ExportImportModal'
import BondRedemptionModal from '../components/BondRedemptionModal'
import RedeemedBondsModal from '../components/RedeemedBondsModal'
import PositionsTable from '../components/PositionsTable'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorDisplay from '../components/ErrorDisplay'
import Header from '../components/Header'

function PortfolioPage() {
  const { portfolio, redeemedBonds, couponHistory, dividendHistory, currencyRates, addPosition, removePosition, updatePurchaseDate, updatePurchasePrice, getTotalValue, getTotalPnL, confirmCoupon, confirmDividend, confirmBondRedemption, exportJSON, exportCSV, importJSON, importCSV } = usePortfolio()
  const { stocks: stockList, loading: stocksLoading, error: stocksError } = useStocks()
  const [bonds, setBonds] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showDividendHistoryModal, setShowDividendHistoryModal] = useState(false)
  const [showAddDividendModal, setShowAddDividendModal] = useState(false)
  const [showExportImportModal, setShowExportImportModal] = useState(false)
  const [showBondRedemptionModal, setShowBondRedemptionModal] = useState(false)
  const [showRedeemedBondsModal, setShowRedeemedBondsModal] = useState(false)
  const [addingDividendPosition, setAddingDividendPosition] = useState(null)
  const [bondRedemptionPosition, setBondRedemptionPosition] = useState(null)
  const [showEditDateModal, setShowEditDateModal] = useState(false)
  const [editingPosition, setEditingPosition] = useState(null)
  const [editingPricePosition, setEditingPricePosition] = useState(null)
  const [securityType, setSecurityType] = useState('stock')
  const [loadingBonds, setLoadingBonds] = useState(true)
  const [bondsError, setBondsError] = useState(null)
  const [couponDates, setCouponDates] = useState({})
  const [receivedCoupons, setReceivedCoupons] = useState({})
  const [couponHistoryData, setCouponHistoryData] = useState({})
  const [dividendHistoryData, setDividendHistoryData] = useState({})
  const loadedCouponIdsRef = useRef(new Set())

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

  // Обработка погашения облигации
  const handleBondRedemption = (position) => {
    setBondRedemptionPosition(position)
    setShowBondRedemptionModal(true)
  }

  // Обработка подтверждения погашения
  const handleConfirmBondRedemption = (redemptionData) => {
    confirmBondRedemption(redemptionData.positionId, redemptionData)
    setShowBondRedemptionModal(false)
    setBondRedemptionPosition(null)
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
    const currency = position.currency || 'RUB'
    const rate = currencyRates[currency] || 1
    
    const marketValue = currentPrice * position.quantity
    const marketValueRub = marketValue * rate // В рублях
    const invested = position.avgPrice * position.quantity
    const investedRub = invested * rate // В рублях
    const pnl = marketValueRub - investedRub
    const pnlPercent = invested > 0 ? (pnl / investedRub) * 100 : 0

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
      currency,
      currentPrice,
      marketValue,
      marketValueRub,
      invested,
      investedRub,
      pnl,
      pnlPercent,
      couponPerBond,
      totalCoupon,
      couponPeriod,
      daysToCoupon,
      maturityDate,
      daysToMaturity,
      rate
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
        <Container fluid className="py-4">
          <LoadingSpinner />
        </Container>
      </div>
    )
  }

  if (stocksError) {
    return (
      <div className="app">
        <Header />
        <Container fluid className="py-4">
          <ErrorDisplay message={stocksError} onRetry={() => window.location.reload()} />
        </Container>
      </div>
    )
  }

  return (
    <div className="app">
      <Header />
      <Container fluid className="py-4">
        {/* Заголовок */}
        <Row className="mb-4">
          <Col>
            <h2><i className="bi bi-briefcase"></i> Мой портфель</h2>
          </Col>
        </Row>
        <Row className="mb-4">
          <Col>
            <div className="d-flex gap-2 flex-wrap">
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
              <Button
                variant="warning"
                onClick={() => setShowRedeemedBondsModal(true)}
                disabled={redeemedBonds.length === 0}
              >
                <i className="bi bi-archive"></i> Погашенные
                {redeemedBonds.length > 0 && (
                  <span className="ms-2 badge bg-white text-dark">{redeemedBonds.length}</span>
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowExportImportModal(true)}
              >
                <i className="bi bi-download"></i> Экспорт/Импорт
              </Button>
            </div>
          </Col>
        </Row>

        {/* Сводка */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="portfolio-summary">
              <Card.Body>
                <Card.Title>Стоимость портфеля</Card.Title>
                <Card.Text className="summary-value">₽{totalValue.toFixed(2)}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="portfolio-summary">
              <Card.Body>
                <Card.Title>Вложено</Card.Title>
                <Card.Text className="summary-value">₽{totalInvested.toFixed(2)}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="portfolio-summary">
              <Card.Body>
                <Card.Title>Прибыль/Убыток</Card.Title>
                <Card.Text className={`summary-value ${totalPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                  {totalPnL >= 0 ? '+' : ''}₽{totalPnL.toFixed(2)} ({totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%)
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="portfolio-summary">
              <Card.Body>
                <Card.Title>Купоны (облигации)</Card.Title>
                <Card.Text className={`summary-value ${totalCoupons > 0 ? 'text-success' : ''}`}>
                  ₽{totalCoupons.toFixed(2)}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="portfolio-summary">
              <Card.Body>
                <Card.Title>Получено купонов</Card.Title>
                <Card.Text className={`summary-value ${totalReceivedCoupons > 0 ? 'text-success' : ''}`}>
                  ₽{totalReceivedCoupons.toFixed(2)}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="portfolio-summary">
              <Card.Body>
                <Card.Title>Курсы валют (ЦБ РФ)</Card.Title>
                <div className="summary-value" style={{ fontSize: '1rem' }}>
                  <div>USD: {currencyRates.USD?.toFixed(2)} ₽</div>
                  <div>EUR: {currencyRates.EUR?.toFixed(2)} ₽</div>
                  <div className="text-white-50" style={{ fontSize: '0.85rem' }}>
                    {currencyRates.lastUpdate ? new Date(currencyRates.lastUpdate).toLocaleDateString('ru-RU') : ''}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Таблица позиций */}
        <Row className="w-100 mx-0">
          <Col fluid="xl">
            <PositionsTable
              positions={positionsWithData}
              bonds={bonds}
              onRemovePosition={removePosition}
              onEditPurchaseDate={handleEditPurchaseDate}
              onEditPurchasePrice={(position) => setEditingPricePosition(position)}
              onAddDividend={(position) => {
                setAddingDividendPosition(position)
                setShowAddDividendModal(true)
              }}
              onConfirmCoupon={handleConfirmCoupon}
              onBondRedemption={handleBondRedemption}
              receivedCoupons={receivedCoupons}
              couponDates={couponDates}
              setCouponDates={setCouponDates}
              couponHistoryData={couponHistoryData}
              dividendHistoryData={dividendHistoryData}
            />
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
          onRemoveCoupon={removeCoupon}
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

        {/* Модальное окно экспорта/импорта */}
        <ExportImportModal
          show={showExportImportModal}
          onClose={() => setShowExportImportModal(false)}
          onExportJSON={exportJSON}
          onExportCSV={exportCSV}
          onImportJSON={(data) => {
            try {
              importJSON(data)
              alert('Портфель успешно импортирован!')
              setShowExportImportModal(false)
            } catch (err) {
              alert('Ошибка импорта: ' + err.message)
            }
          }}
          onImportCSV={(text) => {
            try {
              importCSV(text)
              alert('Портфель успешно импортирован из CSV!')
              setShowExportImportModal(false)
            } catch (err) {
              alert('Ошибка импорта: ' + err.message)
            }
          }}
          portfolio={portfolio}
          couponHistory={couponHistory}
          dividendHistory={dividendHistory}
        />

        {/* Модальное окно погашения облигации */}
        <BondRedemptionModal
          show={showBondRedemptionModal}
          onClose={() => {
            setShowBondRedemptionModal(false)
            setBondRedemptionPosition(null)
          }}
          onConfirm={handleConfirmBondRedemption}
          position={bondRedemptionPosition}
        />

        {/* Модальное окно погашенных облигаций */}
        <RedeemedBondsModal
          show={showRedeemedBondsModal}
          onClose={() => setShowRedeemedBondsModal(false)}
          redeemedBonds={redeemedBonds}
        />
      </Container>
    </div>
  )
}

export default PortfolioPage
