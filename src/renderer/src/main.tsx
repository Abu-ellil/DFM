import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'

const rootElement = document.getElementById('root')
console.log('Root element:', rootElement)
console.log('window.api available:', typeof window.api !== 'undefined')

if (!rootElement) {
  console.error('Root element not found!')
  document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Root element not found!</div>'
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  )
}
