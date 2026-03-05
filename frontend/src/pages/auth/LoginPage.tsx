import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'

export default function LoginPage(){
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [loading,setLoading] = useState(false)
  const [error,setError] = useState<string | null>(null)
  const auth = useContext(AuthContext)!
  const nav = useNavigate()

  const submit = async(e:React.FormEvent)=>{
    e.preventDefault(); setLoading(true); setError(null)
    try{ await auth.login(email,password); nav('/') }catch(err:any){ setError(err?.response?.data?.message || 'Login failed') }
    finally{ setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md glass p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl font-semibold mb-4">PrimeMedical Login</h1>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600">Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full p-2 rounded border" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full p-2 rounded border" />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button className="w-full bg-primary text-white py-2 rounded" disabled={loading}>{loading? 'Signing in...':'Sign in'}</button>
        </form>
      </div>
    </div>
  )
}
