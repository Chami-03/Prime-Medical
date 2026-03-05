import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

export const PrivateRoute = ({children}:{children:JSX.Element})=>{
  const ctx = useContext(AuthContext)
  if(!ctx) return <Navigate to="/login" replace />
  if(!ctx.token) return <Navigate to="/login" replace />
  return children
}
