import { Container, Nav, Navbar } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'
import 'bootstrap-icons/font/bootstrap-icons.css'

function Header() {
  const location = useLocation()

  const isActive = (path) => location.pathname === path ? 'active' : ''

  return (
    <header className="header">
      <Navbar variant="dark" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/" className="header-brand">
            <i className="bi bi-graph-up-arrow"></i>
            StockYield
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/" className={`text-light ${isActive('/')}`}>Акции</Nav.Link>
              <Nav.Link as={Link} to="/portfolio" className={`text-light ${isActive('/portfolio')}`}>Портфель</Nav.Link>
              <Nav.Link href="#" className="text-light">Индексы</Nav.Link>
              <Nav.Link href="#" className="text-light">О сервисе</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  )
}

export default Header
