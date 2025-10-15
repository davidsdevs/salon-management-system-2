import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import Navigation from '../shared/Navigation';
import Footer from '../shared/Footer';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { resetPassword, clearError } = useAuth();

  const handleChange = (e) => {
    setEmail(e.target.value);
    
    // Clear error when user starts typing
    if (error) {
      setError('');
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      await resetPassword(email);
      setSuccess(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white pt-[122px]">
        <Navigation />
        
        <div className="flex items-center justify-center pt-8 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-[#160B53]">Check your email</h2>
              <p className="mt-2 text-center text-sm text-gray-600">We've sent a password reset link to {email}</p>
            </div>

            <Card className="p-8 border-0" style={{ boxShadow: '0 2px 15px 0 rgba(0, 0, 0, 0.25)' }}>
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                If you don't see the email in your inbox, check your spam folder.
              </p>
              
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                  variant="outline"
                  className="w-full border-[#160B53] text-[#160B53] hover:bg-[#160B53] hover:text-white"
                >
                  Try another email
                </Button>
                
                <Link
                  to="/login"
                  className="block w-full"
                >
                  <Button variant="outline" className="w-full border-[#160B53] text-[#160B53] hover:bg-[#160B53] hover:text-white">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to login
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-[122px]">
      <Navigation />
      
      <div className="flex items-center justify-center pt-8 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-center text-3xl font-extrabold text-[#160B53]">Reset your password</h2>
            <p className="mt-2 text-center text-sm text-gray-600">Enter your email address and we'll send you a link to reset your password</p>
          </div>

          <Card className="p-8 border-0" style={{ boxShadow: '0 2px 15px 0 rgba(0, 0, 0, 0.25)' }}>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={handleChange}
              />
            </div>

            <div>
              <Button
                type="submit"
                className="w-full bg-[#160B53] hover:bg-[#160B53]/90 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send reset link'}
              </Button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-medium text-[#160B53] hover:text-[#160B53]/80"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to login
              </Link>
            </div>
          </form>
        </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ForgotPassword;
