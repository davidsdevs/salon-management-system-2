import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { SearchInput } from "../ui"
import { MapPin, Phone, Search } from "lucide-react"
import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import PromotionPopup from "./PromotionPopup"

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isVisible, setIsVisible] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const branchesPerPage = 6

  // Fade in animation on component mount
  useEffect(() => {
    setIsVisible(true)
  }, [])

  const branches = [
    {
      name: "Harbor Point Ayala",
      slug: "harbor-point-ayala",
      location: "Ground Floor Harbor Point Subic, Subic, Philippines",
      phone: "0992 586 5758",
      image: "/images/branches/harbor-point-ayala/harborpoint.png",
    },
  ]

  const testimonials = [
    {
      name: "Maria Gonzalez",
      branch: "Harbor Point Ayala",
      rating: 5,
      text: "I've been a loyal customer at Harbor Point Ayala for over 5 years, and the service quality and professionalism is remarkable. David's Salon truly understands Filipino beauty.",
    },
    {
      name: "Jennifer Santos",
      branch: "Harbor Point Ayala",
      rating: 5,
      text: "The staff at Harbor Point Ayala are not just skilled, they're artists. The transformation was beyond my expectations. The European techniques combined with Filipino hospitality is unmatched!",
    },
    {
      name: "Carlos Mendoza",
      branch: "Harbor Point Ayala",
      rating: 5,
      text: "Harbor Point Ayala offers world-class service. The quality is exceptional, the location is convenient, and the prices are very reasonable.",
    },
  ]

  // Filter branches based on search term
  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination logic
  const totalPages = Math.ceil(filteredBranches.length / branchesPerPage)
  const startIndex = (currentPage - 1) * branchesPerPage
  const endIndex = startIndex + branchesPerPage
  const currentBranches = filteredBranches.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  return (
    <>
      {/* Promotion Popup */}
      <PromotionPopup />
      
      {/* Hero Section */}
      <section
        className="relative h-[800px] flex items-center justify-center text-center text-white mt-[122px]"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(22, 11, 83, 0.7)), url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image%201-gwMUdJmDY3pIDaLqR4DsNsL8vwz2Fd.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className={`max-w-4xl px-2 sm:px-4 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h1 className="font-bold mb-6 text-balance animate-pulse-slow" style={{ fontSize: '50px' }}>Welcome to David's Salon</h1>
          <p className="text-xl mb-8 text-pretty leading-relaxed">
            Experience premium hair and beauty services at our Harbor Point Ayala location. Discover our specialized services and exclusive offers tailored just for you.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-[#160B53] hover:bg-gray-100 font-semibold px-8 py-3"
            onClick={() => {
              const branchesSection = document.getElementById('branches')
              if (branchesSection) {
                const targetPosition = branchesSection.offsetTop - 20 // Add some offset from top
                const startPosition = window.pageYOffset
                const distance = targetPosition - startPosition
                const duration = 1000 // 1 second for smooth scroll
                let start = null

                const animation = (currentTime) => {
                  if (start === null) start = currentTime
                  const timeElapsed = currentTime - start
                  const run = easeInOutQuad(timeElapsed, startPosition, distance, duration)
                  window.scrollTo(0, run)
                  if (timeElapsed < duration) requestAnimationFrame(animation)
                }

                const easeInOutQuad = (t, b, c, d) => {
                  t /= d / 2
                  if (t < 1) return c / 2 * t * t + b
                  t--
                  return -c / 2 * (t * (t - 2) - 1) + b
                }

                requestAnimationFrame(animation)
              }
            }}
          >
            View Our Services
          </Button>
        </div>
      </section>

      {/* Our Location Section */}
      <section id="branches" className="py-16 px-2 sm:px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-bold text-center text-[#160B53] mb-4" style={{ fontSize: '50px' }}>Choose Your Branch</h2>

          <div className="flex justify-center mb-12">
            <div className="max-w-md w-full">
              <SearchInput
                placeholder="Search branches..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1) // Reset to first page when searching
                }}
              />
            </div>
          </div>

          {searchTerm && (
            <div className="text-center mb-6">
              <p className="text-gray-600">
                Found {filteredBranches.length} branch{filteredBranches.length !== 1 ? 'es' : ''} 
                {searchTerm && ` for "${searchTerm}"`}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentBranches.map((branch, index) => (
              <Card 
                key={index} 
                className="overflow-hidden p-0 border-0"
                style={{ 
                  boxShadow: '0 2px 15px 0 rgba(0, 0, 0, 0.25)'
                }}
              >
                <div className="h-48 w-full overflow-hidden relative">
                  <img
                    src={branch.image || "/placeholder.svg"}
                    alt={`${branch.name} branch`}
                    className="w-full h-full object-cover"
                    style={{ 
                      objectPosition: 'center center',
                      height: '192px',
                      width: '100%',
                      maxHeight: '192px',
                      maxWidth: '100%'
                    }}
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-gray-800">
                    {branch.name}
                  </h3>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-sm">{branch.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600 mb-4">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-sm">{branch.phone}</span>
                  </div>
                  <div className="text-sm text-gray-500 mb-4">
                    <span className="inline-block px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                      Premium Services
                    </span>
                  </div>
                  <Link to={`/branch/${branch.slug}`}>
                    <Button className="w-full text-white bg-[#160B53] hover:bg-[#160B53]/90">
                      View Services
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-8 h-8 p-0 bg-transparent text-gray-700 border-gray-300 hover:bg-gray-50 transition-all duration-300 hover:scale-110 hover:border-[#160B53]/50"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                {"<"}
              </Button>
              
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1
                return (
                  <Button 
                    key={page}
                    variant="outline" 
                    size="sm" 
                    className={`w-8 h-8 p-0 transition-all duration-300 hover:scale-110 ${
                      currentPage === page
                        ? 'bg-[#160B53] text-white border-[#160B53]'
                        : 'bg-transparent text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-[#160B53]/50'
                    }`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                )
              })}
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-8 h-8 p-0 bg-transparent text-gray-700 border-gray-300 hover:bg-gray-50 transition-all duration-300 hover:scale-110 hover:border-[#160B53]/50"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                {">"}
              </Button>
            </div>
          )}

          {filteredBranches.length === 0 && searchTerm && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No branches found</h3>
              <p className="text-gray-500">
                Try searching with different keywords or check the spelling.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-2 sm:px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-bold text-center text-[#160B53] mb-4" style={{ fontSize: '50px' }}>What Our Clients Say</h2>
          <p className="text-center text-gray-600 mb-12">Real stories from our satisfied customers</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index} 
                className="p-6 border-0"
                style={{ 
                  borderColor: '#B5B5B5',
                  boxShadow: '0 2px 15px 0 rgba(0, 0, 0, 0.25)'
                }}
              >
                <CardContent className="p-0">
                  <div className="text-6xl text-[#160B53] mb-4">"</div>
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    {testimonial.text}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#160B53]">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {testimonial.branch}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 px-2 sm:px-4 bg-[#160B53] text-white text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-bold mb-6" style={{ fontSize: '50px' }}>Ready to Transform Your Look?</h2>
          <p className="text-xl mb-8 text-pretty leading-relaxed">
            Visit our Harbor Point Ayala location to discover our exclusive services and book your appointment today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-[#160B53] bg-transparent"
              onClick={() => {
                const branchesSection = document.getElementById('branches')
                if (branchesSection) {
                  const targetPosition = branchesSection.offsetTop - 20 // Add some offset from top
                  const startPosition = window.pageYOffset
                  const distance = targetPosition - startPosition
                  const duration = 1000 // 1 second for smooth scroll
                  let start = null

                  const animation = (currentTime) => {
                    if (start === null) start = currentTime
                    const timeElapsed = currentTime - start
                    const run = easeInOutQuad(timeElapsed, startPosition, distance, duration)
                    window.scrollTo(0, run)
                    if (timeElapsed < duration) requestAnimationFrame(animation)
                  }

                  const easeInOutQuad = (t, b, c, d) => {
                    t /= d / 2
                    if (t < 1) return c / 2 * t * t + b
                    t--
                    return -c / 2 * (t * (t - 2) - 1) + b
                  }

                  requestAnimationFrame(animation)
                }
              }}
            >
              View Our Services
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}



