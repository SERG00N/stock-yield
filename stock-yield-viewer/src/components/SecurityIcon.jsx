/**
 * Компонент иконки ценной бумаги
 * Генерирует цветную иконку с первыми буквами тикера или названия
 */

/**
 * Генерация цвета на основе строки
 * @param {string} str - Строка для генерации цвета
 * @returns {string} - HEX цвет
 */
function getColorFromString(str) {
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
  for (let i = 0; i < str.length; i++) {
    hash = hash + str.charCodeAt(i)
  }
  return colors[hash % colors.length]
}

/**
 * Получение инициалов из строки
 * @param {string} str - Строка (тикер или название)
 * @param {boolean} isTicker - Это тикер или название
 * @returns {string} - Инициалы (1-2 буквы)
 */
function getInitials(str, isTicker = true) {
  if (!str) return ''
  
  if (isTicker) {
    // Для тикеров: убираем цифры и оставляем буквы
    const letters = str.replace(/[^A-ZА-Я]/gi, '')
    
    if (letters.length === 0) {
      // Если нет букв, берём первые 2 символа
      return str.substring(0, 2).toUpperCase()
    }
    
    if (letters.length === 1) {
      return letters.toUpperCase()
    }
    
    // Берём первые 2 буквы
    return letters.substring(0, 2).toUpperCase()
  } else {
    // Для названий: берём первые буквы первых двух слов
    const words = str.trim().split(/\s+/).filter(w => w.length > 0)
    
    if (words.length === 0) return ''
    
    if (words.length === 1) {
      // Одно слово: берём первые 2 буквы
      const firstWord = words[0].replace(/[^A-ZА-ЯA-Z]/gi, '')
      return firstWord.substring(0, 2).toUpperCase()
    }
    
    // Два и более слов: берём первые буквы первых двух слов
    const firstLetter1 = words[0].charAt(0).toUpperCase()
    const firstLetter2 = words[1].charAt(0).toUpperCase()
    
    // Проверяем, что это буквы
    const isLetter1 = /[A-ZА-Я]/i.test(firstLetter1)
    const isLetter2 = /[A-ZА-Я]/i.test(firstLetter2)
    
    if (isLetter1 && isLetter2) {
      return firstLetter1 + firstLetter2
    } else if (isLetter1) {
      return firstLetter1
    } else if (isLetter2) {
      return firstLetter2
    } else {
      // Если нет букв, берём первые 2 символа из первого слова
      return words[0].substring(0, 2).toUpperCase()
    }
  }
}

/**
 * Компонент иконки ценной бумаги
 * @param {Object} props
 * @param {string} props.ticker - Тикер бумаги
 * @param {string} props.name - Название бумаги (опционально)
 * @param {string} props.type - Тип бумаги: 'stock' | 'bond'
 * @param {number} props.size - Размер иконки в пикселях (по умолчанию 32)
 * @param {string} props.className - Дополнительный CSS класс
 * @param {boolean} props.showName - Показывать название рядом с иконкой
 */
function SecurityIcon({ 
  ticker = 'UNK', 
  name, 
  type = 'stock',
  size = 32, 
  className = '',
  showName = false 
}) {
  // Для облигаций используем название, для акций - тикер
  const useName = type === 'bond' && name
  const displayStr = useName ? name : ticker
  const isTicker = !useName
  
  const bgColor = getColorFromString(displayStr)
  const initials = getInitials(displayStr, isTicker)
  
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
