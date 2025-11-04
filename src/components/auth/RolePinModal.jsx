import React, { useState, useRef, useEffect } from 'react';
import { Lock, X, AlertCircle } from 'lucide-react';
import { Button } from '../../pages/ui/button';
    
const RolePinModal = ({ isOpen, onClose, onVerify, roleName, isVerifying }) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setPin(['', '', '', '']);
      setError('');
      // Focus first input
      setTimeout(() => inputRefs[0].current?.focus(), 100);
    }
  }, [isOpen]);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError('');

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }

    // Handle Enter key
    if (e.key === 'Enter' && pin.every(digit => digit !== '')) {
      handleSubmit();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 4);
    if (/^\d+$/.test(pastedData)) {
      const newPin = pastedData.split('').concat(['', '', '', '']).slice(0, 4);
      setPin(newPin);
      
      // Focus the last filled input or next empty one
      const nextIndex = Math.min(pastedData.length, 3);
      inputRefs[nextIndex].current?.focus();
    }
  };

  const handleSubmit = async () => {
    const pinString = pin.join('');
    if (pinString.length !== 4) {
      setError('Please enter a 4-digit PIN');
      return;
    }

    try {
      await onVerify(pinString);
    } catch (error) {
      setError(error.message || 'Invalid PIN');
      setPin(['', '', '', '']);
      inputRefs[0].current?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={isVerifying}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#160B53] to-[#2D1B69] rounded-full mb-4">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Enter Role PIN
          </h2>
          <p className="text-gray-600">
            Enter PIN to switch to <span className="font-semibold text-[#160B53]">{roleName}</span>
          </p>
        </div>

        {/* PIN Input */}
        <div className="mb-6">
          <div className="flex justify-center gap-3 mb-4">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                disabled={isVerifying}
                className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-[#160B53] focus:ring-2 focus:ring-[#160B53] focus:ring-opacity-20 transition-all outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={isVerifying}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={pin.some(digit => digit === '') || isVerifying}
            className="flex-1 bg-gradient-to-r from-[#160B53] to-[#2D1B69] hover:from-[#2D1B69] hover:to-[#160B53] text-white"
          >
            {isVerifying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Verifying...
              </>
            ) : (
              'Verify PIN'
            )}
          </Button>
        </div>

        {/* Helper text */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Contact your administrator if you don't have a PIN
        </p>
      </div>
    </div>
  );
};

export default RolePinModal;
