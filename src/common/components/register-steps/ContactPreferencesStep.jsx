import { useState } from "react"
import { Phone } from "lucide-react"

function ContactPreferencesStep({ formData, updateFormData, onNext, onBack, onNavigateToLogin }) {
  const [errors, setErrors] = useState({})

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required"
    if (!formData.agreeToTerms) newErrors.agreeToTerms = "You must agree to the terms and privacy policy"

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      onNext()
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-[#160B53] mb-2">Contact & Preferences</h2>
          <p className="text-gray-600">Please fill in the required information</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="tel"
                placeholder="+63 912 345 6789"
                value={formData.phoneNumber}
                onChange={(e) => updateFormData({ phoneNumber: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
              />
            </div>
            {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
          </div>

          <div className="space-y-3">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={formData.receivePromotions}
                onChange={(e) => updateFormData({ receivePromotions: e.target.checked })}
                className="mt-1 w-4 h-4 text-[#160B53] border-gray-300 rounded focus:ring-[#160B53]"
              />
              <span className="text-sm text-gray-700">
                I would like to receive promotional emails, special offers, and updates from David's Salon
              </span>
            </label>

            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={(e) => updateFormData({ agreeToTerms: e.target.checked })}
                className="mt-1 w-4 h-4 text-[#160B53] border-gray-300 rounded focus:ring-[#160B53]"
              />
              <span className="text-sm text-gray-700">
                I agree to the{" "}
                <a href="#" className="text-[#160B53] font-medium hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-[#160B53] font-medium hover:underline">
                  Privacy Policy
                </a>
              </span>
            </label>
            {errors.agreeToTerms && <p className="text-red-500 text-xs mt-1">{errors.agreeToTerms}</p>}
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

export default ContactPreferencesStep
