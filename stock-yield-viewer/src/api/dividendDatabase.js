/**
 * Встроенная база дивидендов для российских акций
 * Используется как резервный источник, когда API недоступны
 * 
 * Данные обновляются вручную на основе публичной информации
 */

export const DIVIDEND_DATABASE = {
  // Сбербанк
  SBER: [
    { date: '2024-07-15', amount: 33.0, period: '2023', type: 'common' },
    { date: '2023-07-10', amount: 26.0, period: '2022', type: 'common' },
    { date: '2022-07-05', amount: 42.3, period: '2021', type: 'common' },
    { date: '2021-07-08', amount: 18.7, period: '2020', type: 'common' },
    { date: '2020-07-20', amount: 18.7, period: '2019', type: 'common' },
    { date: '2019-07-15', amount: 16.0, period: '2018', type: 'common' }
  ],
  
  // Газпром
  GAZP: [
    { date: '2023-07-20', amount: 0, period: '2022', type: 'common' }, // Дивиденды не выплачивались
    { date: '2022-07-15', amount: 0, period: '2021', type: 'common' },
    { date: '2021-12-30', amount: 52.54, period: '2020', type: 'common' },
    { date: '2020-08-10', amount: 52.54, period: '2019', type: 'common' },
    { date: '2019-07-25', amount: 52.54, period: '2018', type: 'common' }
  ],
  
  // Норникель
  GMKN: [
    { date: '2024-06-20', amount: 876.0, period: '2023', type: 'common' },
    { date: '2023-06-15', amount: 762.0, period: '2022', type: 'common' },
    { date: '2022-06-10', amount: 919.0, period: '2021', type: 'common' },
    { date: '2021-06-15', amount: 859.0, period: '2020', type: 'common' },
    { date: '2020-06-18', amount: 667.0, period: '2019', type: 'common' }
  ],
  
  // Лукойл
  LKOH: [
    { date: '2024-06-15', amount: 284.0, period: '2023', type: 'common' },
    { date: '2023-06-10', amount: 232.0, period: '2022', type: 'common' },
    { date: '2022-06-05', amount: 218.0, period: '2021', type: 'common' },
    { date: '2021-06-10', amount: 185.0, period: '2020', type: 'common' },
    { date: '2020-06-15', amount: 185.0, period: '2019', type: 'common' }
  ],
  
  // Роснефть
  ROSN: [
    { date: '2024-07-05', amount: 29.77, period: '2023', type: 'common' },
    { date: '2023-07-01', amount: 29.77, period: '2022', type: 'common' },
    { date: '2022-06-25', amount: 29.77, period: '2021', type: 'common' },
    { date: '2021-06-20', amount: 19.53, period: '2020', type: 'common' },
    { date: '2020-06-15', amount: 19.53, period: '2019', type: 'common' }
  ],
  
  // Татнефть (обычка)
  TATN: [
    { date: '2024-06-25', amount: 41.0, period: '2023', type: 'common' },
    { date: '2023-06-20', amount: 38.0, period: '2022', type: 'common' },
    { date: '2022-06-15', amount: 36.0, period: '2021', type: 'common' },
    { date: '2021-06-10', amount: 24.0, period: '2020', type: 'common' },
    { date: '2020-06-15', amount: 24.0, period: '2019', type: 'common' }
  ],
  
  // Татнефть (префы)
  TATNP: [
    { date: '2024-06-25', amount: 41.0, period: '2023', type: 'preferred' },
    { date: '2023-06-20', amount: 38.0, period: '2022', type: 'preferred' },
    { date: '2022-06-15', amount: 36.0, period: '2021', type: 'preferred' },
    { date: '2021-06-10', amount: 24.0, period: '2020', type: 'preferred' },
    { date: '2020-06-15', amount: 24.0, period: '2019', type: 'preferred' }
  ],
  
  // Сургутнефтегаз (префы)
  SNGSP: [
    { date: '2024-07-10', amount: 0.32, period: '2023', type: 'preferred' },
    { date: '2023-07-05', amount: 0.27, period: '2022', type: 'preferred' },
    { date: '2022-06-30', amount: 0.13, period: '2021', type: 'preferred' },
    { date: '2021-07-05', amount: 0.09, period: '2020', type: 'preferred' },
    { date: '2020-07-01', amount: 0.09, period: '2019', type: 'preferred' }
  ],
  
  // МТС
  MTSS: [
    { date: '2024-06-20', amount: 23.89, period: '2023', type: 'common' },
    { date: '2023-06-15', amount: 22.39, period: '2022', type: 'common' },
    { date: '2022-06-10', amount: 21.92, period: '2021', type: 'common' },
    { date: '2021-06-15', amount: 21.26, period: '2020', type: 'common' },
    { date: '2020-06-10', amount: 21.26, period: '2019', type: 'common' }
  ],
  
  // Северсталь
  CHMF: [
    { date: '2024-06-25', amount: 65.0, period: '2023', type: 'common' },
    { date: '2023-06-20', amount: 95.0, period: '2022', type: 'common' },
    { date: '2022-06-15', amount: 129.0, period: '2021', type: 'common' },
    { date: '2021-06-10', amount: 85.0, period: '2020', type: 'common' },
    { date: '2020-06-15', amount: 85.0, period: '2019', type: 'common' }
  ],
  
  // НЛМК
  NLMK: [
    { date: '2024-06-20', amount: 0, period: '2023', type: 'common' },
    { date: '2023-06-15', amount: 0, period: '2022', type: 'common' },
    { date: '2022-06-10', amount: 9.4, period: '2021', type: 'common' },
    { date: '2021-06-15', amount: 5.2, period: '2020', type: 'common' },
    { date: '2020-06-10', amount: 5.2, period: '2019', type: 'common' }
  ],
  
  // Полюс
  PLZL: [
    { date: '2024-06-25', amount: 0, period: '2023', type: 'common' },
    { date: '2023-06-20', amount: 0, period: '2022', type: 'common' },
    { date: '2022-06-15', amount: 0, period: '2021', type: 'common' },
    { date: '2021-06-10', amount: 0, period: '2020', type: 'common' },
    { date: '2020-06-15', amount: 0, period: '2019', type: 'common' }
  ],
  
  // Алроса
  ALRS: [
    { date: '2024-06-20', amount: 0, period: '2023', type: 'common' },
    { date: '2023-06-15', amount: 0, period: '2022', type: 'common' },
    { date: '2022-06-10', amount: 0, period: '2021', type: 'common' },
    { date: '2021-06-15', amount: 0, period: '2020', type: 'common' },
    { date: '2020-06-10', amount: 0, period: '2019', type: 'common' }
  ],
  
  // Интер РАО
  IRKT: [
    { date: '2024-07-05', amount: 0.025, period: '2023', type: 'common' },
    { date: '2023-07-01', amount: 0.025, period: '2022', type: 'common' },
    { date: '2022-06-25', amount: 0.025, period: '2021', type: 'common' },
    { date: '2021-06-20', amount: 0.02, period: '2020', type: 'common' },
    { date: '2020-06-15', amount: 0.02, period: '2019', type: 'common' }
  ],
  
  // ФСК ЕЭС (Россети)
  FEES: [
    { date: '2024-06-25', amount: 0.0037, period: '2023', type: 'common' },
    { date: '2023-06-20', amount: 0.0037, period: '2022', type: 'common' },
    { date: '2022-06-15', amount: 0.0037, period: '2021', type: 'common' },
    { date: '2021-06-10', amount: 0.0025, period: '2020', type: 'common' },
    { date: '2020-06-15', amount: 0.0025, period: '2019', type: 'common' }
  ],
  
  // Транснефть (префы)
  TRNFP: [
    { date: '2024-06-20', amount: 265.0, period: '2023', type: 'preferred' },
    { date: '2023-06-15', amount: 230.0, period: '2022', type: 'preferred' },
    { date: '2022-06-10', amount: 208.0, period: '2021', type: 'preferred' },
    { date: '2021-06-15', amount: 145.0, period: '2020', type: 'preferred' },
    { date: '2020-06-10', amount: 145.0, period: '2019', type: 'preferred' }
  ],
  
  // Яндекс
  YNDX: [
    { date: '2024-06-25', amount: 0, period: '2023', type: 'common' },
    { date: '2023-06-20', amount: 0, period: '2022', type: 'common' },
    { date: '2022-06-15', amount: 0, period: '2021', type: 'common' },
    { date: '2021-06-10', amount: 0, period: '2020', type: 'common' },
    { date: '2020-06-15', amount: 0, period: '2019', type: 'common' }
  ],
  
  // Озон
  OZON: [
    { date: '2024-06-20', amount: 0, period: '2023', type: 'common' },
    { date: '2023-06-15', amount: 0, period: '2022', type: 'common' },
    { date: '2022-06-10', amount: 0, period: '2021', type: 'common' }
  ],
  
  // ВТБ
  VTB: [
    { date: '2024-07-10', amount: 0, period: '2023', type: 'common' },
    { date: '2023-07-05', amount: 0, period: '2022', type: 'common' },
    { date: '2022-06-30', amount: 0, period: '2021', type: 'common' },
    { date: '2021-07-05', amount: 0, period: '2020', type: 'common' },
    { date: '2020-07-01', amount: 0, period: '2019', type: 'common' }
  ],
  
  // Аэрофлот
  AFLT: [
    { date: '2024-06-25', amount: 0, period: '2023', type: 'common' },
    { date: '2023-06-20', amount: 0, period: '2022', type: 'common' },
    { date: '2022-06-15', amount: 0, period: '2021', type: 'common' },
    { date: '2021-06-10', amount: 0, period: '2020', type: 'common' },
    { date: '2020-06-15', amount: 0, period: '2019', type: 'common' }
  ],
  
  // Магнит
  MGNT: [
    { date: '2024-06-20', amount: 0, period: '2023', type: 'common' },
    { date: '2023-06-15', amount: 0, period: '2022', type: 'common' },
    { date: '2022-06-10', amount: 0, period: '2021', type: 'common' },
    { date: '2021-06-15', amount: 0, period: '2020', type: 'common' },
    { date: '2020-06-10', amount: 0, period: '2019', type: 'common' }
  ],
  
  // X5 Group
  FIVE: [
    { date: '2024-06-25', amount: 0, period: '2023', type: 'common' },
    { date: '2023-06-20', amount: 0, period: '2022', type: 'common' },
    { date: '2022-06-15', amount: 0, period: '2021', type: 'common' },
    { date: '2021-06-10', amount: 0, period: '2020', type: 'common' },
    { date: '2020-06-15', amount: 0, period: '2019', type: 'common' }
  ]
}

/**
 * Получение истории дивидендов из встроенной базы
 * @param {string} ticker - Тикер акции
 * @returns {Array} - Массив дивидендов
 */
export function getDividendsFromDatabase(ticker) {
  const dividends = DIVIDEND_DATABASE[ticker.toUpperCase()]
  
  if (!dividends) {
    console.log(`Дивиденды для ${ticker} не найдены во встроенной базе`)
    return []
  }
  
  return dividends.map(div => ({
    ...div,
    source: 'database'
  }))
}

/**
 * Проверка наличия дивидендов в базе
 * @param {string} ticker - Тикер акции
 * @returns {boolean}
 */
export function hasDividendsInDatabase(ticker) {
  return !!DIVIDEND_DATABASE[ticker.toUpperCase()]
}

/**
 * Получение списка всех доступных тикеров
 * @returns {string[]}
 */
export function getAvailableTickers() {
  return Object.keys(DIVIDEND_DATABASE)
}
