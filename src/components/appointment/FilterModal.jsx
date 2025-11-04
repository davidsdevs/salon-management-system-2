import React, { useState, useEffect } from 'react';
import { Button } from '../../pages/ui/button';
import { X, Filter } from 'lucide-react';

const FilterModal = ({ 
  isOpen,
  onClose,
  onApply,
  onClear,
  dateRange,
  setDateRange,
  stylistFilter,
  setStylistFilter,
  serviceFilter,
  setServiceFilter,
  uniqueStylists = [],
  uniqueServices = []
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => onClose(), 300);
  };

  if (!isOpen) return null;

  const hasFilters = dateRange.start || dateRange.end || stylistFilter || serviceFilter;

  const handleApply = () => {
    if (onApply) onApply();
    handleClose();
  };

  const handleClear = () => {
    setDateRange({ start: '', end: '' });
    setStylistFilter('');
    setServiceFilter('');
    if (onClear) onClear();
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-200 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[95vh] overflow-hidden flex flex-col transition-all duration-300 ease-out transform ${isAnimating ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-8 scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#160B53] to-[#2D1B69] px-6 py-4 text-white flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Filter className="w-5 h-5 mr-3" />
              <div>
                <h2 className="text-xl font-bold">Filter Appointments</h2>
                <p className="text-blue-100 mt-1 text-sm">
                  Refine your appointment search
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClose}
              className="text-white hover:bg-white/20 p-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Appointment Date Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={e => setDateRange(r => ({ ...r, start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={e => setDateRange(r => ({ ...r, end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Stylist Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Stylist
              </label>
              <select
                value={stylistFilter}
                onChange={(e) => setStylistFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent text-sm"
              >
                <option value="">All Stylists</option>
                {uniqueStylists.map(stylist => (
                  <option key={stylist} value={stylist}>{stylist}</option>
                ))}
              </select>
            </div>

            {/* Service Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Service
              </label>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent text-sm"
              >
                <option value="">All Services</option>
                {uniqueServices.map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex-shrink-0 bg-gray-50">
          {hasFilters && (
            <div className="mb-3">
              <Button
                variant="outline"
                onClick={handleClear}
                className="w-full text-gray-700 border-gray-300 hover:bg-gray-100"
              >
                Clear All Filters
              </Button>
            </div>
          )}
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              className="bg-[#160B53] hover:bg-[#160B53]/90 text-white"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
