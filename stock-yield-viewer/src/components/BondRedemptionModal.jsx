import { useState } from 'react'
import { Modal, Button, Form, Row, Col, Card } from 'react-bootstrap'

/**
 * Модальное окно для подтверждения погашения облигации
 */
function BondRedemptionModal({ show, onClose, onConfirm, position }) {
  const [notes, setNotes] = useState('')

  if (!position) return null

  // Расчёт суммы погашения
  const redemptionAmount = position.avgPrice * position.quantity
  const nominalValue = (position.faceValue || 1000) * position.quantity

  const handleConfirm = () => {
    onConfirm({
      positionId: position.id,
      redemptionAmount,
      nominalValue,
      notes,
      date: new Date().toISOString()
    })
    setNotes('')
    onClose()
  }

  const handleClose = () => {
    setNotes('')
    onClose()
  }

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-bank"></i> Погашение облигации
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Card className="mb-3" style={{ background: 'var(--bg-secondary)' }}>
          <Card.Body>
            <div className="mb-2">
              <div className="text-muted small">Облигация</div>
              <div className="fw-bold">{position.ticker}</div>
              <div className="small text-white-50">{position.name}</div>
            </div>
            <Row className="mb-2">
              <Col>
                <div className="text-muted small">Количество</div>
                <div className="fw-bold">{position.quantity} шт.</div>
              </Col>
              <Col>
                <div className="text-muted small">Средняя цена</div>
                <div className="fw-bold">{position.currency === 'RUB' ? '₽' : position.currency} {position.avgPrice.toFixed(2)}</div>
              </Col>
            </Row>
            <div className="pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
              <div className="d-flex justify-content-between">
                <div>
                  <div className="text-muted small">Вложено</div>
                  <div className="fw-bold">{position.currency === 'RUB' ? '₽' : position.currency} {redemptionAmount.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-muted small">Номинал</div>
                  <div className="fw-bold">{position.currency === 'RUB' ? '₽' : position.currency} {nominalValue.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-muted small">Прибыль/Убыток</div>
                  <div className={`fw-bold ${nominalValue - redemptionAmount >= 0 ? 'text-success' : 'text-danger'}`}>
                    {nominalValue - redemptionAmount >= 0 ? '+' : ''}{position.currency === 'RUB' ? '₽' : position.currency} {(nominalValue - redemptionAmount).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Form>
          <Form.Group>
            <Form.Label>Комментарий (необязательно)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Например: средства зачислены на брокерский счет"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'white' }}
            />
          </Form.Group>
        </Form>

        <div className="mt-3 p-3" style={{ background: 'rgba(255,193,7,0.1)', borderRadius: '8px', border: '1px solid rgba(255,193,7,0.3)' }}>
          <div className="d-flex align-items-start gap-2">
            <i className="bi bi-exclamation-triangle-fill text-warning" style={{ fontSize: '1.2rem' }}></i>
            <div className="small text-white-50">
              <strong>Внимание!</strong> После подтверждения позиция будет удалена из портфеля. 
              Убедитесь, что средства зачислены на счёт.
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Отмена
        </Button>
        <Button variant="success" onClick={handleConfirm}>
          <i className="bi bi-check-lg"></i> Подтвердить погашение
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default BondRedemptionModal
