
import Navigation from '@/components/Navigation'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Settings className="w-10 h-10 text-orange-500" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-4">Account Settings</h1>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            Manage your cloud profile, notification preferences, and factory connections here soon.
          </p>
          <div className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold">
            Feature under development
          </div>
        </div>
      </div>
    </main>
  )
}
