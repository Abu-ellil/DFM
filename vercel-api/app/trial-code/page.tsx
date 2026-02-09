'use client'

import { useState } from 'react'
import { Gift, CheckCircle, Copy, Clock, AlertCircle, RefreshCw } from 'lucide-react'

export default function TrialCodePage() {
  const [trialCode, setTrialCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [expiryDate, setExpiryDate] = useState<Date | null>(null)

  const generateTrialCode = async () => {
    setLoading(true)
    setError('')
    setTrialCode('')
    setExpiryDate(null)

    try {
      // In production, this would call your API
      // For now, generating a trial code locally
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Generate a trial code (4 days)
      const code = generateLicenseCode()
      setTrialCode(code)
      setExpiryDate(new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)) // 4 days from now
    } catch (err) {
      setError('Failed to generate trial code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const generateLicenseCode = () => {
    // Generate a random 16-character code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) code += '-'
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code + '-4D' // 4D = 4 days trial
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(trialCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      setError('Failed to copy to clipboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-4">
              <Gift className="w-10 h-10 text-orange-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Free Trial Code</h1>
            <p className="text-gray-600 text-lg">Get a 4-day free trial to explore all features</p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <FeatureCard
              icon={<CheckCircle className="w-5 h-5" />}
              title="Full Access"
              description="All premium features"
            />
            <FeatureCard
              icon={<Clock className="w-5 h-5" />}
              title="4 Days"
              description="No credit card required"
            />
            <FeatureCard
              icon={<RefreshCw className="w-5 h-5" />}
              title="No Limits"
              description="Unlimited usage"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Trial Code Display */}
          {trialCode ? (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-6 border-2 border-orange-200">
                <div className="text-center">
                  <p className="text-sm font-medium text-orange-800 mb-2">Your Trial Code</p>
                  <div className="flex items-center justify-center gap-3">
                    <code className="text-2xl md:text-3xl font-mono font-bold text-orange-900 tracking-wider">
                      {trialCode}
                    </code>
                    <button
                      onClick={copyToClipboard}
                      className="p-2 hover:bg-orange-200 rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <Copy className="w-6 h-6 text-orange-700" />
                      )}
                    </button>
                  </div>
                  {expiryDate && (
                    <p className="text-sm text-orange-700 mt-3 flex items-center justify-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Expires: {expiryDate.toLocaleDateString()} at{' '}
                      {expiryDate.toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">How to Use:</h3>
                <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                  <li>Copy the trial code above</li>
                  <li>Open the Dates Factory Manager desktop app</li>
                  <li>Go to the Activation Screen</li>
                  <li>Enter the trial code and click "Activate"</li>
                  <li>Enjoy 4 days of full access!</li>
                </ol>
              </div>

              {/* Generate New Button */}
              <button
                onClick={generateTrialCode}
                disabled={loading}
                className="mt-6 w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Generate New Code
              </button>
            </div>
          ) : (
            /* Generate Button */
            <button
              onClick={generateTrialCode}
              disabled={loading}
              className="w-full flex justify-center items-center px-8 py-4 border border-transparent rounded-lg shadow-lg text-base font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating...
                </span>
              ) : (
                <span className="flex items-center">
                  <Gift className="w-5 h-5 mr-2" />
                  Generate Free Trial Code
                </span>
              )}
            </button>
          )}

          {/* Terms */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              By generating a trial code, you agree to our Terms of Service. Trial codes are valid
              for 4 days and provide full access to all features. No credit card required. One trial
              per device.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 mb-2">Already have a license?</p>
          <a href="/login" className="text-orange-600 font-semibold hover:text-orange-700">
            Sign in to your account
          </a>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-3">
        <div className="text-orange-600">{icon}</div>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}
