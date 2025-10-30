import React, { useState, useEffect } from 'react';
import { Card } from '../../pages/ui/card';
import { Button } from '../../pages/ui/button';
import { Input } from '../../pages/ui/input';
import { Textarea } from '../../pages/ui/textarea';
import { X, AlertTriangle, DollarSign, CreditCard, RefreshCw } from 'lucide-react';

const RefundModal = ({ 
  isOpen, 
  onClose, 
  transaction, 
  onRefund, 
  loading = false 
}) => {
  const [refundAmount, setRefundAmount] = useState(transaction?.total || 0);
  const [refundMethod, setRefundMethod] = useState('cash');
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
      setRefundAmount(transaction?.total || 0);
      setRefundMethod('cash');
      setReason('');
      setNotes('');
      onClose();
    }, 300);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      alert('Please provide a reason for the refund');
      return;
    }

    if (refundAmount <= 0 || refundAmount > transaction.total) {
      alert('Invalid refund amount');
      return;
    }

    onRefund({
      transactionId: transaction.id,
      refundAmount: parseFloat(refundAmount),
      refundMethod,
      reason: reason.trim(),
      notes: notes.trim(),
      originalAmount: transaction.total
    });
  };

  if (!isOpen || !transaction) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <Card 
        className={`w-full max-w-md max-h-[90vh] overflow-y-auto bg-white shadow-2xl transition-all duration-300 ease-out transform ${isAnimating ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-8 scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <RefreshCw className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-semibold">Refund Transaction</h2>
                <p className="text-red-100 text-sm">
                  Process a refund for transaction #{transaction.id.slice(-8)}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="text-white border-white hover:bg-white hover:text-red-600"
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
                <span className="text-gray-600">Original Amount:</span>
                <span className="font-medium">₱{transaction.total?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium capitalize">{transaction.paymentMethod || 'Cash'}</span>
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

          {/* Refund Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Refund Amount (₱) *
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max={transaction.total}
              value={refundAmount}
              onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
              placeholder="Enter refund amount"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum: ₱{transaction.total?.toFixed(2) || '0.00'}
            </p>
          </div>

          {/* Refund Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Refund Method *
            </label>
            <div className="space-y-2">
              {[
                { value: 'cash', label: 'Cash', icon: DollarSign },
                { value: 'card', label: 'Credit/Debit Card', icon: CreditCard },
                { value: 'store_credit', label: 'Store Credit', icon: RefreshCw }
              ].map((method) => (
                <Button
                  key={method.value}
                  type="button"
                  onClick={() => setRefundMethod(method.value)}
                  variant={refundMethod === method.value ? 'default' : 'outline'}
                  className="w-full justify-start"
                >
                  <method.icon className="h-4 w-4 mr-2" />
                  {method.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Refund *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            >
              <option value="">Select a reason</option>
              <option value="customer_request">Customer Request</option>
              <option value="service_issue">Service Issue</option>
              <option value="product_defect">Product Defect</option>
              <option value="cancelled_appointment">Cancelled Appointment</option>
              <option value="duplicate_charge">Duplicate Charge</option>
              <option value="system_error">System Error</option>
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
              placeholder="Any additional information about the refund..."
              rows={3}
            />
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Important Notice</p>
                <p className="text-yellow-700 mt-1">
                  This refund will be recorded in the system and cannot be undone. 
                  Please ensure all details are correct before proceeding.
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
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={loading || !reason || refundAmount <= 0}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Process Refund
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default RefundModal;
