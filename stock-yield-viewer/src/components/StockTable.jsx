function StockTable({ stocks }) {
  return (
    <div className="stock-table-container">
      <h3><i className="bi bi-table"></i> Все акции</h3>
      <table className="stock-table">
        <thead>
          <tr>
            <th>Тикер</th>
            <th>Цена</th>
            <th>Изменение</th>
            <th>Доходность</th>
            <th>Объём</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map(stock => {
            const isPositive = stock.change >= 0
            return (
              <tr key={stock.id}>
                <td>
                  <div className="table-ticker">{stock.ticker}</div>
                  <div className="table-name">{stock.name}</div>
                </td>
                <td className="table-price">₽{stock.price.toFixed(2)}</td>
                <td className={`table-change ${isPositive ? 'positive' : 'negative'}`}>
                  {isPositive ? '+' : ''}{stock.change.toFixed(2)} ₽ ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                </td>
                <td className="table-yield">
                  {stock.yield > 0 ? `${stock.yield}%` : '—'}
                </td>
                <td>{stock.volume}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default StockTable
