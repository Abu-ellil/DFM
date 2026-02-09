import Link from 'next/link'
import { ArrowRight, BarChart3, Users, Database, Shield, Zap, Gift } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Dates Factory Manager
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Comprehensive management system for your dates factory operations. Track customers,
            weighbridge data, crates, finance, and more - all in one place.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/trial-code"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 md:text-lg"
            >
              <Gift className="mr-2 w-5 h-5" />
              Get Free Trial
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 md:text-lg"
            >
              Login
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<BarChart3 className="w-8 h-8" />}
            title="Dashboard"
            description="Real-time overview of your factory operations with interactive charts and metrics"
          />
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="Customer Management"
            description="Track suppliers and customers with detailed profiles and transaction history"
          />
          <FeatureCard
            icon={<Database className="w-8 h-8" />}
            title="Data Sync"
            description="Automatic cloud synchronization with offline support for seamless operations"
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8" />}
            title="Secure"
            description="Enterprise-grade security with license-based authentication and data isolation"
          />
          <FeatureCard
            icon={<Zap className="w-8 h-8" />}
            title="Fast & Reliable"
            description="Built on modern technology for lightning-fast performance and reliability"
          />
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="Multi-Factory Support"
            description="Manage multiple factory locations with isolated databases and unified control"
          />
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-primary-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <StatCard number="1000+" label="Active Users" />
            <StatCard number="50+" label="Factories" />
            <StatCard number="1M+" label="Transactions" />
            <StatCard number="99.9%" label="Uptime" />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
        <p className="text-xl text-gray-600 mb-8">
          Join thousands of factory managers who trust Dates Factory Manager
        </p>
        <Link
          href="/register"
          className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:text-lg"
        >
          Create Account
          <ArrowRight className="ml-2 w-5 h-5" />
        </Link>
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
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="text-primary-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="text-4xl font-bold text-white mb-2">{number}</div>
      <div className="text-primary-100">{label}</div>
    </div>
  )
}
