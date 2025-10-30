import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Ban } from 'lucide-react';

const VoidModal = ({ 
  isOpen, 
  onClose, 
  transaction, 
  onVoid, 
  loading = false 
}) => {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
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
    setTimeout(() => {
      setReason('');
      setNotes('');
      onClose();
    }, 300);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      alert('Please provide a reason for voiding the transaction');
      return;
    }

    onVoid({
      transactionId: transaction.id,
      reason: reason.trim(),
      notes: notes.trim()
    });
  };

  if (!isOpen || !transaction) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] transition-all duration-300 ease-out transform ${isAnimating ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-8 scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#160B53] to-[#2D1B69] text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Ban className="w-6 h-6 mr-3" />
              <div>
                <h2 className="text-xl font-bold">Void Transaction</h2>
                <p className="text-blue-100 text-sm">Void transaction #{transaction.id.slice(-8)}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Transaction Details */}
            <div className="bg-gradient-to-r from-[#160B53]/5 to-[#2D1B69]/5 border border-[#160B53]/20 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Transaction Details</h3>
              <div className="space-y-2 text-sm">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Transaction ID:</span> #{transaction.id.slice(-8)}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Amount:</span> ₱{transaction.total?.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Payment Method:</span> {transaction.paymentMethod || 'Cash'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Status:</span> <span className="capitalize">{transaction.status || 'Unknown'}</span>
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Date:</span> {transaction.createdAt ? 
                    new Date(transaction.createdAt.toDate ? transaction.createdAt.toDate() : transaction.createdAt).toLocaleDateString('en-PH')
                    : 'N/A'
                  }
                </p>
              </div>
            </div>

            {/* Reason */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Void *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
                required
                disabled={loading}
              >
                <option value="">Select a reason</option>
                <option value="duplicate_transaction">Duplicate Transaction</option>
                <option value="system_error">System Error</option>
                <option value="cancelled_service">Cancelled Service</option>
                <option value="payment_issue">Payment Issue</option>
                <option value="customer_request">Customer Request</option>
                <option value="staff_error">Staff Error</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Additional Notes */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Provide additional details about why this transaction is being voided..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* Warning */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-red-800">Warning: This action cannot be undone</p>
                  <p className="text-red-700 mt-1">
                    Voiding this transaction will permanently mark it as voided in the system. 
                    This action will be logged and cannot be reversed.
                  </p>
                  {transaction.status === 'paid' && (
                    <p className="text-red-800 font-medium mt-2">
                      ⚠️ This is a PAID transaction. Customer refund must be processed separately.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !reason}
                className="px-6 py-3 bg-gradient-to-r from-[#160B53] to-[#2D1B69] text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <Ban className="h-5 w-5 mr-2" />
                )}
                Void Transaction
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VoidModal;
