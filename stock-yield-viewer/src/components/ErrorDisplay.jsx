import { Button } from 'react-bootstrap'

function ErrorDisplay({ message, onRetry }) {
  return (
    <div className="error-container">
      <i className="bi bi-exclamation-triangle-fill"></i>
      <h4>Ошибка загрузки данных</h4>
      <p>{message}</p>
      <Button variant="outline-light" onClick={onRetry}>
        <i className="bi bi-arrow-clockwise"></i> Повторить
      </Button>
    </div>
  )
}

export default ErrorDisplay
