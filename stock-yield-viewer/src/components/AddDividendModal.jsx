import { useState, useEffect } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'

/**
 * Модальное окно для добавления полученного дивиденда
 */
function AddDividendModal({ show, onClose, onSave, position }) {
  const [dividendPerShare, setDividendPerShare] = useState('')
  const [dividendDate, setDividendDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (show) {
      setDividendPerShare('')
      setDividendDate(new Date().toISOString().split('T')[0])
    }
  }, [show])

  const handleSave = () => {
    const perShare = parseFloat(dividendPerShare)
    if (!isNaN(perShare) && perShare > 0 && position) {
      const totalAmount = perShare * position.quantity
      onSave({
        dividendPerShare: perShare,
        totalAmount: totalAmount,
        date: dividendDate
      })
    }
  }

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-cash-coin"></i> Добавить дивиденд
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
            <Form.Group className="mb-3">
              <Form.Label>Дивиденд на 1 акцию (₽):</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0"
                value={dividendPerShare}
                onChange={(e) => setDividendPerShare(e.target.value)}
                placeholder="0.00"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Дата выплаты:</Form.Label>
              <Form.Control
                type="date"
                value={dividendDate}
                onChange={(e) => setDividendDate(e.target.value)}
              />
            </Form.Group>
            {dividendPerShare && (
              <div className="p-3" style={{ background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <div className="d-flex justify-content-between text-white">
                  <span>Общая сумма:</span>
                  <strong className="text-success">₽{(parseFloat(dividendPerShare) * position.quantity).toFixed(2)}</strong>
                </div>
              </div>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Отмена
        </Button>
        <Button variant="success" onClick={handleSave} disabled={!dividendPerShare || parseFloat(dividendPerShare) <= 0}>
          <i className="bi bi-check-lg"></i> Добавить
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default AddDividendModal
