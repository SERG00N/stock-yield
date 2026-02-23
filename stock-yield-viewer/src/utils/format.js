/**
 * Форматирование суммы с валютой
 * @param {number} amount - Сумма
 * @param {string} currency - Символ валюты (₽, $, €, etc.)
 * @param {number} decimals - Количество знаков после запятой
 * @returns {string} - Отформатированная строка (например: "1 000 ₽")
 */
export function formatMoney(amount, currency = '₽', decimals = 2) {
  const formatted = amount.toLocaleString('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
  return `${formatted} ${currency}`
}

/**
 * Форматирование суммы без символа валюты (только число с разделением тысяч)
 * @param {number} amount - Сумма
 * @param {number} decimals - Количество знаков после запятой
 * @returns {string} - Отформатированная строка (например: "1 000,00")
 */
export function formatNumber(amount, decimals = 2) {
  return amount.toLocaleString('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * Форматирование целого числа с разделением тысяч
 * @param {number} num - Число
 * @returns {string} - Отформатированная строка (например: "1 000")
 */
export function formatInt(num) {
  return num.toLocaleString('ru-RU')
}

/**
 * Форматирование процента с разделением тысяч
 * @param {number} percent - Процент
 * @param {number} decimals - Количество знаков после запятой
 * @returns {string} - Отформатированная строка (например: "12,34%")
 */
export function formatPercent(percent, decimals = 2) {
  return `${percent.toLocaleString('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}%`
}
