import { useState, useEffect } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'

/**
 * Модальное окно для редактирования даты покупки облигации
 */
function EditPurchaseDateModal({ show, onClose, onSave, position }) {
  const [date, setDate] = useState('')

  // Установка текущей даты при открытии модального окна
  useEffect(() => {
    if (position?.purchaseDate) {
      setDate(position.purchaseDate.split('T')[0]) // Берём только дату без времени
    } else {
      setDate(new Date().toISOString().split('T')[0])
    }
  }, [position])

  const handleSave = () => {
    onSave(date)
  }

  const handleClear = () => {
    onSave(null) // Очищаем дату
  }

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-calendar-event"></i> Дата покупки
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {position && (
          <>
            <div className="mb-3">
              <strong>Бумага:</strong> {position.ticker}
            </div>
            <Form.Group>
              <Form.Label>Дата покупки:</Form.Label>
              <Form.Control
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Form.Group>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={handleClear}>
          <i className="bi bi-trash"></i> Очистить
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Отмена
        </Button>
        <Button variant="primary" onClick={handleSave}>
          <i className="bi bi-check-lg"></i> Сохранить
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default EditPurchaseDateModal
