import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, Tooltip } from 'recharts'

export default function DashboardPage(){
  const [summary,setSummary] = useState<any>(null)

  useEffect(()=>{
    api.get('/api/dashboard/summary').then(r=>setSummary(r.data)).catch(()=>{})
  },[])

  return (
    <div className="p-6">
      <h2 className="text-2xl font-medium mb-4">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 glass rounded shadow">Total Patients<br/><div className="text-2xl font-bold">{summary?.totalPatients ?? '—'}</div></div>
        <div className="p-4 glass rounded shadow">Today's Appointments<br/><div className="text-2xl font-bold">{summary?.todaysAppointments ?? '—'}</div></div>
        <div className="p-4 glass rounded shadow">Monthly Revenue<br/><div className="text-2xl font-bold">{summary?.monthlyRevenue ?? '—'}</div></div>
        <div className="p-4 glass rounded shadow">Low Stock Alerts<br/><div className="text-2xl font-bold">{summary?.lowStock ?? '—'}</div></div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 glass rounded shadow h-64">
          <h3 className="mb-2">Appointments (30 days)</h3>
          <ResponsiveContainer width="100%" height="90%"><LineChart data={summary?.appointments || []}><XAxis dataKey="date" /><YAxis /><Tooltip /><Line dataKey="count" stroke="#2b7cff" /></LineChart></ResponsiveContainer>
        </div>
        <div className="p-4 glass rounded shadow h-64">
          <h3 className="mb-2">Revenue (monthly)</h3>
          <ResponsiveContainer width="100%" height="90%"><BarChart data={summary?.revenue || []}><XAxis dataKey="month" /><YAxis /><Tooltip /><Bar dataKey="amount" fill="#4fb07f" /></BarChart></ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
