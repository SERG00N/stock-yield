import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Container, Row, Col } from 'react-bootstrap'
import Header from './components/Header'
import StockCard from './components/StockCard'
import StockTable from './components/StockTable'
import SearchBar from './components/SearchBar'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorDisplay from './components/ErrorDisplay'
import PortfolioPage from './pages/PortfolioPage'
import { useStocks } from './hooks/useStocks'
import './App.css'

function HomePage() {
  const [query, setQuery] = useState('')
  const { stocks, loading, error, refetch } = useStocks()

  const filteredStocks = stocks.filter(stock =>
    stock.ticker.toLowerCase().includes(query.toLowerCase()) ||
    stock.name.toLowerCase().includes(query.toLowerCase())
  )

  const lastUpdated = new Date().toLocaleTimeString('ru-RU')

  if (loading) {
    return (
      <div className="app">
        <Header />
        <Container className="py-4">
          <LoadingSpinner />
        </Container>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app">
        <Header />
        <Container className="py-4">
          <ErrorDisplay message={error} onRetry={refetch} />
        </Container>
      </div>
    )
  }

  return (
    <div className="app">
      <Header />
      <Container className="py-4">
        <Row className="mb-4">
          <Col>
            <SearchBar query={query} onSearch={setQuery} />
          </Col>
        </Row>
        <Row className="mb-4">
          {filteredStocks.slice(0, 3).map(stock => (
            <Col key={stock.id} md={4} className="mb-3">
              <StockCard stock={stock} />
            </Col>
          ))}
        </Row>
        <Row>
          <Col>
            <StockTable stocks={filteredStocks} />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col>
            <div className="last-updated text-end">
              <i className="bi bi-clock-history"></i>
              Обновлено: {lastUpdated}
            </div>
          </Col>
        </Row>
        {filteredStocks.length === 0 && query && (
          <div className="text-center text-muted py-5">
            <i className="bi bi-search" style={{ fontSize: '3rem' }}></i>
            <p className="mt-3">Ничего не найдено по запросу "{query}"</p>
          </div>
        )}
      </Container>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/portfolio" element={<PortfolioPage />} />
    </Routes>
  )
}

export default App
