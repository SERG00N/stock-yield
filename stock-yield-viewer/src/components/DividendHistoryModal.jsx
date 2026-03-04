import { Modal, Button, Table, Badge } from 'react-bootstrap'

/**
 * Модальное окно для отображения истории полученных дивидендов
 */
function DividendHistoryModal({ show, onClose, dividendHistory, portfolioPositions, dividendHistoryData, onRemoveDividend }) {
  // Создаём полную историю дивидендов из API + ручные
  const getAllDividends = () => {
    const allDividends = []
    const today = new Date()

    portfolioPositions
      .filter(p => p.type === 'stock' && p.purchaseDate)
      .forEach(position => {
        const purchaseDate = new Date(position.purchaseDate)
        const quantity = position.quantity
        const apiHistory = dividendHistoryData[position.securityId] || []

        // Добавляем дивиденды из API
        apiHistory.forEach(div => {
          if (!div.date) return
          const divDate = new Date(div.date)

          // Показываем только дивиденды после даты покупки и не будущие
          if (divDate < purchaseDate || divDate > today) return

          allDividends.push({
            id: `api-${position.securityId}-${div.date}`,
            date: div.date,
            ticker: position.ticker,
            name: position.name,
            quantity,
            dividendAmount: (div.amount || 0) * quantity,
            amountPerShare: div.amount || 0,
            type: div.type || 'common',
            source: 'api',
            period: div.period,
            securityId: position.securityId
          })
        })
      })

    // Добавляем ручные дивиденды
    dividendHistory.forEach(item => {
      allDividends.push({
        ...item,
        source: 'manual',
        amountPerShare: item.dividendAmount / item.quantity
      })
    })

    // Сортируем по дате (новые сверху)
    return allDividends.sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  const allDividends = getAllDividends()

  // Подсчёт общей суммы всех дивидендов (API + ручные)
  const totalDividends = allDividends.reduce((sum, item) => sum + item.dividendAmount, 0)

  // Подсчёт только ручных дивидендов
  const manualDividendsTotal = dividendHistory.reduce((sum, item) => sum + item.dividendAmount, 0)

  // Расчёт дивидендов по годам для всех акций в портфеле
  const calculateDividendsByYearFromPositions = () => {
    const yearsDividends = {}
    const today = new Date()

    portfolioPositions
      .filter(p => p.type === 'stock' && p.purchaseDate)
      .forEach(position => {
        const purchaseDate = new Date(position.purchaseDate)
        const quantity = position.quantity

        // Проверяем, есть ли история дивидендов из API
        const apiHistory = dividendHistoryData[position.securityId] || []

        if (apiHistory.length > 0) {
          // Используем реальные данные из API
          apiHistory.forEach(div => {
            if (!div.date) return

            const divDate = new Date(div.date)

            // Пропускаем дивиденды до даты покупки
            if (divDate < purchaseDate) return
            // Пропускаем будущие дивиденды
            if (divDate > today) return

            const year = divDate.getFullYear()
            // Используем реальный размер дивиденда из API
            const dividendAmount = (div.amount || 0) * quantity

            if (!yearsDividends[year]) {
              yearsDividends[year] = { amount: 0, count: 0, byStock: {} }
            }
            if (!yearsDividends[year].byStock[position.securityId]) {
              yearsDividends[year].byStock[position.securityId] = {
                amount: 0,
                count: 0,
                ticker: position.ticker,
                name: position.name
              }
            }
            yearsDividends[year].amount += dividendAmount
            yearsDividends[year].count += 1
            yearsDividends[year].byStock[position.securityId].amount += dividendAmount
            yearsDividends[year].byStock[position.securityId].count += 1
          })
        }
      })

    return yearsDividends
  }

  const calculatedDividendsByYear = calculateDividendsByYearFromPositions()
  const sortedYears = Object.keys(calculatedDividendsByYear).sort((a, b) => b - a)

  // Форматирование даты
  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Форматирование типа дивиденда
  const formatDividendType = (type) => {
    const types = {
      common: 'Обыкн.',
      preferred: 'Прив.',
      quarterly: 'Кварт.',
      annual: 'Годов.'
    }
    return types[type] || type
  }

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-cash-coin"></i> История дивидендов
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {allDividends.length === 0 && sortedYears.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <i className="bi bi-inbox" style={{ fontSize: '3rem' }}></i>
            <p className="mt-3">История дивидендов пуста</p>
            <p className="small">
              Добавьте дивиденды вручную или дождитесь загрузки данных из API
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3 p-3" style={{ background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <strong>Всего получено:</strong>
                <span className="text-success fw-bold" style={{ fontSize: '1.25rem' }}>₽{totalDividends.toFixed(2)}</span>
              </div>
              {manualDividendsTotal > 0 && (
                <div className="text-white-50 small mb-2">
                  в т.ч. ручные: ₽{manualDividendsTotal.toFixed(2)}
                </div>
              )}
              {sortedYears.length > 0 && (
                <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <div className="text-white mb-2">По годам (из API):</div>
                  {sortedYears.map(year => (
                    <div key={year} className="text-white mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2 pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <span className="fw-bold">{year} г.</span>
                        <span className="text-success fw-bold">₽{calculatedDividendsByYear[year].amount.toFixed(2)}</span>
                      </div>
                      <div className="text-white-50 small mb-2">
                        {calculatedDividendsByYear[year].count} выплат(ы) всего
                      </div>
                      {/* Детализация по акциям */}
                      <div className="ms-3">
                        {Object.entries(calculatedDividendsByYear[year].byStock).map(([secid, stockData]) => (
                          <div key={secid} className="mb-2 p-2" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <div className="fw-bold">{stockData.name}</div>
                              </div>
                              <div className="text-end">
                                <div className="text-success fw-bold">₽{stockData.amount.toFixed(2)}</div>
                                <div className="small text-white-50">{stockData.count} выплат(ы)</div>
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

            {allDividends.length > 0 && (
              <>
                <h6 className="mb-3">
                  <i className="bi bi-list-ul"></i> Все дивиденды
                  <Badge bg="secondary" className="ms-2">{allDividends.length}</Badge>
                </h6>
                <Table responsive hover striped>
                  <thead>
                    <tr>
                      <th>Дата</th>
                      <th>Бумага</th>
                      <th>Количество</th>
                      <th>Сумма дивиденда</th>
                      <th>За 1 акцию</th>
                      <th>Период</th>
                      <th>Тип</th>
                      <th>Источник</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {allDividends.map(item => (
                      <tr key={item.id}>
                        <td>{formatDate(item.date)}</td>
                        <td>
                          <div className="fw-bold">{item.name}</div>
                        </td>
                        <td>{item.quantity}</td>
                        <td className="text-success fw-bold">
                          ₽{item.dividendAmount.toFixed(2)}
                        </td>
                        <td className="text-info">
                          ₽{item.amountPerShare?.toFixed(2)}
                        </td>
                        <td>{item.period || '—'}</td>
                        <td>
                          <Badge bg={item.type === 'preferred' ? 'purple' : 'info'}>
                            {formatDividendType(item.type)}
                          </Badge>
                        </td>
                        <td>
                          {item.source === 'api' ? (
                            <Badge bg="secondary">API</Badge>
                          ) : item.isInitialDividend ? (
                            <Badge bg="info">При добавлении</Badge>
                          ) : (
                            <Badge bg="success">Ручной</Badge>
                          )}
                        </td>
                        <td>
                          {item.source === 'api' ? (
                            // Для API дивидендов - информация
                            <span className="text-white-50 small">Из API</span>
                          ) : (
                            // Для ручных и "При добавлении" - кнопка удаления
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => {
                                if (confirm('Удалить этот дивиденд из истории?')) {
                                  onRemoveDividend(item.id)
                                }
                              }}
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </>
            )}
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

export default DividendHistoryModal
