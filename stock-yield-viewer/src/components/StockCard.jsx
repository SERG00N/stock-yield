function StockCard({ stock }) {
  const isPositive = stock.change >= 0

  return (
    <div className="stock-card">
      <div className="stock-card-header">
        <div>
          <div className="stock-ticker">{stock.ticker}</div>
          <div className="stock-name">{stock.name}</div>
        </div>
        <span className={`stock-badge ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
        </span>
      </div>
      <div className="stock-price">₽{stock.price.toFixed(2)}</div>
      <div className={`stock-change ${isPositive ? 'positive' : 'negative'}`}>
        <i className={`bi bi-arrow-${isPositive ? 'up' : 'down'}-right`}></i>
        {isPositive ? '+' : ''}{stock.change.toFixed(2)} ₽ ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
      </div>
      <div className="stock-stats">
        <div className="stat-item">
          <div className="stat-label">Див. доходность</div>
          <div className="stat-value">{stock.yield > 0 ? `${stock.yield}%` : '—'}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Объём</div>
          <div className="stat-value">{stock.volume}</div>
        </div>
      </div>
    </div>
  )
}

export default StockCard
