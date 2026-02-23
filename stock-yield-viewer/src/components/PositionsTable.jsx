import { useState, useRef } from 'react'
import { Table, Button, Badge, Nav } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { formatDate } from '../api/moex'
import { formatNumber } from '../utils/format'
import SecurityIcon from './SecurityIcon'

/**
 * Таблица позиций портфеля с разделением на акции и облигации
 */
function PositionsTable({
  positions,
  bonds,
  onRemovePosition,
  onEditPurchaseDate,
  onEditPurchasePrice,
  onAddDividend,
  onAddCoupon,
  onConfirmCoupon,
  onBondRedemption,
  receivedCoupons = {},
  couponDates = {},
  setCouponDates,
  couponHistoryData = {},
  dividendHistoryData = {}
}) {
  const navigate = useNavigate()
  // Активная вкладка: 'all', 'stocks', 'bonds'
  const [activeTab, setActiveTab] = useState('all')
  const loadedCouponIdsRef = useRef(new Set())

  // Фильтрация позиций
  const filteredPositions = positions.filter(position => {
    if (activeTab === 'stocks') return position.type === 'stock'
    if (activeTab === 'bonds') return position.type === 'bond'
    return true
  })

  // Сортировка для вкладок "Облигации" и "Все"
  const sortedPositions = activeTab !== 'stocks'
    ? [...filteredPositions].sort((a, b) => {
        // Сортируем только облигации
        if (a.type !== 'bond' || b.type !== 'bond') return 0

        // Сначала те, у которых 0 дней до купона (неподтверждённые)
        const aIsZeroCoupon = a.daysToCoupon === 0 && !receivedCoupons[a.securityId]
        const bIsZeroCoupon = b.daysToCoupon === 0 && !receivedCoupons[b.securityId]

        if (aIsZeroCoupon && !bIsZeroCoupon) return -1
        if (!aIsZeroCoupon && bIsZeroCoupon) return 1

        // Затем по возрастанию "Через" (период между купонами)
        // Преобразуем строку "30 дн." в число 30
        const parsePeriod = (period) => {
          if (!period) return 9999
          if (typeof period === 'number') return period
          const match = String(period).match(/(\d+)/)
          return match ? parseInt(match[1]) : 9999
        }

        const aPeriod = parsePeriod(a.couponPeriod)
        const bPeriod = parsePeriod(b.couponPeriod)

        // Если периоды одинаковые, сортируем по дням до купона (кто ближе)
        if (aPeriod === bPeriod) {
          const aDays = a.daysToCoupon !== null ? a.daysToCoupon : 9999
          const bDays = b.daysToCoupon !== null ? b.daysToCoupon : 9999
          return aDays - bDays
        }

        return aPeriod - bPeriod
      })
    : filteredPositions

  // Разделение на акции и облигации
  const stockPositions = positions.filter(p => p.type === 'stock')
  const bondPositions = positions.filter(p => p.type === 'bond')

  // Сводка по акциям
  const stocksTotalValue = stockPositions.reduce((sum, p) => sum + p.marketValueRub, 0)
  const stocksTotalInvested = stockPositions.reduce((sum, p) => sum + (p.investedRub), 0)
  const stocksTotalPnL = stocksTotalValue - stocksTotalInvested
  const stocksTotalPnLPercent = stocksTotalInvested > 0 ? (stocksTotalPnL / stocksTotalInvested) * 100 : 0

  // Сводка по облигациям
  const bondsTotalValue = bondPositions.reduce((sum, p) => sum + p.marketValueRub, 0)
  const bondsTotalInvested = bondPositions.reduce((sum, p) => sum + (p.investedRub), 0)
  const bondsTotalPnL = bondsTotalValue - bondsTotalInvested
  const bondsTotalPnLPercent = bondsTotalInvested > 0 ? (bondsTotalPnL / bondsTotalInvested) * 100 : 0
  const bondsTotalCoupons = bondPositions.reduce((sum, p) => sum + p.totalCoupon, 0)

  if (positions.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <i className="bi bi-inbox" style={{ fontSize: '3rem' }}></i>
        <p className="mt-3">Портфель пуст. Добавьте первые бумаги!</p>
      </div>
    )
  }

  return (
    <div className="positions-table">
      {/* Переключатель вкладок */}
      <Nav variant="pills" className="mb-3" activeKey={activeTab} onSelect={setActiveTab}>
        <Nav.Item>
          <Nav.Link eventKey="all">
            <i className="bi bi-layers"></i> Все ({positions.length})
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="stocks">
            <i className="bi bi-graph-up"></i> Акции ({stockPositions.length})
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="bonds">
            <i className="bi bi-bank"></i> Облигации ({bondPositions.length})
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {/* Сводка по выбранной вкладке */}
      {activeTab !== 'all' && (
        <div className="mb-3 p-3" style={{ background: 'var(--bg-secondary)', borderRadius: '8px' }}>
          {activeTab === 'stocks' && (
            <div className="d-flex justify-content-between">
              <div>
                <div className="text-white small">Стоимость</div>
                <div className="fw-bold">{formatNumber(stocksTotalValue)} ₽</div>
              </div>
              <div>
                <div className="text-white small">Вложено</div>
                <div className="fw-bold">{formatNumber(stocksTotalInvested)} ₽</div>
              </div>
              <div>
                <div className="text-white small">Прибыль/Убыток</div>
                <div className={`fw-bold ${stocksTotalPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                  {stocksTotalPnL >= 0 ? '+' : ''}{formatNumber(stocksTotalPnL)} ₽ ({stocksTotalPnLPercent >= 0 ? '+' : ''}{stocksTotalPnLPercent.toFixed(2)}%)
                </div>
              </div>
            </div>
          )}
          {activeTab === 'bonds' && (
            <div className="d-flex justify-content-between">
              <div>
                <div className="text-white small">Стоимость</div>
                <div className="fw-bold">{formatNumber(bondsTotalValue)} ₽</div>
              </div>
              <div>
                <div className="text-white small">Вложено</div>
                <div className="fw-bold">{formatNumber(bondsTotalInvested)} ₽</div>
              </div>
              <div>
                <div className="text-white small">Прибыль/Убыток</div>
                <div className={`fw-bold ${bondsTotalPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                  {bondsTotalPnL >= 0 ? '+' : ''}{formatNumber(bondsTotalPnL)} ₽ ({bondsTotalPnLPercent >= 0 ? '+' : ''}{bondsTotalPnLPercent.toFixed(2)}%)
                </div>
              </div>
              <div>
                <div className="text-white small">Купоны</div>
                <div className="fw-bold text-success">{formatNumber(bondsTotalCoupons)} ₽</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Таблица позиций */}
      <Table responsive hover className="positions-table">
        <thead>
          <tr>
            <th>Бумага</th>
            <th>Тип</th>
            <th>Валюта</th>
            <th>Кол-во</th>
            <th>
              <div className="text-white-50">Цена</div>
              <div>покупки</div>
            </th>
            <th>
              <div className="text-white-50">Общая</div>
              <div>сумма</div>
            </th>
            <th>Текущая цена</th>
            <th>Рыночная стоимость</th>
            <th>Прибыль/Убыток</th>
            <th>Дата покупки</th>
            {activeTab !== 'stocks' && (
              <>
                <th>Дата погашения</th>
                <th>До погашения</th>
                <th>Купон</th>
                <th>Через</th>
                <th>До купона</th>
                <th>Купоны</th>
              </>
            )}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sortedPositions.map(position => (
            <tr key={position.id}>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <SecurityIcon ticker={position.ticker} size={32} />
                  <div>
                    <div className="table-ticker">{position.ticker}</div>
                    <div className="table-name">{position.name}</div>
                  </div>
                </div>
              </td>
              <td>
                <span className={`badge ${position.type === 'bond' ? 'bg-info' : 'bg-primary'}`}>
                  {position.type === 'bond' ? 'Облигация' : 'Акция'}
                </span>
              </td>
              <td>
                <span className={`badge ${position.currency === 'RUB' ? 'bg-secondary' : 'bg-warning text-dark'}`}>
                  {position.currency}
                </span>
              </td>
              <td>{position.quantity}</td>
              <td>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0"
                  onClick={() => onEditPurchasePrice(position)}
                >
                  <span className="text-info">
                    {position.currency === 'RUB' ? '₽ ' : position.currency + ' '}{formatNumber(position.avgPrice)}
                  </span>
                  <i className="bi bi-pencil-fill ms-1" style={{ fontSize: '0.7rem' }}></i>
                </Button>
              </td>
              <td>
                <div className="fw-bold">
                  {position.currency === 'RUB' ? '₽ ' : position.currency + ' '}{formatNumber(position.invested)}
                </div>
                {position.currency !== 'RUB' && (
                  <small className="text-muted">
                    ≈ {formatNumber(position.investedRub)} ₽
                  </small>
                )}
              </td>
              <td>
                {position.currency === 'RUB' ? '₽ ' : position.currency + ' '}{formatNumber(position.currentPrice)}
              </td>
              <td>
                <div>{position.currency === 'RUB' ? '₽ ' : position.currency + ' '}{formatNumber(position.marketValue)}</div>
                {position.currency !== 'RUB' && (
                  <small className="text-muted">
                    ≈ {formatNumber(position.marketValueRub)} ₽
                  </small>
                )}
              </td>
              <td className={position.pnl >= 0 ? 'text-success' : 'text-danger'}>
                {position.pnl >= 0 ? '+' : ''}{position.currency === 'RUB' ? '₽ ' : position.currency + ' '}{formatNumber(position.pnl)} ({position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%)
              </td>
              <td>
                {(position.type === 'bond' || position.type === 'stock') ? (
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0"
                    onClick={() => onEditPurchaseDate(position)}
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

              {/* Колонки только для облигаций */}
              {activeTab !== 'stocks' && (
                <>
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
                        position.daysToMaturity === 0 ? (
                          <div className="d-flex align-items-center gap-2">
                            <span className="text-danger fw-bold">0 дн.</span>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => onBondRedemption(position)}
                            >
                              <i className="bi bi-cash-coin"></i> Погасить
                            </Button>
                          </div>
                        ) : (
                          <span className={position.daysToMaturity <= 30 ? 'text-danger' : position.daysToMaturity <= 90 ? 'text-warning' : 'text-success'}>
                            {position.daysToMaturity} дн.
                          </span>
                        )
                      ) : (
                        <span className="text-muted">—</span>
                      )
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    {position.type === 'bond' ? (
                      <span className="text-info">
                        {position.couponPeriod || '—'}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    {position.type === 'bond' ? (
                      receivedCoupons[position.securityId] ? (
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => {
                            setReceivedCoupons(prev => ({
                              ...prev,
                              [position.securityId]: undefined
                            }))
                            if (setCouponDates) {
                              setCouponDates(prev => ({
                                ...prev,
                                [position.securityId]: undefined
                              }))
                            }
                            loadedCouponIdsRef.current.delete(position.securityId)
                          }}
                        >
                          <i className="bi bi-arrow-clockwise"></i>
                        </Button>
                      ) : position.daysToCoupon === 0 ? (
                        <div className="d-flex align-items-center gap-2">
                          <span className="text-danger fw-bold">0 дн.</span>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => onConfirmCoupon(position)}
                          >
                            <i className="bi bi-check-lg"></i> Получить
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
                      <span className="text-success">
                        {position.currency === 'RUB' ? '₽ ' : position.currency + ' '}{formatNumber(position.totalCoupon)}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </>
              )}

              {/* Кнопки действий */}
              <td>
                <Button
                  variant="outline-info"
                  size="sm"
                  className="me-2"
                  onClick={() => navigate(`/security/${position.type}/${position.securityId}`)}
                >
                  <i className="bi bi-info-circle"></i> Детали
                </Button>
                {position.type === 'stock' && (
                  <Button
                    variant="outline-success"
                    size="sm"
                    className="me-2"
                    onClick={() => onAddDividend(position)}
                  >
                    <i className="bi bi-plus-circle"></i> Дивиденд
                  </Button>
                )}
                {position.type === 'bond' && (
                  <Button
                    variant="outline-success"
                    size="sm"
                    className="me-2"
                    onClick={() => onAddCoupon(position)}
                  >
                    <i className="bi bi-plus-circle"></i> Купон
                  </Button>
                )}
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => onRemovePosition(position.id)}
                >
                  <i className="bi bi-trash"></i>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}

export default PositionsTable
