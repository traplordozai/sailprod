/**
 * File: frontend/src/index.tsx
 * Purpose: Application entry point
 */

import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'

try {
  // Get the root element
  const container = document.getElementById('root')
  if (!container) {
    throw new Error('Root element not found in the document')
  }
  
  // Create root and render
  const root = ReactDOM.createRoot(container)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
  
  console.log('React app rendered successfully!')
} catch (error) {
  // Display any startup errors
  console.error('React initialization error:', error)
  
  // Add visible error display
  const errorDiv = document.createElement('div')
  errorDiv.style.padding = '20px'
  errorDiv.style.margin = '20px'
  errorDiv.style.backgroundColor = '#FEE2E2'
  errorDiv.style.border = '1px solid #EF4444'
  errorDiv.style.borderRadius = '6px'
  errorDiv.style.color = '#B91C1C'
  errorDiv.style.fontFamily = 'system-ui, sans-serif'
  
  errorDiv.innerHTML = `
    <h1 style="font-size: 24px; margin-bottom: 10px;">React Initialization Error</h1>
    <pre style="white-space: pre-wrap;">${error instanceof Error ? error.message : String(error)}</pre>
  `
  
  // Ensure body exists
  if (document.body) {
    document.body.appendChild(errorDiv)
  } else {
    window.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(errorDiv)
    })
  }
}
