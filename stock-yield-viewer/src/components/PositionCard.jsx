import { Button } from 'react-bootstrap'
import SecurityIcon from './SecurityIcon'
import { formatNumber } from '../utils/format'

/**
 * Карточка позиции для мобильной версии
 */
function PositionCard({ 
  position, 
  onRemovePosition, 
  onEditPurchaseDate, 
  onEditPurchasePrice,
  onAddDividend,
  onAddCoupon,
  onConfirmCoupon,
  onBondRedemption,
  receivedCoupons = {},
  couponDates = {}
}) {
  const isBond = position.type === 'bond'
  const isZeroCoupon = isBond && position.daysToCoupon === 0 && !receivedCoupons[position.securityId]

  return (
    <div className="position-card">
      {/* Заголовок */}
      <div className="position-card-header">
        <SecurityIcon 
          ticker={position.ticker} 
          name={position.name} 
          type={position.type} 
          size={40} 
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
            {position.name}
          </div>
          <div>
            <span className={`badge ${isBond ? 'bg-info' : 'bg-primary'} me-2`}>
              {isBond ? 'Облигация' : 'Акция'}
            </span>
            <span className="badge bg-secondary">{position.currency}</span>
          </div>
        </div>
      </div>

      {/* Основная информация */}
      <div className="position-card-body">
        <div className="position-card-item">
          <span className="position-card-label">Кол-во</span>
          <span className="position-card-value">{position.quantity}</span>
        </div>
        
        <div className="position-card-item">
          <span className="position-card-label">Цена покупки</span>
          <span className="position-card-value">
            {position.currency === 'RUB' ? '₽ ' : position.currency + ' '}
            {formatNumber(position.avgPrice)}
          </span>
        </div>
        
        <div className="position-card-item">
          <span className="position-card-label">Вложено</span>
          <span className="position-card-value">
            {position.currency === 'RUB' ? '₽ ' : position.currency + ' '}
            {formatNumber(position.invested)}
          </span>
        </div>
        
        <div className="position-card-item">
          <span className="position-card-label">Рыночная стоимость</span>
          <span className="position-card-value">
            {position.currency === 'RUB' ? '₽ ' : position.currency + ' '}
            {formatNumber(position.marketValue)}
          </span>
        </div>
        
        <div className="position-card-item">
          <span className="position-card-label">Прибыль/Убыток</span>
          <span className={`position-card-value ${position.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
            {position.pnl >= 0 ? '+' : ''}{formatNumber(position.pnl)} ({position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%)
          </span>
        </div>

        {isBond && (
          <>
            <div className="position-card-item">
              <span className="position-card-label">До погашения</span>
              <span className="position-card-value">{position.daysToMaturity}</span>
            </div>
            
            <div className="position-card-item">
              <span className="position-card-label">Купон</span>
              <span className="position-card-value">₽{formatNumber(position.totalCoupon)}</span>
            </div>
            
            {position.daysToCoupon !== null && (
              <div className="position-card-item">
                <span className="position-card-label">До купона</span>
                <span className={`position-card-value ${position.daysToCoupon <= 7 ? 'text-danger' : ''}`}>
                  {position.daysToCoupon} дн.
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Кнопки действий */}
      <div className="position-card-actions">
        {isBond && isZeroCoupon && (
          <Button 
            variant="success" 
            size="sm"
            onClick={() => onConfirmCoupon(position.id, position)}
          >
            <i className="bi bi-check-lg"></i> Получить купон
          </Button>
        )}
        
        {isBond && (
          <Button 
            variant="outline-light" 
            size="sm"
            onClick={() => onAddCoupon(position)}
          >
            <i className="bi bi-plus"></i> Купон
          </Button>
        )}
        
        {!isBond && (
          <Button 
            variant="outline-light" 
            size="sm"
            onClick={() => onAddDividend(position)}
          >
            <i className="bi bi-plus"></i> Дивиденд
          </Button>
        )}
        
        <Button 
          variant="outline-light" 
          size="sm"
          onClick={() => onEditPurchasePrice(position)}
        >
          <i className="bi bi-pencil"></i>
        </Button>
        
        <Button 
          variant="outline-light" 
          size="sm"
          onClick={() => onEditPurchaseDate(position)}
        >
          <i className="bi bi-calendar"></i>
        </Button>
        
        <Button 
          variant="outline-danger" 
          size="sm"
          onClick={() => onRemovePosition(position.id)}
        >
          <i className="bi bi-trash"></i>
        </Button>
      </div>
    </div>
  )
}

export default PositionCard
