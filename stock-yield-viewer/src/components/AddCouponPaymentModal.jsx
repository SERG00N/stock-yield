import { useState, useEffect } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'

/**
 * Модальное окно для добавления выплаченного купона по облигации
 */
function AddCouponPaymentModal({ show, onClose, onSave, quantity, couponPeriod }) {
  const [couponAmount, setCouponAmount] = useState('')
  const [couponDate, setCouponDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (show) {
      setCouponAmount('')
      setCouponDate(new Date().toISOString().split('T')[0])
    }
  }, [show])

  const handleSave = () => {
    const amount = parseFloat(couponAmount)
    if (!isNaN(amount) && amount > 0 && couponDate) {
      onSave({
        amountPerBond: amount,
        date: couponDate
      })
    }
  }

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-cash-coin"></i> Добавить выплаченный купон
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>Сумма купона на 1 облигацию (₽):</Form.Label>
          <Form.Control
            type="number"
            step="0.01"
            min="0"
            value={couponAmount}
            onChange={(e) => setCouponAmount(e.target.value)}
            placeholder="0.00"
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Дата выплаты:</Form.Label>
          <Form.Control
            type="date"
            value={couponDate}
            onChange={(e) => setCouponDate(e.target.value)}
          />
        </Form.Group>
        {couponAmount && quantity && (
          <div className="p-3" style={{ background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <div className="d-flex justify-content-between text-white">
              <span>Общая сумма купона:</span>
              <strong className="text-success">₽{(parseFloat(couponAmount) * quantity).toFixed(2)}</strong>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Отмена
        </Button>
        <Button variant="success" onClick={handleSave} disabled={!couponAmount || parseFloat(couponAmount) <= 0}>
          <i className="bi bi-check-lg"></i> Добавить
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default AddCouponPaymentModal
