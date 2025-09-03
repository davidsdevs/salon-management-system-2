import React from "react"

const Header = () => {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/logo.png" alt="David's Salon" className="h-10 w-auto" />
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-700 hover:text-[#160B53] font-medium font-poppins">
                HOME
              </a>
              <a href="#" className="text-gray-700 hover:text-[#160B53] font-medium font-poppins">
                BRANCH
              </a>
              <a href="#" className="text-gray-700 hover:text-[#160B53] font-medium font-poppins">
                ABOUT
              </a>
              <a href="#" className="text-gray-700 hover:text-[#160B53] font-medium font-poppins">
                PRODUCTS
              </a>
            </nav>
          </div>
        </div>
      </header>
    )
  }
  
  export default Header
  