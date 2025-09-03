import { useState, useEffect } from "react"
import { Mail, Check, RefreshCw, Clock } from "lucide-react"
import { sendOTPEmail, generateOTP } from "../../../brevo"

function EmailVerificationStep({ formData, onNext, onBack, onNavigateToLogin, isLoading }) {
  const [verificationSent, setVerificationSent] = useState(false)
  const [otp, setOtp] = useState("")
  const [userOtp, setUserOtp] = useState("")
  const [otpExpiry, setOtpExpiry] = useState(null)
  const [otpError, setOtpError] = useState("")
  const [sendingOtp, setSendingOtp] = useState(false)

  const handleSendVerification = async () => {
    try {
      setSendingOtp(true)
      setOtpError("")
      
      // Generate new OTP
      const newOtp = generateOTP()
      setOtp(newOtp)
      
      // Set OTP expiry (10 minutes from now)
      const expiryTime = new Date(Date.now() + 10 * 60 * 1000)
      setOtpExpiry(expiryTime)
      
      // Send OTP email via Brevo
      await sendOTPEmail(formData.email, newOtp, formData.firstName)
      
    setVerificationSent(true)
      setUserOtp("") // Clear previous OTP input
      
    } catch (error) {
      console.error("Failed to send OTP:", error)
      setOtpError("Failed to send verification email. Please try again.")
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyEmail = async (e) => {
  if (e && e.preventDefault) e.preventDefault(); // Prevent form reload if any

  // Validate that all required fields are filled
  const requiredFields = ['firstName', 'lastName', 'email', 'birthDate', 'gender', 'password', 'phoneNumber'];
  const missingFields = requiredFields.filter(field => !formData[field]);

  if (missingFields.length > 0) {
    alert(`Please complete all required fields: ${missingFields.join(', ')}`);
    return;
  }

  if (!formData.agreeToTerms) {
    alert("Please agree to the terms and conditions");
    return;
  }

  // Validate OTP
  if (!userOtp) {
    setOtpError("Invalid verification code. Please try again.");
    return;
  }

  if (userOtp !== otp) {
    setOtpError("Invalid verification code. Please try again.");
    return;
  }

  // Check if OTP has expired
  if (otpExpiry && new Date() > otpExpiry) {
    setOtpError("Verification code has expired. Please request a new one.");
    return;
  }

  setOtpError("");

  try {
    await onNext(); // Ensure async registration completes before moving to step 5
  } catch (err) {
    console.error("Error during registration:", err);
    setOtpError("Registration failed. Please try again.");
  }
};

  // Countdown timer for OTP expiry
  const [timeLeft, setTimeLeft] = useState(0)
  
  useEffect(() => {
    if (!otpExpiry) return
    
    const timer = setInterval(() => {
      const now = new Date()
      const diff = Math.max(0, Math.floor((otpExpiry - now) / 1000))
      setTimeLeft(diff)
      
      if (diff === 0) {
        clearInterval(timer)
      }
    }, 1000)
    
    return () => clearInterval(timer)
  }, [otpExpiry])
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-[#160B53] mb-2">Email Verification</h2>
          <p className="text-gray-600">Please fill in the required information</p>
        </div>

        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-[#160B53] rounded-full flex items-center justify-center">
            <Mail className="h-8 w-8 text-white" />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-[#160B53] mb-2">Verify Your Email</h3>
            <p className="text-gray-600 mb-2">
               We'll send a verification code to <strong>{formData.email}</strong>
             </p>
             <p className="text-sm text-gray-500 mb-4">
               Enter the 6-digit code below to complete your registration.
             </p>
             <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
               <p className="text-blue-700 text-sm">
                 <strong>Note:</strong> The verification code will be sent to your email. 
                 Check your spam folder if you don't see it in your inbox.
               </p>
             </div>
          </div>

          {!verificationSent ? (
            <div className="space-y-3">
            <button
              onClick={handleSendVerification}
                disabled={sendingOtp}
                className="w-full bg-[#160B53] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#2d1b69] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {sendingOtp ? "Sending..." : "Send Verification Code"}
            </button>
              

            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700 text-sm flex items-center justify-center">
                  <Check className="h-4 w-4 mr-2" />
                  Verification code sent successfully!
                </p>
              </div>
              
              {/* OTP Input */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 text-center">
                  Enter the 6-digit code sent to your email
                </label>
                <input
                  type="text"
                  value={userOtp}
                  onChange={(e) => setUserOtp(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-lg font-mono tracking-widest focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
                />
                {otpError && (
                  <p className="text-red-600 text-sm text-center">{otpError}</p>
                )}
              </div>
              
              {/* Countdown Timer */}
              {otpExpiry && timeLeft > 0 && (
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  Code expires in: {formatTime(timeLeft)}
                </div>
              )}
              
              {/* Resend Option */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">Didn't receive the code?</p>
                <button
                  onClick={handleSendVerification}
                  disabled={timeLeft > 0}
                  className="inline-flex items-center text-[#160B53] hover:text-[#2d1b69] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {timeLeft > 0 ? `Resend in ${formatTime(timeLeft)}` : "Resend Code"}
                </button>
              </div>
              <button
                onClick={handleVerifyEmail}
                disabled={isLoading}
                className="w-full bg-[#160B53] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#2d1b69] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              onClick={onBack}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Back
            </button>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">
            Already have an account?{" "}
            <button type="button" onClick={onNavigateToLogin} className="text-[#160B53] font-medium hover:underline">
              Sign in Here
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default EmailVerificationStep
