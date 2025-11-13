import { useState, useEffect } from "react"
import { Filter, Loader2 } from "lucide-react"
import { SearchInput, ConsistentCard, ConsistentCardContent, Button } from "../ui"
import { productService } from "../../services/productService"

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [isVisible, setIsVisible] = useState(false)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 8

  // Load products from Firestore
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await productService.getAllProducts()
        
        if (result.success) {
          // Filter to only show Active products for public page
          const activeProducts = result.products.filter(
            product => product.status === 'Active' || !product.status
          )
          setProducts(activeProducts)
        } else {
          setError(result.message || 'Failed to load products')
        }
      } catch (err) {
        console.error('Error loading products:', err)
        setError('Failed to load products. Please try again later.')
      } finally {
        setLoading(false)
        setIsVisible(true)
      }
    }

    loadProducts()
  }, [])

  // Format price for display
  const formatPrice = (price) => {
    if (!price && price !== 0) return "Price not available"
    return `₱${Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getCategoryColor = (category) => {
    const colors = {
      "Hair Care": "bg-[#160B53]",
      "Styling Products": "bg-[#160B53]",
      "Hair Color": "bg-[#160B53]",
      Treatments: "bg-[#160B53]",
    }
    return colors[category] || "bg-[#160B53]"
  }

  // Filter products based on search term and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      (product.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (product.category?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (product.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Get unique categories from products
  const categories = ["All", ...new Set(products.map(product => product.category).filter(Boolean))]

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategory])

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)
  const startIndex = (currentPage - 1) * productsPerPage
  const endIndex = startIndex + productsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-[122px]">
        {/* Page Header */}
        <div className={`text-center mb-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h1 className="font-bold text-[#160B53] mb-6 animate-pulse-slow" style={{ fontSize: '50px' }}>Products Catalog</h1>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-[#160B53] text-white scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <p className="text-gray-600">
              Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              {searchTerm && ` for "${searchTerm}"`}
            </p>
            <div className="flex items-center gap-4">
              <SearchInput
                placeholder="Search products, brands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80"
              />
              <button className="bg-[#160B53] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#160B53]/90 transition-all duration-300 hover:scale-105 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#160B53]" />
            <span className="ml-3 text-gray-600">Loading products...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-20">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && (
          <>
            {paginatedProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-600 text-lg">No products found.</p>
                {searchTerm && (
                  <p className="text-gray-500 mt-2">Try adjusting your search or filters.</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {paginatedProducts.map((product) => (
                  <ConsistentCard
                    key={product.id}
                    shadowVariant="custom"
                    hoverable={false}
                  >
                    {/* Product Image */}
                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                      <img
                        src={product.imageUrl || "/placeholder.svg"}
                        alt={product.name || "Product"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "/placeholder.svg"
                        }}
                      />
                      {/* Category Tag */}
                      {product.category && (
                        <div
                          className={`absolute top-3 left-3 text-white px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(product.category)}`}
                        >
                          {product.category}
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <ConsistentCardContent className="p-4">
                      {product.brand && (
                        <p className="text-xs uppercase tracking-wide mb-1 text-gray-500">
                          {product.brand}
                        </p>
                      )}
                      <h3 className="font-semibold mb-2 line-clamp-2 text-gray-900">
                        {product.name || "Unnamed Product"}
                      </h3>
                      {product.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                      )}

                      {/* Price */}
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-[#160B53]">
                          {formatPrice(product.otcPrice || product.unitCost || 0)}
                        </span>
                        {product.unitCost && product.otcPrice && product.unitCost < product.otcPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(product.unitCost)}
                          </span>
                        )}
                      </div>
                    </ConsistentCardContent>
                  </ConsistentCard>
                ))}
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {!loading && !error && filteredProducts.length > 0 && totalPages > 1 && (
          <div className="flex justify-center mt-8 space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-8 h-8 p-0 bg-transparent text-gray-700 border-gray-300 hover:bg-gray-50 transition-all duration-300 hover:scale-110 hover:border-[#160B53]/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {"<"}
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page)}
                className={`w-8 h-8 p-0 transition-all duration-300 hover:scale-110 ${
                  currentPage === page
                    ? "bg-[#160B53] text-white border-[#160B53]"
                    : "bg-transparent text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-[#160B53]/50"
                }`}
              >
                {page}
              </Button>
            ))}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="w-8 h-8 p-0 bg-transparent text-gray-700 border-gray-300 hover:bg-gray-50 transition-all duration-300 hover:scale-110 hover:border-[#160B53]/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {">"}
            </Button>
          </div>
        )}
      </main>
    </>
  )
}
