function SearchBar({ query, onSearch }) {
  const handleSearch = (e) => {
    onSearch(e.target.value)
  }

  return (
    <div className="search-bar">
      <i className="bi bi-search"></i>
      <input
        type="text"
        placeholder="Поиск акций (тикер или название)..."
        value={query}
        onChange={handleSearch}
      />
    </div>
  )
}

export default SearchBar
