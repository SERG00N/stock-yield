import { useRef } from 'react'
import { Modal, Button, Row, Col, Card } from 'react-bootstrap'

/**
 * Модальное окно для экспорта/импорта портфеля
 * Поддерживает форматы JSON и CSV
 */
function ExportImportModal({
  show,
  onClose,
  onExportJSON,
  onImportJSON,
  onExportCSV,
  onImportCSV,
  portfolio,
  couponHistory,
  dividendHistory
}) {
  // Рефы для input элементов
  const jsonInputRef = useRef(null)
  const csvInputRef = useRef(null)

  // Обработка выбора файла для импорта JSON
  const handleImportJSONFile = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        onImportJSON(data)
      } catch (err) {
        alert('Ошибка при чтении JSON файла: ' + err.message)
      }
    }
    reader.readAsText(file)
    // Очищаем input
    event.target.value = ''
  }

  // Обработка выбора файла для импорта CSV
  const handleImportCSVFile = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target.result
        onImportCSV(text)
      } catch (err) {
        alert('Ошибка при чтении CSV файла: ' + err.message)
      }
    }
    reader.readAsText(file, 'UTF-8')
    // Очищаем input
    event.target.value = ''
  }

  // Клик по кнопке импорта JSON
  const handleJSONImportClick = () => {
    jsonInputRef.current?.click()
  }

  // Клик по кнопке импорта CSV
  const handleCSVImportClick = () => {
    csvInputRef.current?.click()
  }

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-download"></i> Экспорт/Импорт портфеля
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="g-4">
          {/* Экспорт */}
          <Col md={6}>
            <Card className="h-100">
              <Card.Header className="bg-success text-white">
                <i className="bi bi-upload"></i> Экспорт
              </Card.Header>
              <Card.Body className="d-flex flex-column gap-3">
                <p className="text-muted small">
                  Сохраните ваш портфель в файл для резервного копирования или переноса
                </p>
                
                <Button
                  variant="success"
                  onClick={onExportJSON}
                  className="w-100"
                >
                  <i className="bi bi-filetype-json"></i> Экспорт в JSON
                </Button>
                
                <Button
                  variant="outline-success"
                  onClick={onExportCSV}
                  className="w-100"
                >
                  <i className="bi bi-filetype-csv"></i> Экспорт в CSV
                </Button>

                <div className="mt-auto small text-muted">
                  <p className="mb-1"><strong>JSON:</strong> полный экспорт с историей</p>
                  <p className="mb-0"><strong>CSV:</strong> только позиции портфеля</p>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Импорт */}
          <Col md={6}>
            <Card className="h-100">
              <Card.Header className="bg-primary text-white">
                <i className="bi bi-download"></i> Импорт
              </Card.Header>
              <Card.Body className="d-flex flex-column gap-3">
                <p className="text-muted small">
                  Загрузите портфель из файла. Внимание: текущие данные будут заменены!
                </p>
                
                <div>
                  <Button
                    variant="primary"
                    onClick={handleJSONImportClick}
                    className="w-100 mb-2"
                  >
                    <i className="bi bi-filetype-json"></i> Импорт из JSON
                  </Button>
                  <input
                    ref={jsonInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportJSONFile}
                    style={{ display: 'none' }}
                  />
                  <small className="text-muted d-block text-center">
                    Полный импорт с историей
                  </small>
                </div>

                <div>
                  <Button
                    variant="outline-primary"
                    onClick={handleCSVImportClick}
                    className="w-100 mb-2"
                  >
                    <i className="bi bi-filetype-csv"></i> Импорт из CSV
                  </Button>
                  <input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleImportCSVFile}
                    style={{ display: 'none' }}
                  />
                  <small className="text-muted d-block text-center">
                    Только позиции (без истории)
                  </small>
                </div>

                <div className="mt-auto small text-muted">
                  <p className="mb-1"><strong>Важно:</strong> импорт заменяет все текущие данные</p>
                  <p className="mb-0 text-danger">Сделайте резервную копию перед импортом!</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Статистика портфеля */}
        <Card className="mt-4">
          <Card.Header>
            <i className="bi bi-bar-chart"></i> Текущая статистика
          </Card.Header>
          <Card.Body>
            <Row className="text-center">
              <Col md={4}>
                <div className="h4 mb-0">{portfolio.length}</div>
                <div className="text-muted small">Позиций</div>
              </Col>
              <Col md={4}>
                <div className="h4 mb-0">{couponHistory.length}</div>
                <div className="text-muted small">Купонов в истории</div>
              </Col>
              <Col md={4}>
                <div className="h4 mb-0">{dividendHistory.length}</div>
                <div className="text-muted small">Дивидендов в истории</div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          <i className="bi bi-x-lg"></i> Закрыть
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ExportImportModal
