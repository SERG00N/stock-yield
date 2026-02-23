import { Card, Table, Badge } from 'react-bootstrap'
import { formatDate } from '../api/moex'

/**
 * Детальная история дивидендов для акции
 */
function DividendHistoryDetail({ dividendHistory }) {
  if (!dividendHistory || dividendHistory.length === 0) {
    return (
      <Card className="bg-dark text-white">
        <Card.Body>
          <Card.Title>История дивидендов</Card.Title>
          <p className="text-muted text-center py-5">Нет данных о дивидендах</p>
        </Card.Body>
      </Card>
    )
  }

  // Группировка по годам
  const dividendsByYear = dividendHistory.reduce((acc, dividend) => {
    const year = new Date(dividend.date).getFullYear()
    if (!acc[year]) {
      acc[year] = []
    }
    acc[year].push(dividend)
    return acc
  }, {})

  // Общая сумма всех дивидендов
  const totalDividends = dividendHistory.reduce((sum, d) => sum + (d.amount || 0), 0)

  return (
    <Card className="bg-dark text-white">
      <Card.Body>
        <Card.Title className="mb-4">
          <i className="bi bi-cash-stack"></i> История дивидендов
          <Badge bg="success" className="ms-2">
            Всего: ₽{totalDividends.toFixed(2)}
          </Badge>
        </Card.Title>

        {Object.entries(dividendsByYear)
          .sort((a, b) => b[0] - a[0]) // Сортировка по годам (убывание)
          .map(([year, dividends]) => (
            <div key={year} className="mb-4">
              <h5 className="text-success mb-3">
                <i className="bi bi-calendar"></i> {year}
                <Badge bg="secondary" className="ms-2">
                  {dividends.length} вып.
                </Badge>
                <Badge bg="outline-secondary" className="ms-2">
                  ₽{dividends.reduce((sum, d) => sum + (d.amount || 0), 0).toFixed(2)}
                </Badge>
              </h5>

              <Table responsive hover size="sm" className="text-white">
                <thead>
                  <tr className="text-white-50">
                    <th>Дата</th>
                    <th className="text-end">Сумма дивиденда</th>
                    <th className="text-end">Период</th>
                    <th className="text-end">Источник</th>
                  </tr>
                </thead>
                <tbody>
                  {dividends.map((dividend, idx) => (
                    <tr key={idx}>
                      <td>{formatDate(dividend.date)}</td>
                      <td className="text-end text-success">
                        ₽{(dividend.amount || 0).toFixed(2)}
                      </td>
                      <td className="text-end text-info">
                        {dividend.period || '—'}
                      </td>
                      <td className="text-end">
                        <Badge bg={dividend.source === 'moex' ? 'info' : 'warning'}>
                          {dividend.source === 'moex' ? 'MOEX' : dividend.source}
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

export default DividendHistoryDetail
