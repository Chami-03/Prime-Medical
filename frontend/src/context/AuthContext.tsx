import React, { createContext, useEffect, useState, ReactNode } from 'react'
import api from '../services/api'

type User = { id:number; email:string; roles:string[] }

type AuthContextType = {
  user: User | null
  token: string | null
  login: (email:string,password:string)=>Promise<void>
  logout: ()=>void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({children}:{children:ReactNode})=>{
  const [token,setToken] = useState<string | null>(localStorage.getItem('mc_token'))
  const [user,setUser] = useState<User | null>(null)

  useEffect(()=>{
    if(token){
      api.setToken(token)
      // fetch profile
      api.get('/api/auth/me').then(r=>setUser(r.data)).catch(()=>{
        setToken(null); setUser(null); localStorage.removeItem('mc_token')
      })
    }
  },[token])

  const login = async(email:string,password:string)=>{
    const res = await api.post('/api/auth/login',{email,password})
    const t = res.data.token
    setToken(t)
    localStorage.setItem('mc_token',t)
    api.setToken(t)
    const profile = await api.get('/api/auth/me')
    setUser(profile.data)
  }

  const logout = ()=>{
    setToken(null); setUser(null); localStorage.removeItem('mc_token'); api.setToken(null)
  }

  return <AuthContext.Provider value={{user,token,login,logout}}>{children}</AuthContext.Provider>
}
