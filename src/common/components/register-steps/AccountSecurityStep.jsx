import { useState } from "react"
import { Eye, EyeOff, Lock, Check, Circle } from "lucide-react"

function AccountSecurityStep({ formData, updateFormData, onNext, onBack, onNavigateToLogin }) {
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
    }
    return requirements
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else {
      const requirements = validatePassword(formData.password)
      if (!requirements.length || !requirements.uppercase || !requirements.lowercase || !requirements.number) {
        newErrors.password = "Password does not meet requirements"
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      onNext()
    }
  }

  const passwordRequirements = validatePassword(formData.password)

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-[#160B53] mb-2">Account Security</h2>
          <p className="text-gray-600">Please fill in the required information</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => updateFormData({ password: e.target.value })}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</h3>
            <ul className="text-xs space-y-1">
              <li className={`flex items-center ${passwordRequirements.length ? "text-green-600" : "text-gray-500"}`}>
                {passwordRequirements.length ? <Check className="h-3 w-3 mr-2" /> : <Circle className="h-3 w-3 mr-2" />}
                At least 8 characters
              </li>
              <li
                className={`flex items-center ${passwordRequirements.uppercase ? "text-green-600" : "text-gray-500"}`}
              >
                {passwordRequirements.uppercase ? (
                  <Check className="h-3 w-3 mr-2" />
                ) : (
                  <Circle className="h-3 w-3 mr-2" />
                )}
                One uppercase letter
              </li>
              <li
                className={`flex items-center ${passwordRequirements.lowercase ? "text-green-600" : "text-gray-500"}`}
              >
                {passwordRequirements.lowercase ? (
                  <Check className="h-3 w-3 mr-2" />
                ) : (
                  <Circle className="h-3 w-3 mr-2" />
                )}
                One lowercase letter
              </li>
              <li className={`flex items-center ${passwordRequirements.number ? "text-green-600" : "text-gray-500"}`}>
                {passwordRequirements.number ? <Check className="h-3 w-3 mr-2" /> : <Circle className="h-3 w-3 mr-2" />}
                One number
              </li>
            </ul>
          </div>

          <div className="flex space-x-4 mt-6">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#160B53] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#2d1b69] transition-colors"
            >
              Next
            </button>
          </div>
        </form>

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

export default AccountSecurityStep
