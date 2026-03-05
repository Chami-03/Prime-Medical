import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PrivateRoute } from './routes/PrivateRoute'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/DashboardPage'

export default function App(){
  return (
    <AuthProvider>
      <Suspense fallback={<div className="p-6">Loading...</div>}>
        <Routes>
          <Route path="/login" element={<LoginPage/>} />
          <Route path="/" element={<PrivateRoute><DashboardPage/></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}
