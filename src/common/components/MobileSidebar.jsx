import React from "react";

export default function MobileSidebar({ isOpen, onClose, navigationItems, userProfile }) {
  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      )}
      
      {/* Mobile Sidebar */}
      <div className={`md:hidden fixed left-0 top-0 h-full w-64 bg-white z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Branding & User Profile */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex justify-center w-full">
              <img src="/logo.png" alt="David's Salon" className="h-12" />
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <i className="ri-close-line text-xl text-gray-600"></i>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
              <i className="ri-user-line text-gray-600 text-xl"></i>
            </div>
            <div>
              <div className="font-semibold text-gray-900">{userProfile?.name || 'User'}</div>
              <div className="text-sm text-gray-500">{userProfile?.memberSince || 'Member'}</div>
              {userProfile?.badge && (
                <span className="inline-block bg-[#160B53] text-white text-xs px-2 py-1 rounded-full mt-1">
                  {userProfile.badge}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        <nav className="p-4">
          <ul className="space-y-2">
            {navigationItems.map((item, index) => (
              <li key={index}>
                <a 
                  href={item.href || "#"} 
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                    item.isActive 
                      ? 'bg-[#160B53] text-white' 
                      : 'text-primary hover:bg-gray-100'
                  }`}
                >
                  <i className={`${item.icon} text-xl`}></i>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Bottom Utilities */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <ul className="space-y-2">
            <li>
              <a href="#" className="flex items-center gap-3 px-3 py-2 text-primary hover:bg-gray-100 rounded-lg">
                <i className="ri-notification-line text-xl"></i>
                Notification
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 px-3 py-2 text-primary hover:bg-gray-100 rounded-lg">
                <i className="ri-settings-line text-xl"></i>
                Settings
              </a>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
