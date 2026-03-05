import { Modal, Button, Form, Row, Col } from 'react-bootstrap'
import { useState, useEffect } from 'react'

/**
 * Модальное окно для редактирования выплаченного купона
 */
function EditCouponModal({ show, onClose, onSave, coupon }) {
  const [couponAmount, setCouponAmount] = useState('')
  const [couponDate, setCouponDate] = useState('')
  const [couponTime, setCouponTime] = useState('')
  const [notes, setNotes] = useState('')

  // Заполнение формы при открытии
  useEffect(() => {
    if (coupon) {
      setCouponAmount(coupon.couponAmount.toFixed(2))
      const dateObj = new Date(coupon.date)
      setCouponDate(dateObj.toISOString().split('T')[0])
      setCouponTime(dateObj.toTimeString().split(' ')[0].slice(0, 5))
      setNotes(coupon.notes || '')
    }
  }, [coupon])

  const handleSave = () => {
    if (!couponAmount || parseFloat(couponAmount) <= 0) {
      alert('Введите корректную сумму купона')
      return
    }

    if (!couponDate) {
      alert('Выберите дату получения купона')
      return
    }

    const dateTime = new Date(`${couponDate}T${couponTime || '00:00'}`)

    onSave({
      id: coupon.id,
      couponAmount: parseFloat(couponAmount),
      date: dateTime.toISOString(),
      notes
    })
  }

  return (
    <Modal show={show} onHide={onClose} centered className="dark-theme">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-pencil-square"></i> Редактирование купона
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {coupon && (
          <>
            <div className="mb-3 p-3" style={{ background: 'var(--bg-card)', borderRadius: '8px' }}>
              <div className="text-white-50 small">Бумага</div>
              <div className="text-white fw-bold">{coupon.name}</div>
            </div>

            <Form>
              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={4}>
                  Дата получения
                </Form.Label>
                <Col sm={8}>
                  <Form.Control
                    type="date"
                    value={couponDate}
                    onChange={(e) => setCouponDate(e.target.value)}
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={4}>
                  Время
                </Form.Label>
                <Col sm={8}>
                  <Form.Control
                    type="time"
                    value={couponTime}
                    onChange={(e) => setCouponTime(e.target.value)}
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={4}>
                  Сумма купона (₽)
                </Form.Label>
                <Col sm={8}>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={couponAmount}
                    onChange={(e) => setCouponAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={4}>
                  Примечание
                </Form.Label>
                <Col sm={8}>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Комментарий к купону (необязательно)"
                  />
                </Col>
              </Form.Group>
            </Form>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Отмена
        </Button>
        <Button variant="success" onClick={handleSave}>
          <i className="bi bi-check-lg"></i> Сохранить
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default EditCouponModal
