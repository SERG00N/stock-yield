import { useState, useEffect } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'

/**
 * Модальное окно для редактирования цены покупки бумаги
 */
function EditPurchasePriceModal({ show, onClose, onSave, position }) {
  const [price, setPrice] = useState('')

  // Установка текущей цены при открытии модального окна
  useEffect(() => {
    if (position?.avgPrice) {
      setPrice(position.avgPrice.toFixed(2))
    } else {
      setPrice('0.00')
    }
  }, [position])

  const handleSave = () => {
    const numPrice = parseFloat(price)
    if (!isNaN(numPrice) && numPrice >= 0) {
      onSave(numPrice)
    }
  }

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-cash-coin"></i> Цена покупки
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {position && (
          <>
            <div className="mb-3">
              <strong>Бумага:</strong> {position.ticker}
            </div>
            <div className="mb-3">
              <strong>Количество:</strong> {position.quantity} шт.
            </div>
            <Form.Group>
              <Form.Label>Цена покупки (₽):</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </Form.Group>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
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

export default EditPurchasePriceModal
