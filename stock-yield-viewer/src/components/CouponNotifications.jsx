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
    <div className="mb-3">
      {visibleNotifications.map(notification => (
        <Alert
          key={notification.id}
          variant={notification.daysToCoupon === 0 ? 'danger' : notification.daysToCoupon <= 3 ? 'warning' : 'info'}
          onClose={() => handleDismiss(notification.id)}
          dismissible
          className="coupon-notification"
        >
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3">
              <i className={`bi bi-${notification.daysToCoupon === 0 ? 'exclamation-triangle' : 'bell'} fs-5`}></i>
              <div>
                <span className="fw-semibold">{notification.name}</span>
                <span className="mx-2 text-muted">•</span>
                <span className="text-nowrap">
                  {notification.daysToCoupon === 0 ? (
                    <strong className="text-danger">Сегодня</strong>
                  ) : notification.daysToCoupon === 1 ? (
                    <strong className="text-warning">Завтра</strong>
                  ) : (
                    <>Через <strong>{notification.daysToCoupon} дн.</strong></>
                  )}
                </span>
                <span className="mx-2 text-muted">•</span>
                <span className="text-nowrap">{notification.quantity} шт.</span>
                <span className="mx-2 text-muted">•</span>
                <span className="text-nowrap">₽{notification.totalCoupon.toFixed(2)}</span>
              </div>
            </div>
            {notification.daysToCoupon === 0 && (
              <button
                className="btn btn-sm btn-success py-0 px-2"
                style={{ fontSize: '0.75rem' }}
                onClick={(e) => {
                  e.preventDefault()
                  document.querySelector('.positions-table')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <i className="bi bi-check-lg"></i> Получить
              </button>
            )}
          </div>
        </Alert>
      ))}

      {visibleNotifications.length > 1 && (
        <div className="text-end mt-1">
          <button
            className="btn btn-sm btn-outline-secondary py-0 px-2"
            style={{ fontSize: '0.75rem' }}
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
