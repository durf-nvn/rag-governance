import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { router } from './app/routes'
import './app/styles/index.css'
import axios from 'axios'

// Security Hardening Phase 2: Automatically send HttpOnly authentication cookies with all requests
axios.defaults.withCredentials = true;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)