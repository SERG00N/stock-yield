import { useState } from 'react'
import { Modal, Button, Form, InputGroup, Spinner, Table, Badge } from 'react-bootstrap'
import AddCouponPaymentModal from './AddCouponPaymentModal'

function AddToPortfolioModal({ show, onClose, onAdd, stocks, bonds, securityType, loading, bondsError }) {
  const [selectedSecurity, setSelectedSecurity] = useState('')
  const [quantity, setQuantity] = useState('')
  const [totalPurchaseAmount, setTotalPurchaseAmount] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [receivedCouponsCount, setReceivedCouponsCount] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [manualCoupons, setManualCoupons] = useState([])
  const [showAddCouponModal, setShowAddCouponModal] = useState(false)

  // Выбираем список бумаг в зависимости от типа
  const securities = securityType === 'bond' ? bonds : stocks

  // Расчёт количества выплаченных купонов на основе даты покупки
  const calculateReceivedCoupons = (purchaseDate, couponPeriod) => {
    if (!purchaseDate || !couponPeriod) return 0
    
    const purchase = new Date(purchaseDate)
    const today = new Date()
    const daysBetween = Math.floor((today - purchase) / (1000 * 60 * 60 * 24))
    
    if (daysBetween <= 0 || couponPeriod <= 0) return 0
    
    return Math.floor(daysBetween / couponPeriod)
  }
  
  // Расчёт цены за 1 бумагу из общей суммы
  const calculatePricePerBond = () => {
    const qty = parseFloat(quantity) || 0
    const total = parseFloat(totalPurchaseAmount) || 0
    if (qty > 0 && total > 0) {
      return total / qty
    }
    return 0
  }
  
  const filteredSecurities = securities.filter(sec => {
    const query = searchQuery.toLowerCase()
    return (
      sec.ticker.toLowerCase().includes(query) ||
      sec.name.toLowerCase().includes(query) ||
      (sec.shortname && sec.shortname.toLowerCase().includes(query))
    )
  })

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!selectedSecurity || !quantity || !totalPurchaseAmount) return

    const security = securities.find(s => s.id === selectedSecurity)
    if (!security) return

    const receivedCoupons = parseInt(receivedCouponsCount) || 0
    const total = parseFloat(totalPurchaseAmount)
    const qty = parseFloat(quantity)
    const avgPrice = total / qty
    
    // Расчёт общей суммы купонов: авто + ручные
    let totalCouponAmount = 0
    let totalReceivedCoupons = receivedCoupons

    if (securityType === 'bond') {
      // Рассчитываем разовый купон на основе периодичности
      let couponPerBond = security.couponValue || 0
      const couponPeriod = security.couponPeriod || 0
      
      // Проверяем, является ли couponValue годовой суммой
      // Если couponPeriod ~30 дней (ежемесячно), то couponValue может быть годовой суммой
      if (couponPeriod && couponPeriod > 0 && couponPeriod < 100) {
        // Это облигация с регулярными выплатами
        // Если couponValue > 100 и couponPeriod ~30, скорее всего это годовая сумма
        if (couponPerBond > 100 && couponPeriod <= 31) {
          // Предполагаем, что couponValue - годовая сумма, рассчитываем разовый купон
          couponPerBond = (couponPerBond * couponPeriod) / 365
        }
      }
      
      // Автокупоны
      totalCouponAmount += receivedCoupons * couponPerBond * qty
      // Ручные купоны
      manualCoupons.forEach(coupon => {
        totalCouponAmount += coupon.amountPerBond * qty
        totalReceivedCoupons += 1
      })
    }

    onAdd({
      securityId: security.id,
      ticker: security.ticker,
      name: security.name,
      type: securityType,
      quantity: qty,
      avgPrice: avgPrice,
      purchaseDate: (securityType === 'bond' || securityType === 'stock') ? purchaseDate : null,
      receivedCoupons: securityType === 'bond' ? totalReceivedCoupons : 0,
      totalCouponAmount: securityType === 'bond' ? totalCouponAmount : 0,
      totalPurchaseAmount: total,
      manualCoupons: securityType === 'bond' ? manualCoupons : []
    })

    // Сброс формы
    setSelectedSecurity('')
    setQuantity('')
    setTotalPurchaseAmount('')
    setPurchaseDate(new Date().toISOString().split('T')[0])
    setReceivedCouponsCount('')
    setManualCoupons([])
    setSearchQuery('')
    onClose()
  }

  // Вычисляем разовый купон с учетом периодичности
  const calculateCouponPerBond = () => {
    if (!selectedSec || securityType !== 'bond') return 0
    let couponPerBond = selectedSec.couponValue || 0
    const couponPeriod = selectedSec.couponPeriod || 0
    
    // Проверяем, является ли couponValue годовой суммой
    if (couponPeriod && couponPeriod > 0 && couponPeriod < 100) {
      if (couponPerBond > 100 && couponPeriod <= 31) {
        couponPerBond = (couponPerBond * couponPeriod) / 365
      }
    }
    return couponPerBond
  }

  const selectedSec = securities.find(s => s.id === selectedSecurity)

  // Автозаполнение количества купонов при изменении даты покупки
  const handlePurchaseDateChange = (e) => {
    const newDate = e.target.value
    setPurchaseDate(newDate)

    if (selectedSec && selectedSec.couponPeriod && newDate) {
      const count = calculateReceivedCoupons(newDate, selectedSec.couponPeriod)
      setReceivedCouponsCount(count > 0 ? count.toString() : '')
      
      // Автоматический пересчет суммы купонов
      if (securityType === 'bond' && count > 0 && quantity) {
        const couponPerBond = calculateCouponPerBond()
        const qty = parseFloat(quantity)
        const totalCouponAmount = count * couponPerBond * qty
        
        // Обновляем ручные купоны, если они есть
        let manualTotal = 0
        manualCoupons.forEach(coupon => {
          manualTotal += coupon.amountPerBond * qty
        })
        
        const grandTotal = totalCouponAmount + manualTotal
        console.log(`Пересчет купонов: ${count} купонов × ${couponPerBond.toFixed(2)} × ${qty} шт = ${totalCouponAmount.toFixed(2)} ₽`)
        console.log(`Ручные купоны: ${manualTotal.toFixed(2)} ₽`)
        console.log(`Общая сумма купонов: ${grandTotal.toFixed(2)} ₽`)
      }
    }
  }

  // Автозаполнение общей суммы при выборе бумаги
  const handleSecuritySelect = (e) => {
    const secId = e.target.value
    setSelectedSecurity(secId)

    if (secId && quantity) {
      const sec = securities.find(s => s.id === secId)
      if (sec) {
        // Устанавливаем общую сумму = цена × количество
        const totalAmount = sec.price * parseFloat(quantity)
        setTotalPurchaseAmount(totalAmount.toFixed(2))
      }
    }
  }

  // Добавление ручного купона
  const handleAddManualCoupon = (couponData) => {
    setManualCoupons(prev => [...prev, couponData])
    setShowAddCouponModal(false)
  }

  // Удаление ручного купона
  const handleRemoveManualCoupon = (index) => {
    setManualCoupons(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <Modal show={show} onHide={onClose} className="dark-modal" centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title style={{ color: 'white' }}>
          <i className={`bi bi-${securityType === 'bond' ? 'bank' : 'graph-up'}`}></i>
          {' '}Добавить {securityType === 'bond' ? 'облигацию' : 'акцию'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="danger" />
              <p className="mt-3 text-white">Загрузка списка {securityType === 'bond' ? 'облигаций' : 'акций'}...</p>
            </div>
          ) : bondsError && securityType === 'bond' ? (
            <div className="text-center py-4">
              <i className="bi bi-exclamation-triangle" style={{ fontSize: '2rem', color: '#ff6b6b' }}></i>
              <p className="mt-2 text-white">{bondsError}</p>
            </div>
          ) : securities.length === 0 ? (
            <div className="text-center py-4">
              <i className="bi bi-exclamation-circle" style={{ fontSize: '2rem', color: '#ffc107' }}></i>
              <p className="mt-2 text-white">Не удалось загрузить список бумаг</p>
            </div>
          ) : (
            <>
              <Form.Group className="mb-3">
                <Form.Label style={{ color: 'white' }}>Поиск {securityType === 'bond' ? 'облигации' : 'акции'}</Form.Label>
                <InputGroup>
                  <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder={securityType === 'bond' ? "Введите тикер или название облигации..." : "Введите тикер или название акции..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label style={{ color: 'white' }}>Бумага</Form.Label>
                <Form.Select
                  value={selectedSecurity}
                  onChange={handleSecuritySelect}
                >
                  <option value="">Выберите бумагу...</option>
                  {filteredSecurities.slice(0, 100).map(sec => (
                    <option key={sec.id} value={sec.id}>
                      {sec.ticker} — {sec.shortname || sec.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text style={{ color: 'white' }}>
                  Показано {Math.min(filteredSecurities.length, 100)} из {filteredSecurities.length}
                </Form.Text>
              </Form.Group>

              {selectedSec && (
                <div className="mb-3 p-3" style={{ background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <div className="d-flex justify-content-between text-white">
                    <span>Текущая цена:</span>
                    <strong>₽{selectedSec.price.toFixed(2)}</strong>
                  </div>
                  <div className="d-flex justify-content-between text-white">
                    <span>Тип:</span>
                    <span>{securityType === 'bond' ? 'Облигация' : 'Акция'}</span>
                  </div>
                  {securityType === 'bond' && selectedSec.yield > 0 && (
                    <div className="d-flex justify-content-between mt-2">
                      <span className="text-white">Доходность:</span>
                      <span className="text-success">{selectedSec.yield.toFixed(2)}%</span>
                    </div>
                  )}
                </div>
              )}

              <Form.Group className="mb-3">
                <Form.Label style={{ color: 'white' }}>Количество (шт)</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value)
                    // Если выбрана бумага, пересчитываем общую сумму
                    if (selectedSec && e.target.value) {
                      setTotalPurchaseAmount((selectedSec.price * parseFloat(e.target.value)).toFixed(2))
                    }
                  }}
                  min="1"
                  step="1"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label style={{ color: 'white' }}>
                  Общая сумма покупки (₽)
                </Form.Label>
                <Form.Control
                  type="number"
                  placeholder="0.00"
                  value={totalPurchaseAmount}
                  onChange={(e) => setTotalPurchaseAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
                {quantity && totalPurchaseAmount && (
                  <Form.Text style={{ color: 'white' }}>
                    Цена за 1 бумагу: ₽{calculatePricePerBond().toFixed(2)}
                  </Form.Text>
                )}
              </Form.Group>

              {(securityType === 'bond' || securityType === 'stock') && (
                <Form.Group className="mb-3">
                  <Form.Label style={{ color: 'white' }}>Дата покупки</Form.Label>
                  <Form.Control
                    type="date"
                    value={purchaseDate}
                    onChange={handlePurchaseDateChange}
                  />
                </Form.Group>
              )}

              {securityType === 'bond' && selectedSec && selectedSec.couponValue > 0 && purchaseDate && (
                <Form.Group className="mb-3">
                  <Form.Label style={{ color: 'white' }}>
                    Получено купонов (шт)
                    <span className="text-white ms-2" style={{ fontSize: '0.85rem' }}>
                      (по {selectedSec.couponValue.toFixed(2)} ₽ на шт)
                    </span>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="0"
                    value={receivedCouponsCount}
                    onChange={(e) => setReceivedCouponsCount(e.target.value)}
                    min="0"
                    step="1"
                  />
                  <Form.Text style={{ color: 'white' }}>
                    Укажите количество купонов, которые вы уже получили с момента покупки
                  </Form.Text>
                </Form.Group>
              )}

              {securityType === 'bond' && selectedSec && purchaseDate && (
                <Form.Group className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Form.Label style={{ color: 'white' }} className="mb-0">
                      Выплаченные купоны (для облигаций с плавающим купоном)
                    </Form.Label>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => setShowAddCouponModal(true)}
                    >
                      <i className="bi bi-plus-circle"></i> Добавить купон
                    </Button>
                  </div>
                  {manualCoupons.length > 0 ? (
                    <Table responsive striped size="sm" className="text-white">
                      <thead>
                        <tr>
                          <th>Дата</th>
                          <th>Сумма (на шт)</th>
                          <th>Общая сумма</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {manualCoupons.map((coupon, index) => (
                          <tr key={index}>
                            <td>{new Date(coupon.date).toLocaleDateString('ru-RU')}</td>
                            <td>₽{coupon.amountPerBond.toFixed(2)}</td>
                            <td>₽{(coupon.amountPerBond * (parseFloat(quantity) || 0)).toFixed(2)}</td>
                            <td>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleRemoveManualCoupon(index)}
                              >
                                <i className="bi bi-trash"></i>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <Form.Text style={{ color: 'var(--text-secondary)' }}>
                      Нет добавленных купонов. Добавьте купоны для облигаций с плавающим купоном.
                    </Form.Text>
                  )}
                </Form.Group>
              )}

              {quantity && totalPurchaseAmount && (
                <div className="p-3" style={{ background: 'var(--accent)', borderRadius: '8px', opacity: 0.9 }}>
                  <div className="d-flex justify-content-between text-white">
                    <span>Общая стоимость:</span>
                    <strong>₽{parseFloat(totalPurchaseAmount).toFixed(2)}</strong>
                  </div>
                  <div className="d-flex justify-content-between text-white mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                    <span>Цена за 1 бумагу:</span>
                    <span>₽{calculatePricePerBond().toFixed(2)}</span>
                  </div>
                  {securityType === 'bond' && receivedCouponsCount > 0 && (
                    <div className="d-flex justify-content-between text-white mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                      <span>Получено купонов ({receivedCouponsCount} шт × {calculateCouponPerBond().toFixed(2)} ₽ × {quantity} шт):</span>
                      <span className="text-success">+₽{(parseInt(receivedCouponsCount) * calculateCouponPerBond() * parseFloat(quantity)).toFixed(2)}</span>
                    </div>
                  )}
                  {securityType === 'bond' && manualCoupons.length > 0 && (
                    <div className="d-flex justify-content-between text-white mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                      <span>Ручные купоны:</span>
                      <span className="text-success">+₽{manualCoupons.reduce((sum, c) => sum + c.amountPerBond * parseFloat(quantity), 0).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-light" onClick={onClose}>Отмена</Button>
          <Button variant="danger" type="submit" disabled={!selectedSecurity || !quantity || !totalPurchaseAmount}>
            <i className="bi bi-plus-circle"></i> Добавить
          </Button>
        </Modal.Footer>
      </Form>

      {/* Модальное окно добавления купона */}
      <AddCouponPaymentModal
        show={showAddCouponModal}
        onClose={() => setShowAddCouponModal(false)}
        onSave={handleAddManualCoupon}
        quantity={parseFloat(quantity) || 0}
      />
    </Modal>
  )
}

export default AddToPortfolioModal
