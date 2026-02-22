import { Spinner } from 'react-bootstrap'

function LoadingSpinner() {
  return (
    <div className="loading-container">
      <Spinner animation="border" variant="danger" />
      <p className="mt-3">Загрузка данных с Мосбиржи...</p>
    </div>
  )
}

export default LoadingSpinner
