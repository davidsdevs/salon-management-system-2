// src/components/QRCodeScanner.jsx
import React, { useState, useEffect, useRef } from 'react';
import { qrCodeService } from '../services/qrCodeService';
import { Card } from '../pages/ui/card';
import { Button } from '../pages/ui/button';
import { AlertTriangle, CheckCircle, XCircle, QrCode, Package, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

const QRCodeScanner = ({ onScanSuccess, onScanError }) => {
  const [scannedData, setScannedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleScan = async (qrCodeString) => {
    if (!qrCodeString || qrCodeString.trim() === '') {
      setError('Please enter or scan a QR code');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setScannedData(null);

      const result = await qrCodeService.scanQRCode(qrCodeString.trim());

      if (result.success) {
        setScannedData(result);
        if (onScanSuccess) {
          onScanSuccess(result);
        }
      } else {
        setError(result.message || 'Failed to scan QR code');
        if (onScanError) {
          onScanError(result.message);
        }
      }
    } catch (err) {
      console.error('Error scanning QR code:', err);
      setError(err.message || 'An error occurred while scanning');
      if (onScanError) {
        onScanError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    // Auto-scan when Enter is pressed or when barcode scanner sends data
    if (e.key === 'Enter' && value.trim()) {
      handleScan(value);
    }
  };

  const handleManualInput = () => {
    const value = inputRef.current?.value;
    if (value) {
      handleScan(value);
    }
  };

  const clearScan = () => {
    setScannedData(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Scanner Input */}
      <Card className="p-4">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Scan or enter QR code..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onKeyDown={handleInputChange}
            autoFocus
          />
          <Button onClick={handleManualInput} disabled={loading}>
            {loading ? 'Scanning...' : 'Scan'}
          </Button>
          {scannedData && (
            <Button variant="outline" onClick={clearScan}>
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <p className="font-medium">{error}</p>
          </div>
        </Card>
      )}

      {/* Scanned Data Display */}
      {scannedData && scannedData.success && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Product Information</h3>
          </div>

          <div className="space-y-4">
            {/* Product Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start gap-4">
                {scannedData.productInfo.imageUrl ? (
                  <img
                    src={scannedData.productInfo.imageUrl}
                    alt={scannedData.productInfo.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Package className="h-10 w-10 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-lg">{scannedData.productInfo.name}</h4>
                  <p className="text-sm text-gray-600">{scannedData.productInfo.brand}</p>
                  <p className="text-xs text-gray-500">{scannedData.productInfo.category}</p>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Price</p>
                <p className="text-xl font-bold text-blue-600">₱{scannedData.productInfo.price.toFixed(2)}</p>
              </div>
            </div>

            {/* Batch Information */}
            {scannedData.batchInfo && (
              <div className="space-y-3">
                <h5 className="font-semibold text-gray-900">Batch Information</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Batch Number</p>
                    <p className="font-semibold text-gray-900">{scannedData.batchInfo.batchNumber}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Remaining Quantity</p>
                    <p className="font-semibold text-gray-900">{scannedData.batchInfo.remainingQuantity}</p>
                  </div>
                  {scannedData.batchInfo.expirationDate && (
                    <div className="p-3 bg-red-50 rounded-lg col-span-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-red-600" />
                        <div>
                          <p className="text-xs text-gray-500">Expiration Date</p>
                          <p className="font-semibold text-red-600">
                            {format(new Date(scannedData.batchInfo.expirationDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Unit Cost</p>
                    <p className="font-semibold text-gray-900">₱{scannedData.batchInfo.unitCost?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Status</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      scannedData.batchInfo.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : scannedData.batchInfo.status === 'expired'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {scannedData.batchInfo.status === 'active' && <CheckCircle className="h-3 w-3" />}
                      {scannedData.batchInfo.status === 'expired' && <XCircle className="h-3 w-3" />}
                      {scannedData.batchInfo.status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* QR Code Info */}
            {scannedData.qrCodeInfo && scannedData.qrCodeInfo.expirationDate && (
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-yellow-600" />
                  <div>
                    <p className="text-xs text-gray-600">QR Code Expiration</p>
                    <p className="font-semibold text-yellow-800">
                      {format(new Date(scannedData.qrCodeInfo.expirationDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default QRCodeScanner;

