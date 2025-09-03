import { useState, useEffect } from "react"
import { User, Mail, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { fetchSignInMethodsForEmail } from "firebase/auth"
import { auth } from "../../../firebase"

function PersonalInfoStep({ formData, updateFormData, onNext, onNavigateToLogin }) {
  const [errors, setErrors] = useState({})
  const [emailStatus, setEmailStatus] = useState("idle") // idle, checking, valid, invalid
  const [emailError, setEmailError] = useState("")

  // Check if email exists safely (without creating temp users)
  const checkEmailExists = async (email) => {
    if (!email || email.trim() === "") {
      setEmailStatus("idle")
      setEmailError("")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setEmailStatus("invalid")
      setEmailError("Please enter a valid email address")
      return
    }

    setEmailStatus("checking")
    setEmailError("")

    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, email)
      
      if (signInMethods.length === 0) {
        setEmailStatus("valid")
        setEmailError("")
      } else {
        setEmailStatus("invalid")
        setEmailError("An account with this email already exists")
      }
    } catch (error) {
      console.error("Error checking email:", error)
      setEmailStatus("invalid")
      setEmailError("Unable to verify email. Please try again later.")
    }
  }

  // Handle email input changes
  const handleEmailChange = (e) => {
    const email = e.target.value
    updateFormData({ email })

    if (!email.trim()) {
      setEmailStatus("idle")
      setEmailError("")
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        setEmailStatus("invalid")
        setEmailError("Please enter a valid email address")
      }
    }
  }

  // Debounce email validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.email) checkEmailExists(formData.email)
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [formData.email])

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    if (!formData.birthDate) newErrors.birthDate = "Birth date is required"
    if (!formData.gender) newErrors.gender = "Gender is required"
    if (emailStatus !== "valid") newErrors.email = "Please enter a valid and unique email address"

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) onNext()
  }

  const isNextButtonDisabled = () => {
    return (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.email.trim() ||
      !formData.birthDate ||
      !formData.gender ||
      emailStatus !== "valid"
    )
  }

  const getEmailInputClasses = () => {
    let base = "w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
    if (emailStatus === "valid") return base + " border-green-300 bg-green-50"
    if (emailStatus === "invalid") return base + " border-red-300 bg-red-50"
    if (emailStatus === "checking") return base + " border-blue-300 bg-blue-50"
    return base + " border-gray-300"
  }

  const renderEmailStatusIcon = () => {
    if (emailStatus === "checking") return <Loader2 className="absolute right-3 top-3 h-5 w-5 text-blue-500 animate-spin" />
    if (emailStatus === "valid") return <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-green-500" />
    if (emailStatus === "invalid") return <XCircle className="absolute right-3 top-3 h-5 w-5 text-red-500" />
    return null
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-[#160B53] mb-2">Personal Information</h2>
          <p className="text-gray-600">Please fill in the required information</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">First Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => updateFormData({ firstName: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
                />
              </div>
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Last Name</label>
              <input
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => updateFormData({ lastName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
              />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="email"
                placeholder="john.doe@example.com"
                value={formData.email}
                onChange={handleEmailChange}
                className={getEmailInputClasses()}
              />
              {renderEmailStatusIcon()}
            </div>
            {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            {emailStatus === "checking" && <p className="text-blue-500 text-xs mt-1">Checking email availability...</p>}
            {emailStatus === "valid" && <p className="text-green-500 text-xs mt-1">Email is available!</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Birth Date</label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => updateFormData({ birthDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
              />
              {errors.birthDate && <p className="text-red-500 text-xs mt-1">{errors.birthDate}</p>}
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => updateFormData({ gender: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isNextButtonDisabled()}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors mt-6 ${
              isNextButtonDisabled()
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-[#160B53] text-white hover:bg-[#2d1b69]"
            }`}
          >
            Next
          </button>
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

export default PersonalInfoStep
