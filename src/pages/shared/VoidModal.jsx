import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { X, AlertTriangle, Ban, FileX } from 'lucide-react';

const VoidModal = ({ 
  isOpen, 
  onClose, 
  transaction, 
  onVoid, 
  loading = false 
}) => {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

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

  const handleClose = () => {
    setReason('');
    setNotes('');
    onClose();
  };

  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Ban className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-semibold">Void Transaction</h2>
                <p className="text-gray-100 text-sm">
                  Void transaction #{transaction.id.slice(-8)}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="text-white border-white hover:bg-white hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Transaction Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Transaction Details</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-medium">#{transaction.id.slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">₱{transaction.total?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium capitalize">{transaction.paymentMethod || 'Cash'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium capitalize">{transaction.status || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">
                  {transaction.createdAt ? 
                    new Date(transaction.createdAt.toDate ? transaction.createdAt.toDate() : transaction.createdAt).toLocaleDateString('en-PH')
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Void *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              required
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide additional details about why this transaction is being voided..."
              rows={3}
            />
          </div>

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-800">Warning: This action cannot be undone</p>
                <p className="text-red-700 mt-1">
                  Voiding this transaction will permanently mark it as voided in the system. 
                  This action will be logged and cannot be reversed.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gray-600 hover:bg-gray-700 text-white"
              disabled={loading || !reason}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Ban className="h-4 w-4 mr-2" />
              )}
              Void Transaction
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VoidModal;
