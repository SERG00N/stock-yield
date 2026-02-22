import { Modal, Button, Table, Badge } from 'react-bootstrap'

/**
 * Модальное окно для отображения истории полученных купонов
 */
function CouponHistoryModal({ show, onClose, couponHistory, portfolioPositions, bonds, couponHistoryData }) {
  // Сортировка по дате (новые сверху)
  const sortedHistory = [...couponHistory].sort((a, b) =>
    new Date(b.date) - new Date(a.date)
  )

  // Подсчёт общей суммы полученных купонов (из ручной истории)
  const totalCoupons = couponHistory.reduce((sum, item) => sum + item.couponAmount, 0)

  // Расчёт купонов по годам для всех облигаций в портфеле
  const calculateCouponsByYearFromPositions = () => {
    const yearsCoupons = {}
    const today = new Date()

    // Сначала добавляем купоны из истории (ручные и авто)
    couponHistory.forEach(item => {
      if (!item.date || !item.couponAmount) return

      const couponDate = new Date(item.date)
      const year = couponDate.getFullYear()

      if (!yearsCoupons[year]) {
        yearsCoupons[year] = { amount: 0, count: 0, byBond: {} }
      }
      if (!yearsCoupons[year].byBond[item.securityId]) {
        yearsCoupons[year].byBond[item.securityId] = {
          amount: 0,
          count: 0,
          ticker: item.ticker,
          name: item.name
        }
      }
      yearsCoupons[year].amount += item.couponAmount
      yearsCoupons[year].count += 1
      yearsCoupons[year].byBond[item.securityId].amount += item.couponAmount
      yearsCoupons[year].byBond[item.securityId].count += 1
    })

    portfolioPositions
      .filter(p => p.type === 'bond' && p.purchaseDate)
      .forEach(position => {
        const bond = bonds.find(b => b.id === position.securityId)
        if (!bond) return

        const purchaseDate = new Date(position.purchaseDate)
        const couponPerBond = bond.couponValue || 0
        const quantity = position.quantity

        // Проверяем, есть ли история купонов из API
        const apiHistory = couponHistoryData[position.securityId] || []

        if (apiHistory.length > 0) {
          // Используем реальные данные из API для облигаций с плавающим купоном
          apiHistory.forEach(coupon => {
            if (!coupon.date) return

            const couponDate = new Date(coupon.date)

            // Пропускаем купоны до даты покупки
            if (couponDate < purchaseDate) return
            // Пропускаем будущие купоны
            if (couponDate > today) return

            const year = couponDate.getFullYear()
            // Используем реальный размер купона из API
            const couponAmount = (coupon.value || 0) * quantity

            if (!yearsCoupons[year]) {
              yearsCoupons[year] = { amount: 0, count: 0, byBond: {} }
            }
            if (!yearsCoupons[year].byBond[position.securityId]) {
              yearsCoupons[year].byBond[position.securityId] = {
                amount: 0,
                count: 0,
                ticker: position.ticker,
                name: position.name
              }
            }
            yearsCoupons[year].amount += couponAmount
            yearsCoupons[year].count += 1
            yearsCoupons[year].byBond[position.securityId].amount += couponAmount
            yearsCoupons[year].byBond[position.securityId].count += 1
          })
        } else {
          // Для облигаций без истории используем расчёт по периодичности
          const couponPeriodDays = bond.couponPeriod || 30

          let currentDate = new Date(purchaseDate)
          currentDate.setDate(currentDate.getDate() + couponPeriodDays)

          while (currentDate <= today) {
            const year = currentDate.getFullYear()
            const couponAmount = couponPerBond * quantity

            if (!yearsCoupons[year]) {
              yearsCoupons[year] = { amount: 0, count: 0, byBond: {} }
            }
            if (!yearsCoupons[year].byBond[position.securityId]) {
              yearsCoupons[year].byBond[position.securityId] = {
                amount: 0, 
                count: 0,
                ticker: position.ticker,
                name: position.name
              }
            }
            yearsCoupons[year].amount += couponAmount
            yearsCoupons[year].count += 1
            yearsCoupons[year].byBond[position.securityId].amount += couponAmount
            yearsCoupons[year].byBond[position.securityId].count += 1
            
            currentDate.setDate(currentDate.getDate() + couponPeriodDays)
          }
        }
      })
    
    return yearsCoupons
  }

  const calculatedCouponsByYear = calculateCouponsByYearFromPositions()
  const sortedYears = Object.keys(calculatedCouponsByYear).sort((a, b) => b - a)

  // Форматирование даты
  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-cash-coin"></i> История купонов
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {couponHistory.length === 0 && sortedYears.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <i className="bi bi-inbox" style={{ fontSize: '3rem' }}></i>
            <p className="mt-3">История купонов пуста</p>
          </div>
        ) : (
          <>
            <div className="mb-3 p-3" style={{ background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <strong>Всего получено:</strong>
                <span className="text-success fw-bold" style={{ fontSize: '1.25rem' }}>₽{totalCoupons.toFixed(2)}</span>
              </div>
              {sortedYears.length > 0 && (
                <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <div className="text-white mb-2">По годам:</div>
                  {sortedYears.map(year => (
                    <div key={year} className="text-white mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2 pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <span className="fw-bold">{year} г.</span>
                        <span className="text-success fw-bold">₽{calculatedCouponsByYear[year].amount.toFixed(2)}</span>
                      </div>
                      <div className="text-white-50 small mb-2">
                        {calculatedCouponsByYear[year].count} выплат(ы) всего
                      </div>
                      {/* Детализация по облигациям */}
                      <div className="ms-3">
                        {Object.entries(calculatedCouponsByYear[year].byBond).map(([secid, bondData]) => (
                          <div key={secid} className="mb-2 p-2" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <div className="fw-bold text-info">{bondData.ticker}</div>
                                <div className="small text-white-50">{bondData.name}</div>
                              </div>
                              <div className="text-end">
                                <div className="text-success fw-bold">₽{bondData.amount.toFixed(2)}</div>
                                <div className="small text-white-50">{bondData.count} выплат(ы)</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Table responsive hover striped>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Бумага</th>
                  <th>Количество</th>
                  <th>Купонов</th>
                  <th>Сумма купона</th>
                  <th>Тип</th>
                </tr>
              </thead>
              <tbody>
                {sortedHistory.map(item => (
                  <tr key={item.id}>
                    <td>{formatDate(item.date)}</td>
                    <td>
                      <div className="fw-bold">{item.ticker}</div>
                      <div className="text-muted small">{item.name}</div>
                    </td>
                    <td>{item.quantity}</td>
                    <td>
                      {item.couponsCount ? (
                        <span>{item.couponsCount} шт.</span>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                    <td className="text-success fw-bold">
                      ₽{item.couponAmount.toFixed(2)}
                    </td>
                    <td>
                      {item.isInitialCoupon ? (
                        <Badge bg="info">При добавлении</Badge>
                      ) : item.isManualCoupon ? (
                        <Badge bg="warning">Ручной купон</Badge>
                      ) : (
                        <Badge bg="success">Получение</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Закрыть
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default CouponHistoryModal
