import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './components/App'
import GlobalStyles from './GlobalStyles'
import reportWebVitals from './reportWebVitals'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const root = ReactDOM.createRoot(document.getElementById('sk-root'))
const queryClient = new QueryClient()
root.render(
  <React.StrictMode>
    <GlobalStyles />
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
