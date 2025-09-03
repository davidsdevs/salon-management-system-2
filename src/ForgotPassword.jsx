import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "./firebase"

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    
    // Basic validation
    if (!email.trim()) {
      setError("Please enter your email address.")
      return
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.")
      return
    }
    
    setIsLoading(true)

    try {
      console.log("🔍 Attempting to send password reset email to:", email)
      console.log("🌐 Action URL:", `${window.location.origin}/reset-password`)
      
      // Send password reset email with custom action URL
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: false
      })
      
      console.log("✅ Password reset email sent successfully")
      setSuccess("Password reset email sent successfully! Please check your inbox.")
      setEmailSent(true)
      setError("")
    } catch (error) {
      console.error("🚨 Password reset error:", error)
      console.error("Error code:", error.code)
      console.error("Error message:", error.message)
      setError(getErrorMessage(error.code))
    } finally {
      setIsLoading(false)
    }
  }

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case "auth/user-not-found":
        return "No account found with this email address."
      case "auth/invalid-email":
        return "Please enter a valid email address."
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later."
      case "auth/network-request-failed":
        return "Network error. Please check your connection and try again."
      case "auth/operation-not-allowed":
        return "Password reset is not enabled. Please contact support."
      default:
        return "Failed to send password reset email. Please try again."
    }
  }

  const getTroubleshootingTips = () => {
    return [
      "Check your spam/junk folder",
      "Verify the email address is correct",
      "Wait a few minutes for the email to arrive",
      "Check if your email provider is blocking Firebase emails",
      "Try using a different email address if available"
    ]
  }

  const handleBackToLogin = () => {
    navigate("/")
  }

  const handleResendEmail = () => {
    setEmailSent(false)
    setSuccess("")
    setError("")
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-[#160B53] mb-2 font-poppins">Forgot Password</h2>
          <p className="text-gray-600 font-poppins">Reset your David's Salon account password</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                <p className="text-green-700 text-sm font-medium">{success}</p>
              </div>
            </div>
          )}

          {!emailSent ? (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto bg-[#160B53] rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-white" />
                </div>
                <p className="text-gray-600 text-sm">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 font-poppins">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-transparent font-poppins"
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#160B53] hover:bg-[#2D1B69] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#160B53] transition-colors duration-200 font-poppins disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Check Your Email</h3>
                <p className="text-gray-600 text-sm">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <p className="text-gray-500 text-xs">
                  Click the link in the email to reset your password. The link will expire in 1 hour.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-700 text-sm">
                  <strong>Note:</strong> Check your spam folder if you don't see the email in your inbox.
                </p>
              </div>

              {/* Troubleshooting Tips */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-yellow-800 text-sm font-medium mb-2">Not receiving the email?</h4>
                <ul className="text-yellow-700 text-xs space-y-1">
                  {getTroubleshootingTips().map((tip, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-yellow-600 mr-2">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleResendEmail}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Resend Email
                </button>
                
                <button
                  onClick={handleBackToLogin}
                  className="w-full bg-[#160B53] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#2D1B69] transition-colors"
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={handleBackToLogin}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 font-poppins"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Sign In
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500 font-poppins">
          Need help? Contact our{" "}
          <a href="#" className="text-[#160B53] hover:text-[#2D1B69]">
            Support Team
          </a>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
