import { useState, useEffect } from 'react'
import { Modal, Button, Form, Row, Col } from 'react-bootstrap'

/**
 * Модальное окно для ручного добавления купона по облигации
 */
function AddManualCouponModal({ show, onClose, onSave, position }) {
  const [couponDate, setCouponDate] = useState('')
  const [couponAmount, setCouponAmount] = useState('')
  const [notes, setNotes] = useState('')

  // Сброс формы при открытии
  useEffect(() => {
    if (show) {
      setCouponDate('')
      setCouponAmount('')
      setNotes('')
    }
  }, [show])

  if (!position) return null

  const handleSubmit = (e) => {
    e.preventDefault()

    const amount = parseFloat(couponAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Введите корректную сумму купона')
      return
    }

    if (!couponDate) {
      alert('Выберите дату купона')
      return
    }

    onSave({
      date: couponDate,
      amountPerBond: amount,
      totalAmount: amount * position.quantity,
      notes
    })

    onClose()
  }

  return (
    <Modal show={show} onHide={onClose} centered className="dark-theme">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-cash-coin"></i> Добавить купон
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {/* Информация о позиции */}
          <div className="mb-4 p-3" style={{ background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <div className="d-flex justify-content-between">
              <div>
                <div className="fw-bold">{position.ticker}</div>
                <div className="text-white-50 small">{position.name}</div>
              </div>
              <div className="text-end">
                <div className="text-white-50 small">Количество</div>
                <div className="fw-bold">{position.quantity} шт.</div>
              </div>
            </div>
          </div>

          {/* Дата купона */}
          <Form.Group className="mb-3">
            <Form.Label>
              <i className="bi bi-calendar"></i> Дата выплаты купона
            </Form.Label>
            <Form.Control
              type="date"
              value={couponDate}
              onChange={(e) => setCouponDate(e.target.value)}
              placeholder="Выберите дату"
              autoFocus
            />
          </Form.Group>

          {/* Сумма купона */}
          <Form.Group className="mb-3">
            <Form.Label>
              <i className="bi bi-currency-dollar"></i> Сумма купона на 1 облигацию (₽)
            </Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              min="0"
              value={couponAmount}
              onChange={(e) => setCouponAmount(e.target.value)}
              placeholder="Например: 15.50"
            />
            <Form.Text className="text-muted">
              Укажите сумму купона на одну облигацию
            </Form.Text>
          </Form.Group>

          {/* Итоговая сумма */}
          {couponAmount && (
            <div className="mb-3 p-3" style={{ background: 'var(--bg-card)', borderRadius: '8px' }}>
              <div className="d-flex justify-content-between">
                <span className="text-white-50">Общая сумма выплаты:</span>
                <span className="fw-bold text-success">
                  ₽{(parseFloat(couponAmount) * position.quantity).toFixed(2)}
                </span>
              </div>
              <div className="text-white-50 small mt-1">
                {couponAmount} ₽ × {position.quantity} шт.
              </div>
            </div>
          )}

          {/* Примечание */}
          <Form.Group className="mb-3">
            <Form.Label>
              <i className="bi bi-journal-text"></i> Примечание (необязательно)
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Например: Купон №5 за 2024 год"
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Отмена
        </Button>
        <Button variant="success" onClick={handleSubmit}>
          <i className="bi bi-check-lg"></i> Добавить купон
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default AddManualCouponModal
