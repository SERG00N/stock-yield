/**
 * Компонент иконки ценной бумаги
 * Генерирует цветную иконку с первыми буквами тикера
 */

/**
 * Генерация цвета на основе тикера
 * @param {string} ticker - Тикер бумаги
 * @returns {string} - HEX цвет
 */
function getColorFromTicker(ticker) {
  const colors = [
    '#00b894', // зелёный
    '#0984e3', // синий
    '#6c5ce7', // фиолетовый
    '#e17055', // оранжевый
    '#d63031', // красный
    '#e84393', // розовый
    '#fdcb6e', // жёлтый
    '#00cec9', // бирюзовый
    '#74b9ff', // голубой
    '#a29bfe', // лаванда
    '#55efc4', // мятный
    '#fab1a0', // персиковый
  ]

  // Генерируем индекс на основе суммы кодов символов
  let hash = 0
  for (let i = 0; i < ticker.length; i++) {
    hash = hash + ticker.charCodeAt(i)
  }
  return colors[hash % colors.length]
}

/**
 * Получение инициалов из тикера
 * @param {string} ticker - Тикер
 * @returns {string} - Инициалы (1-2 буквы)
 */
function getInitials(ticker) {
  if (!ticker) return ''
  
  // Убираем цифры и оставляем буквы
  const letters = ticker.replace(/[^A-ZА-Я]/gi, '')
  
  if (letters.length === 0) {
    // Если нет букв, берём первые 2 символа
    return ticker.substring(0, 2).toUpperCase()
  }
  
  if (letters.length === 1) {
    return letters.toUpperCase()
  }
  
  // Берём первые 2 буквы
  return letters.substring(0, 2).toUpperCase()
}

/**
 * Компонент иконки ценной бумаги
 * @param {Object} props
 * @param {string} props.ticker - Тикер бумаги
 * @param {string} props.name - Название бумаги (опционально)
 * @param {number} props.size - Размер иконки в пикселях (по умолчанию 32)
 * @param {string} props.className - Дополнительный CSS класс
 * @param {boolean} props.showName - Показывать название рядом с иконкой
 */
function SecurityIcon({ 
  ticker = 'UNK', 
  name, 
  size = 32, 
  className = '',
  showName = false 
}) {
  const bgColor = getColorFromTicker(ticker)
  const initials = getInitials(ticker)
  
  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    borderRadius: '8px',
    backgroundColor: bgColor,
    color: '#fff',
    fontWeight: '700',
    fontSize: `${Math.max(10, size * 0.35)}px`,
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    textTransform: 'uppercase',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
  }

  return (
    <div 
      className={`security-icon ${className}`} 
      style={style}
      title={name || ticker}
    >
      {initials}
      {showName && name && (
        <span className="security-icon-name ms-2" style={{ 
          fontSize: `${Math.max(12, size * 0.4)}px`,
          fontWeight: '500'
        }}>
          {name}
        </span>
      )}
    </div>
  )
}

export default SecurityIcon
