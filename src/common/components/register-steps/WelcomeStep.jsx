import { Check } from "lucide-react"

function WelcomeStep({ onNavigateToLogin }) {
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-[#160B53] mb-4">Welcome!</h2>

            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
              <Check className="h-8 w-8 text-green-600" />
            </div>

            <h3 className="text-xl font-semibold text-[#160B53] mb-4">Welcome to David's Salon</h3>
            <p className="text-gray-600 mb-6">
              Your account has been successfully created and verified! You can now sign in and start booking appointments.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
              <p className="text-green-700 text-sm">
                <strong>Success:</strong> Your email has been verified and your account is now active.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={onNavigateToLogin}
              className="w-full bg-[#160B53] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#2d1b69] transition-colors"
            >
              Sign in to Your Account
            </button>

            <button className="w-full bg-white border-2 border-[#160B53] text-[#160B53] py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              Book Your First Appointment
            </button>
          </div>

          <div className="pt-4">
            <a href="/" className="text-[#160B53] font-medium hover:underline">
              Return to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WelcomeStep
