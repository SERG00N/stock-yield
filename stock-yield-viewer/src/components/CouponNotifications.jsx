import { useEffect, useState } from 'react'
import { Alert } from 'react-bootstrap'

/**
 * Компонент уведомлений о приближении купонной даты
 * Показывает уведомления для купонов, которые наступят через ≤7 дней
 */
function CouponNotifications({ positions, couponDates, receivedCoupons }) {
  const [notifications, setNotifications] = useState([])
  const [dismissed, setDismissed] = useState(() => {
    const saved = localStorage.getItem('coupon-notifications-dismissed')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    const bondPositions = positions.filter(p => p.type === 'bond')

    const upcomingCoupons = bondPositions
      .filter(position => {
        // Пропускаем подтверждённые купоны
        if (receivedCoupons[position.securityId]) return false

        const daysToCoupon = couponDates[position.securityId]

        // Показываем уведомление, если до купона ≤7 дней и >= 0 дней
        return daysToCoupon !== undefined && daysToCoupon !== null && daysToCoupon >= 0 && daysToCoupon <= 7
      })
      .map(position => ({
        id: position.id,
        ticker: position.ticker,
        name: position.name,
        daysToCoupon: couponDates[position.securityId],
        totalCoupon: position.totalCoupon,
        quantity: position.quantity
      }))

    // Сортируем: сначала те, у которых меньше дней до купона
    upcomingCoupons.sort((a, b) => a.daysToCoupon - b.daysToCoupon)

    setNotifications(upcomingCoupons)
  }, [positions, couponDates, receivedCoupons])

  // Сохранение dismissed уведомлений в localStorage
  useEffect(() => {
    localStorage.setItem('coupon-notifications-dismissed', JSON.stringify(dismissed))
  }, [dismissed])

  const handleDismiss = (id) => {
    setDismissed(prev => [...prev, id])
  }

  const handleDismissAll = () => {
    setDismissed(notifications.map(n => n.id))
  }

  // Фильтруем уже скрытые уведомления
  const visibleNotifications = notifications.filter(n => !dismissed.includes(n.id))

  if (visibleNotifications.length === 0) {
    return null
  }

  return (
    <div className="mb-4">
      {visibleNotifications.map(notification => (
        <Alert
          key={notification.id}
          variant={notification.daysToCoupon === 0 ? 'danger' : notification.daysToCoupon <= 3 ? 'warning' : 'info'}
          onClose={() => handleDismiss(notification.id)}
          dismissible
          className="coupon-notification"
        >
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <Alert.Heading>
                <i className={`bi bi-${notification.daysToCoupon === 0 ? 'exclamation-triangle' : 'bell'}`}></i>
                {' '}Купон: {notification.ticker}
              </Alert.Heading>
              <p className="mb-1">
                {notification.daysToCoupon === 0 ? (
                  <strong className="text-danger">Сегодня!</strong>
                ) : notification.daysToCoupon === 1 ? (
                  <strong className="text-warning">Завтра</strong>
                ) : (
                  <>Через <strong>{notification.daysToCoupon} дн.</strong></>
                )}
              </p>
              <p className="mb-0 small">
                {notification.name} • {notification.quantity} шт. • ₽{notification.totalCoupon.toFixed(2)}
              </p>
            </div>
            {notification.daysToCoupon === 0 && (
              <a
                href="#"
                className="btn btn-sm btn-success"
                onClick={(e) => {
                  e.preventDefault()
                  // Прокрутка к таблице позиций
                  document.querySelector('.positions-table')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <i className="bi bi-check-lg"></i> Получить
              </a>
            )}
          </div>
        </Alert>
      ))}

      {visibleNotifications.length > 1 && (
        <div className="text-end">
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={handleDismissAll}
          >
            <i className="bi bi-check-all"></i> Скрыть все
          </button>
        </div>
      )}
    </div>
  )
}

export default CouponNotifications
