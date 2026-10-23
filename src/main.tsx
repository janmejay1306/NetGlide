import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/tailwind.css'  // Loads Tailwind + your custom styles
import './lib/cef-bridge'


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)