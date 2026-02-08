import React, { Component } from 'react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-red-600 mb-4">حدث خطأ</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              حدث خطأ أثناء تشغيل التطبيق
            </p>
            {this.state.error && (
              <details className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <summary className="cursor-pointer text-sm font-medium">عرض التفاصيل</summary>
                <pre className="mt-2 text-xs overflow-auto max-h-40">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
