import React from "react"

const Footer = () => {
    return (
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <img src="/logo.png" alt="David's Salon" className="h-12 w-auto" />
              <p className="text-gray-600 text-sm leading-relaxed font-poppins">
                Premium hair and beauty services across 7 locations in the Philippines. Each branch offers specialized
                services for our local communities.
              </p>
            </div>
  
            <div>
              <h3 className="text-lg font-semibold text-[#160B53] mb-4 font-poppins">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-600 hover:text-[#160B53] text-sm font-poppins">
                    Our Branches
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-[#160B53] text-sm font-poppins">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-[#160B53] text-sm font-poppins">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-[#160B53] text-sm font-poppins">
                    Book Online
                  </a>
                </li>
              </ul>
            </div>
  
            <div>
              <h3 className="text-lg font-semibold text-[#160B53] mb-4 font-poppins">Contact Info</h3>
              <div className="space-y-2">
                <p className="text-gray-600 text-sm flex items-center font-poppins">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  +63 930 222 9659
                </p>
                <p className="text-gray-600 text-sm flex items-center font-poppins">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Makati, Philippines
                </p>
              </div>
            </div>
          </div>
  
          <div className="border-t border-gray-200 mt-8 pt-8 text-center">
            <p className="text-gray-500 text-sm font-poppins">© 2025 David's Salon. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    )
  }
  
  export default Footer
  