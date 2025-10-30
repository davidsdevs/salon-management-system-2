import React, { useState, useEffect } from 'react';
import { Card } from '../../pages/ui/card';
import { Button } from '../../pages/ui/button';
import { X, Star, Send } from 'lucide-react';
import { clientService } from '../../services/clientService';

const FeedbackModal = ({ isOpen, onClose, appointment, onSubmitSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
      setRating(0);
      setHoverRating(0);
      setFeedback('');
      setError('');
      onClose();
    }, 300);
  };

  if (!isOpen || !appointment) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please provide a rating');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Get client ID from appointment
      const clientId = appointment.clientId;
      
      if (!clientId) {
        throw new Error('Client ID not found');
      }

      // Find the service history entry for this appointment
      const history = await clientService.getServiceHistory(clientId);
      const appointmentHistory = history.find(h => h.appointmentId === appointment.id);

      if (appointmentHistory) {
        // Update existing history entry with rating and feedback
        await clientService.updateServiceHistory(clientId, appointmentHistory.id, {
          rating,
          feedback: feedback.trim()
        });
      } else {
        // Create new history entry (shouldn't normally happen)
        await clientService.addServiceHistory(clientId, {
          appointmentId: appointment.id,
          date: appointment.appointmentDate,
          services: appointment.serviceStylistPairs || [],
          stylist: appointment.serviceStylistPairs?.[0]?.stylistName || 'Stylist',
          totalAmount: 0, // Will be updated when transaction is processed
          rating,
          feedback: feedback.trim()
        });
      }

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }

      // Reset form
      setRating(0);
      setFeedback('');
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError('Failed to submit feedback: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-200 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <Card 
        className={`w-full max-w-md bg-white rounded-xl shadow-2xl transition-all duration-300 ease-out transform ${isAnimating ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-8 scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-[#160B53] to-[#2D1B69] rounded-t-xl">
          <h2 className="text-xl font-semibold text-white">Rate Your Experience</h2>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Appointment Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Service</p>
            <p className="font-semibold text-gray-900">
              {appointment.serviceStylistPairs?.map(s => s.serviceName).join(', ')}
            </p>
            <p className="text-sm text-gray-600 mt-2">Stylist</p>
            <p className="font-medium text-gray-900">
              {appointment.serviceStylistPairs?.[0]?.stylistName}
            </p>
          </div>

          {/* Rating Stars */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How would you rate your experience?
            </label>
            <div className="flex items-center justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= (hoverRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center mt-2 text-sm text-gray-600">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Feedback Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tell us more about your experience (Optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-transparent resize-none"
              placeholder="Share your thoughts about the service, stylist, or overall experience..."
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Skip for Now
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading || rating === 0}
              className="flex-1 bg-[#160B53] hover:bg-[#2D1B69] text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FeedbackModal;
