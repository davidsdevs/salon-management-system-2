import { LogOut, Menu } from "lucide-react"
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { 
  LayoutDashboard, 
  Calendar,
  User,
  Settings,
  Bell,
  CreditCard,
  History
} from "lucide-react"

const SidebarWithHeader = ({ userInfo, pageTitle, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeItem, setActiveItem] = useState("Dashboard")
  const navigate = useNavigate()
  const location = useLocation()

  const getCurrentDate = () => {
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
    return new Date().toLocaleDateString("en-US", options)
  }

  const menuItems = [
    { name: "Item 1", icon: LayoutDashboard, route: "/client-dashboard" },
 
  ]

  // Update active item on route change
  useEffect(() => {
    const current = menuItems.find(item => item.route === location.pathname)
    if (current) setActiveItem(current.name)
  }, [location.pathname])

  const handleMenuItemClick = (itemName, route) => {
    navigate(route)
    setSidebarOpen(false)
  }

  const handleLogout = async () => {
    try {
      navigate("/")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <div className="flex min-h-screen w-full font-poppins bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center mb-6">
              <img src="/logo.png" alt="David's Salon" className="h-8 w-auto" />
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden">
                <img src={userInfo.profileImage || "/placeholder.svg"} alt={userInfo.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{userInfo.name}</h3>
                <p className="text-sm text-gray-500">{userInfo.subtitle}</p>
                {userInfo.badge && (
                  <span className="inline-block px-2 py-1 text-xs font-medium text-white bg-[#160B53] rounded-full mt-1">{userInfo.badge}</span>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <div className="flex-1 px-4 py-2 overflow-y-auto">
            <nav className="space-y-1">
              {menuItems.map(item => (
                <button
                  key={item.name}
                  onClick={() => handleMenuItemClick(item.name, item.route)}
                  className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${activeItem === item.name ? "bg-[#160B53] text-white" : "text-gray-700 hover:bg-gray-100"}`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span>{item.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        <header className="bg-white border-b border-gray-200 px-4 py-4 lg:px-6 lg:py-6 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 lg:ml-0">
            <h1 className="text-2xl font-semibold text-[#160B53]">{pageTitle}</h1>
            <p className="text-gray-600">{getCurrentDate()}</p>
          </div>

          <button onClick={handleLogout} className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-[#160B53] transition-colors">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}

export default SidebarWithHeader
