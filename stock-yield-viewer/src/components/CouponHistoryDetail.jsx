import { Card, Table, Badge } from 'react-bootstrap'
import { formatDate } from '../api/moex'

/**
 * Детальная история купонов для облигации
 */
function CouponHistoryDetail({ couponHistory }) {
  if (!couponHistory || couponHistory.length === 0) {
    return (
      <Card className="bg-dark text-white">
        <Card.Body>
          <Card.Title>История купонов</Card.Title>
          <p className="text-muted text-center py-5">Нет данных о купонах</p>
        </Card.Body>
      </Card>
    )
  }

  // Группировка по годам
  const couponsByYear = couponHistory.reduce((acc, coupon) => {
    const year = new Date(coupon.date).getFullYear()
    if (!acc[year]) {
      acc[year] = []
    }
    acc[year].push(coupon)
    return acc
  }, {})

  // Общая сумма всех купонов
  const totalCoupons = couponHistory.reduce((sum, c) => sum + (c.value || 0), 0)

  return (
    <Card className="bg-dark text-white">
      <Card.Body>
        <Card.Title className="mb-4">
          <i className="bi bi-cash-coin"></i> История купонов
          <Badge bg="success" className="ms-2">
            Всего: ₽{totalCoupons.toFixed(2)}
          </Badge>
        </Card.Title>

        {Object.entries(couponsByYear)
          .sort((a, b) => b[0] - a[0]) // Сортировка по годам (убывание)
          .map(([year, coupons]) => (
            <div key={year} className="mb-4">
              <h5 className="text-success mb-3">
                <i className="bi bi-calendar"></i> {year}
                <Badge bg="secondary" className="ms-2">
                  {coupons.length} куп.
                </Badge>
                <Badge bg="outline-secondary" className="ms-2">
                  ₽{coupons.reduce((sum, c) => sum + (c.value || 0), 0).toFixed(2)}
                </Badge>
              </h5>

              <Table responsive hover size="sm" className="text-white">
                <thead>
                  <tr className="text-white-50">
                    <th>Дата</th>
                    <th className="text-end">Сумма купона</th>
                    <th className="text-end">НКД</th>
                    <th className="text-end">Источник</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon, idx) => (
                    <tr key={idx}>
                      <td>{formatDate(coupon.date)}</td>
                      <td className="text-end text-success">
                        ₽{(coupon.value || 0).toFixed(2)}
                      </td>
                      <td className="text-end text-info">
                        ₽{(coupon.accrued || 0).toFixed(2)}
                      </td>
                      <td className="text-end">
                        <Badge bg={coupon.source === 'moex' ? 'info' : 'warning'}>
                          {coupon.source === 'moex' ? 'MOEX' : 'Smart-Lab'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ))}
      </Card.Body>
    </Card>
  )
}

export default CouponHistoryDetail
