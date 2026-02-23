import { Modal, Table, Badge, Card, Row, Col, Button } from 'react-bootstrap'
import { formatDate } from '../api/moex'

/**
 * Модальное окно для отображения погашенных облигаций
 */
function RedeemedBondsModal({ show, onClose, redeemedBonds }) {
  // Группировка по годам
  const bondsByYear = redeemedBonds.reduce((acc, bond) => {
    const year = bond.redeemedYear || new Date(bond.redeemedDate).getFullYear()
    if (!acc[year]) {
      acc[year] = []
    }
    acc[year].push(bond)
    return acc
  }, {})

  const sortedYears = Object.keys(bondsByYear).sort((a, b) => b - a)

  // Подсчёт статистики
  const totalRedeemed = redeemedBonds.length
  const totalInvested = redeemedBonds.reduce((sum, b) => sum + b.redemptionAmount, 0)
  const totalNominal = redeemedBonds.reduce((sum, b) => sum + b.nominalValue, 0)
  const totalProfit = totalNominal - totalInvested

  return (
    <Modal show={show} onHide={onClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-archive"></i> Погашенные облигации
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {redeemedBonds.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-inbox" style={{ fontSize: '3rem' }}></i>
            <p className="mt-3">Нет погашенных облигаций</p>
          </div>
        ) : (
          <>
            {/* Общая статистика */}
            <Card className="mb-4" style={{ background: 'var(--bg-secondary)' }}>
              <Card.Body>
                <Row className="text-center">
                  <Col md={3}>
                    <div className="h4 mb-0">{totalRedeemed}</div>
                    <div className="text-muted small">Погашено облигаций</div>
                  </Col>
                  <Col md={3}>
                    <div className="h4 mb-0 text-info">₽{totalInvested.toFixed(2)}</div>
                    <div className="text-muted small">Вложено</div>
                  </Col>
                  <Col md={3}>
                    <div className="h4 mb-0 text-success">₽{totalNominal.toFixed(2)}</div>
                    <div className="text-muted small">Получено</div>
                  </Col>
                  <Col md={3}>
                    <div className={`h4 mb-0 ${totalProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                      {totalProfit >= 0 ? '+' : ''}₽{totalProfit.toFixed(2)}
                    </div>
                    <div className="text-muted small">Прибыль</div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Группировка по годам */}
            {sortedYears.map(year => {
              const yearBonds = bondsByYear[year]
              const yearInvested = yearBonds.reduce((sum, b) => sum + b.redemptionAmount, 0)
              const yearNominal = yearBonds.reduce((sum, b) => sum + b.nominalValue, 0)
              const yearProfit = yearNominal - yearInvested

              return (
                <Card key={year} className="mb-3" style={{ background: 'var(--bg-card)' }}>
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold">
                      <i className="bi bi-calendar3"></i> {year} год
                    </span>
                    <Badge bg={yearProfit >= 0 ? 'success' : 'danger'}>
                      {yearProfit >= 0 ? '+' : ''}₽{yearProfit.toFixed(2)}
                    </Badge>
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-2 text-white-50 small">
                      {yearBonds.length} облигаций |
                      Вложено: ₽{yearInvested.toFixed(2)} |
                      Получено: ₽{yearNominal.toFixed(2)}
                    </div>
                    <Table responsive hover striped size="sm">
                      <thead>
                        <tr>
                          <th>Бумага</th>
                          <th>Количество</th>
                          <th>Вложено</th>
                          <th>Получено</th>
                          <th>Прибыль</th>
                          <th>Дата погашения</th>
                        </tr>
                      </thead>
                      <tbody>
                        {yearBonds.map(bond => (
                          <tr key={bond.id}>
                            <td>
                              <div className="fw-bold text-info">{bond.ticker}</div>
                              <div className="small text-white-50">{bond.name}</div>
                            </td>
                            <td>{bond.quantity}</td>
                            <td>₽{bond.redemptionAmount.toFixed(2)}</td>
                            <td className="text-success">₽{bond.nominalValue.toFixed(2)}</td>
                            <td className={bond.redemptionProfit >= 0 ? 'text-success' : 'text-danger'}>
                              {bond.redemptionProfit >= 0 ? '+' : ''}₽{bond.redemptionProfit.toFixed(2)}
                            </td>
                            <td>{formatDate(bond.redeemedDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              )
            })}
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

export default RedeemedBondsModal
