import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Eye, EyeOff, CheckCircle, AlertCircle, Lock } from "lucide-react"
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth"
import { auth } from "./firebase"

const ResetPassword = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isValidCode, setIsValidCode] = useState(false)
  const [oobCode, setOobCode] = useState("")

  useEffect(() => {
    // Get the oobCode from URL parameters
    const code = searchParams.get("oobCode")
    if (code) {
      setOobCode(code)
      verifyResetCode(code)
    } else {
      setError("Invalid or missing reset link. Please request a new password reset.")
    }
  }, [searchParams])

  const verifyResetCode = async (code) => {
    try {
      await verifyPasswordResetCode(auth, code)
      setIsValidCode(true)
      setError("")
    } catch (error) {
      console.error("Invalid reset code:", error)
      setError("This password reset link is invalid or has expired. Please request a new one.")
      setIsValidCode(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    
    // Basic validation
    if (!password.trim()) {
      setError("Please enter a new password.")
      return
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.")
      return
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    
    setIsLoading(true)

    try {
      await confirmPasswordReset(auth, oobCode, password)
      setSuccess("Password reset successfully! You can now sign in with your new password.")
      setError("")
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/")
      }, 3000)
      
    } catch (error) {
      console.error("Password reset error:", error)
      setError(getErrorMessage(error.code))
    } finally {
      setIsLoading(false)
    }
  }

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case "auth/expired-action-code":
        return "This password reset link has expired. Please request a new one."
      case "auth/invalid-action-code":
        return "Invalid reset link. Please request a new password reset."
      case "auth/weak-password":
        return "Password is too weak. Please choose a stronger password."
      case "auth/network-request-failed":
        return "Network error. Please check your connection and try again."
      default:
        return "Failed to reset password. Please try again."
    }
  }

  const handleBackToLogin = () => {
    navigate("/")
  }

  if (!isValidCode) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-[#160B53] mb-2 font-poppins">Invalid Reset Link</h2>
            <p className="text-gray-600 font-poppins">This password reset link is not valid</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Link Invalid or Expired</h3>
                <p className="text-gray-600 text-sm">
                  The password reset link you clicked is invalid or has expired.
                </p>
                <p className="text-gray-500 text-xs">
                  Password reset links expire after 1 hour for security reasons.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate("/forgot-password")}
                  className="w-full bg-[#160B53] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#2D1B69] transition-colors"
                >
                  Request New Reset Link
                </button>
                
                <button
                  onClick={handleBackToLogin}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Back to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-[#160B53] mb-2 font-poppins">Reset Password</h2>
          <p className="text-gray-600 font-poppins">Create a new password for your account</p>
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

          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto bg-[#160B53] rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <p className="text-gray-600 text-sm">
              Enter your new password below. Make sure it's secure and memorable.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 font-poppins">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-transparent pr-12 font-poppins"
                  placeholder="Enter new password"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2 font-poppins">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-transparent pr-12 font-poppins"
                  placeholder="Confirm new password"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
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
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={handleBackToLogin}
              className="text-sm text-gray-600 hover:text-gray-900 font-poppins"
            >
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

export default ResetPassword
