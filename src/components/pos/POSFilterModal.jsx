import React, { useState, useEffect } from 'react';
import { Button } from '../../pages/ui/button';
import { X, Filter } from 'lucide-react';

const POSFilterModal = ({ 
  isOpen,
  onClose,
  onApply,
  onClear,
  dateRange,
  setDateRange,
  transactionTypeFilter,
  setTransactionTypeFilter,
  paymentMethodFilter,
    setPaymentMethodFilter,
  clientFilter,
  setClientFilter,
  staffFilter,
  setStaffFilter,
  amountRange,
  setAmountRange,
  discountFilter,
  setDiscountFilter,
  uniqueClients = [],
  uniqueStaff = []
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

  const hasFilters = dateRange.start || dateRange.end || transactionTypeFilter !== 'all' || 
    paymentMethodFilter !== 'all' || clientFilter || staffFilter || 
    amountRange.min || amountRange.max || discountFilter !== 'all';

  const handleApply = () => {
    if (onApply) onApply();
    handleClose();
  };

  const handleClear = () => {
    setDateRange({ start: '', end: '' });
    setTransactionTypeFilter('all');
    setPaymentMethodFilter('all');
    setClientFilter('');
    setStaffFilter('');
    setAmountRange({ min: '', max: '' });
    setDiscountFilter('all');
    if (onClear) onClear();
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-200 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col transition-all duration-300 ease-out transform ${isAnimating ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-8 scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#160B53] to-[#2D1B69] px-6 py-4 text-white flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Filter className="w-5 h-5 mr-3" />
              <div>
                <h2 className="text-xl font-bold">Filter Transactions</h2>
                <p className="text-blue-100 mt-1 text-sm">
                  Refine your transaction search
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
                Transaction Date Range
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

            {/* Transaction Type Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Transaction Type
              </label>
              <select
                value={transactionTypeFilter}
                onChange={(e) => setTransactionTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent text-sm"
              >
                <option value="all">All Types</option>
                <option value="service">Service</option>
                <option value="product">Product</option>
              </select>
            </div>

            {/* Payment Method Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent text-sm"
              >
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="card">Credit/Debit Card</option>
                <option value="gcash">GCash</option>
                <option value="paymaya">PayMaya</option>
              </select>
            </div>

            {/* Client Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Client
              </label>
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent text-sm"
              >
                <option value="">All Clients</option>
                {uniqueClients.map(client => (
                  <option key={client} value={client}>{client}</option>
                ))}
              </select>
            </div>

            {/* Staff Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Created By (Staff)
              </label>
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent text-sm"
              >
                <option value="">All Staff</option>
                {uniqueStaff.map(staff => (
                  <option key={staff} value={staff}>{staff}</option>
                ))}
              </select>
            </div>

            {/* Amount Range Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Amount Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Min Amount</label>
                  <input
                    type="number"
                    value={amountRange.min}
                    onChange={e => setAmountRange(r => ({ ...r, min: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max Amount</label>
                  <input
                    type="number"
                    value={amountRange.max}
                    onChange={e => setAmountRange(r => ({ ...r, max: e.target.value }))}
                    placeholder="999999"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Discount Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Discount Applied
              </label>
              <select
                value={discountFilter}
                onChange={(e) => setDiscountFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent text-sm"
              >
                <option value="all">All Transactions</option>
                <option value="with">With Discount</option>
                <option value="without">Without Discount</option>
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

export default POSFilterModal;
