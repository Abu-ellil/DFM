'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Home,
  LayoutDashboard,
  Users,
  Settings,
  BarChart3,
  LogOut,
  Gift,
  LogIn
} from 'lucide-react'

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const userJson = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (userJson && token) {
      setUser(JSON.parse(userJson))
      setIsLoggedIn(true)
    } else {
      setUser(null)
      setIsLoggedIn(false)
    }
  }, [pathname])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsLoggedIn(false)
    setUser(null)
    router.push('/login')
  }

  const isActive = (path: string) => pathname === path

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-2xl font-bold text-primary-600">
                🏭 DFM
              </Link>
            </div>
            <div className="hidden sm:mr-6 sm:flex sm:space-x-8 sm:space-x-reverse">
              <Link
                href="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/')
                    ? 'border-primary-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Home className="w-4 h-4 ml-2" />
                الرئيسية
              </Link>

              {isLoggedIn && (
                <>
                  <Link
                    href="/dashboard"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive('/dashboard')
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 ml-2" />
                    لوحة التحكم
                  </Link>
                  <Link
                    href="/reports"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive('/reports')
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 ml-2" />
                    التقارير
                  </Link>
                </>
              )}

              {user?.role === 'admin' && (
                <Link
                  href="/admin"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/admin')
                      ? 'border-primary-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Users className="w-4 h-4 ml-2" />
                  الإدارة
                </Link>
              )}

              {!isLoggedIn && (
                <Link
                  href="/trial-code"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/trial-code')
                      ? 'border-primary-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Gift className="w-4 h-4 ml-2" />
                  نسخة تجريبية
                </Link>
              )}
            </div>
          </div>
          <div className="hidden sm:mr-6 sm:flex sm:items-center">
            {isLoggedIn ? (
              <>
                <Link
                  href="/settings"
                  className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/settings')
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="w-4 h-4 ml-2" />
                  الإعدادات
                </Link>
                <button
                  onClick={handleLogout}
                  className="mr-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 ml-2" />
                  خروج
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <LogIn className="w-4 h-4 ml-2" />
                تسجيل الدخول
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
