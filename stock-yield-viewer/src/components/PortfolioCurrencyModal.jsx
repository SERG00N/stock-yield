import { useState, useEffect } from 'react'
import { Modal, Button, Row, Col, Card } from 'react-bootstrap'

/**
 * Модальное окно выбора базовой валюты портфеля
 * Позволяет выбрать валюту, в которой отображаются все суммы
 */
function PortfolioCurrencyModal({ show, onClose, currentCurrency, onSave, currencyRates }) {
  const [selectedCurrency, setSelectedCurrency] = useState(currentCurrency || 'RUB')

  useEffect(() => {
    setSelectedCurrency(currentCurrency || 'RUB')
  }, [currentCurrency])

  const handleSave = () => {
    onSave(selectedCurrency)
    onClose()
  }

  const currencies = [
    { code: 'RUB', name: 'Российский рубль', symbol: '₽' },
    { code: 'USD', name: 'Доллар США', symbol: '$' },
    { code: 'EUR', name: 'Евро', symbol: '€' },
    { code: 'CNY', name: 'Китайский юань', symbol: '¥' },
    { code: 'GBP', name: 'Британский фунт', symbol: '£' }
  ]

  // Конвертация 1 единицы каждой валюты в выбранную
  const convertToSelected = (currencyCode) => {
    if (!currencyRates) return null

    const fromRate = currencyRates[currencyCode] || 1
    const toRate = currencyRates[selectedCurrency] || 1

    // Конвертируем 1 единицу из currencyCode в selectedCurrency
    return fromRate / toRate
  }

  return (
    <Modal show={show} onHide={onClose} centered className="dark-theme">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-currency-exchange"></i> Валюта портфеля
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted mb-4">
          Выберите базовую валюту, в которой будут отображаться все суммы в портфеле
        </p>

        <Row className="g-3">
          {currencies.map(currency => {
            const rate = convertToSelected(currency.code)
            const isSelected = selectedCurrency === currency.code

            return (
              <Col key={currency.code} xs={12}>
                <Card
                  className={`currency-card cursor-pointer ${isSelected ? 'border-success' : ''}`}
                  onClick={() => setSelectedCurrency(currency.code)}
                  style={{
                    background: isSelected ? 'var(--bg-card)' : 'var(--bg-secondary)',
                    border: isSelected ? '2px solid var(--accent)' : '1px solid var(--bg-card)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Card.Body className="py-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <div
                          className="currency-symbol me-3"
                          style={{
                            fontSize: '2rem',
                            width: '50px',
                            textAlign: 'center'
                          }}
                        >
                          {currency.symbol}
                        </div>
                        <div>
                          <div className="fw-bold">{currency.code}</div>
                          <div className="text-white-50 small">{currency.name}</div>
                        </div>
                      </div>
                      {isSelected && (
                        <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '1.5rem' }}></i>
                      )}
                    </div>
                    {rate && currency.code !== selectedCurrency && (
                      <div className="text-white-50 small mt-2">
                        1 {currency.code} = {rate.toFixed(4)} {selectedCurrency}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            )
          })}
        </Row>

        {currencyRates?.lastUpdate && (
          <div className="text-white-50 small mt-4 text-center">
            <i className="bi bi-clock"></i> Курсы ЦБ РФ на {new Date(currencyRates.lastUpdate).toLocaleDateString('ru-RU')}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Отмена
        </Button>
        <Button variant="success" onClick={handleSave}>
          <i className="bi bi-check-lg"></i> Сохранить
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default PortfolioCurrencyModal
