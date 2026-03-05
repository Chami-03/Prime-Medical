import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  Users, Calendar, Box, TrendingUp, AlertTriangle,
  Activity, CheckCircle2, ChevronRight, ArrowUpRight,
} from 'lucide-react'
import { appointmentApi } from '../../api/appointmentApi'
import { inventoryApi }   from '../../api/inventoryApi'
import { staffApi }        from '../../api/staffApi'

function getRange(daysBack) {
  const end = new Date(); const start = new Date()
  start.setDate(end.getDate() - daysBack)
  return { startDate: start.toLocaleDateString('en-CA'), endDate: end.toLocaleDateString('en-CA') }
}
function toMonth(v) {
  if (!v) return ''
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
}
function unwrap(p) { return Array.isArray(p) ? p : Array.isArray(p?.data) ? p.data : [] }

const STATUS_COLORS = {
  COMPLETED: '#10b981', SCHEDULED: '#3b82f6', CANCELLED: '#ef4444',
  CONFIRMED: '#6366f1', RESCHEDULED: '#f59e0b', PENDING: '#9ca3af',
}

const CHART_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#6366f1','#14b8a6']

function SummaryCard({ label, value, icon: Icon, color, to, sub }) {
  const content = (
    <div className="stat-card flex flex-col gap-3 cursor-pointer group hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} strokeWidth={2} />
        </div>
        <ArrowUpRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div>
        <p className="kpi-value">{typeof value === 'number' ? value.toLocaleString() : (value ?? '')}</p>
        <p className="kpi-label">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
  return to ? <Link to={to}>{content}</Link> : content
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-medium" style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const r30 = getRange(30)
  const r90 = getRange(90)

  const { data: apptRes30 }  = useQuery({ queryKey: ['admin-appts-30'],  queryFn: () => appointmentApi.getAll(r30), staleTime: 60000 })
  const { data: apptRes90 }  = useQuery({ queryKey: ['admin-appts-90'],  queryFn: () => appointmentApi.getAll(r90), staleTime: 60000 })
  const { data: inventoryRes } = useQuery({ queryKey: ['admin-inventory'], queryFn: () => inventoryApi.getAll(),    staleTime: 60000 })
  const { data: alertsRes }    = useQuery({ queryKey: ['admin-alerts'],    queryFn: () => inventoryApi.getAlerts(),  staleTime: 60000 })
  const { data: staffRes }     = useQuery({ queryKey: ['admin-staff'],     queryFn: () => staffApi.getAll(),         staleTime: 60000 })
  const { data: lowStockRes }  = useQuery({ queryKey: ['admin-low-stock'], queryFn: () => inventoryApi.getLowStock(), staleTime: 60000 })
  const { data: expiringRes }  = useQuery({ queryKey: ['admin-expiring'],  queryFn: () => inventoryApi.getExpiring(), staleTime: 60000 })

  const appts30    = unwrap(apptRes30)
  const appts90    = unwrap(apptRes90)
  const inventory  = unwrap(inventoryRes)
  const staff      = unwrap(staffRes)
  const lowStock   = unwrap(lowStockRes)
  const expiring   = unwrap(expiringRes)
  const alerts     = alertsRes?.data || {}

  /*  Appointment status pie  */
  const statusPie = useMemo(() => {
    const counts = {}
    appts30.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [appts30])

  /*  Monthly appointments line chart  */
  const monthlyData = useMemo(() => {
    const months = {}
    appts90.forEach(a => {
      const m = toMonth(a?.appointmentTime || a?.slotTime)
      if (m) months[m] = (months[m] || 0) + 1
    })
    return Object.entries(months)
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([key, count]) => {
        const [y, mo] = key.split('-')
        return { month: new Date(+y, +mo-1).toLocaleDateString('en-US',{month:'short'}), count }
      })
  }, [appts90])

  /*  Staff by role bar chart  */
  const staffByRole = useMemo(() => {
    const counts = {}
    staff.forEach(s => { const r = s.role || s.user?.role || 'Unknown'; counts[r] = (counts[r]||0)+1 })
    return Object.entries(counts).map(([role, count]) => ({ role: role.replace('ROLE_',''), count }))
  }, [staff])

  /*  Inventory category  */
  const inventoryByCategory = useMemo(() => {
    const counts = {}
    inventory.forEach(i => { const c = i.category || 'Uncategorized'; counts[c] = (counts[c]||0)+1 })
    return Object.entries(counts).slice(0,6).map(([name, value]) => ({ name, value }))
  }, [inventory])

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics &amp; Reports</h1>
          <p className="page-subtitle">System-wide metrics and operational insights</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="status-dot-live" />
          <span className="text-xs text-muted-foreground">Live data</span>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Appointments (30d)"
          value={appts30.length}
          icon={Calendar}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          to="/appointments"
        />
        <SummaryCard
          label="Active Staff"
          value={staff.length}
          icon={Users}
          color="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
          to="/staff"
        />
        <SummaryCard
          label="Inventory Items"
          value={inventory.length}
          icon={Box}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          to="/inventory"
          sub={`${lowStock.length} low stock`}
        />
        <SummaryCard
          label="Inventory Alerts"
          value={(alerts.lowStockCount || 0) + (alerts.expiringCount || 0)}
          icon={AlertTriangle}
          color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          to="/inventory"
          sub={`${alerts.expiringCount || 0} expiring`}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Monthly trend */}
        <div className="pm-card p-5 lg:col-span-3">
          <div className="mb-4">
            <p className="text-sm font-semibold text-foreground">Appointment Trend</p>
            <p className="text-xs text-muted-foreground">Monthly volume  last 3 months</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData} margin={{ top:4, right:4, left:-24, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize:11 }} tickLine={false} axisLine={false} />
              <YAxis   tick={{ fontSize:11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2.5}
                    dot={{ r:4, fill:'#3b82f6', strokeWidth:0 }} activeDot={{ r:6, strokeWidth:0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Appointment status pie */}
        <div className="pm-card p-5 lg:col-span-2">
          <div className="mb-4">
            <p className="text-sm font-semibold text-foreground">Appointment Status</p>
            <p className="text-xs text-muted-foreground">Last 30 days breakdown</p>
          </div>
          {statusPie.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-xs text-muted-foreground">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                  {statusPie.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] || CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Staff by role */}
        <div className="pm-card p-5">
          <div className="mb-4">
            <p className="text-sm font-semibold text-foreground">Staff Distribution</p>
            <p className="text-xs text-muted-foreground">Headcount by role</p>
          </div>
          {staffByRole.length === 0 ? (
            <div className="flex items-center justify-center h-[180px] text-xs text-muted-foreground">No staff data</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={staffByRole} layout="vertical" margin={{ top:4, right:4, left:60, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize:11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="role" tick={{ fontSize:11 }} tickLine={false} axisLine={false} width={55} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" fill="#6366f1" radius={[0,4,4,0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Inventory by category */}
        <div className="pm-card p-5">
          <div className="mb-4">
            <p className="text-sm font-semibold text-foreground">Inventory by Category</p>
            <p className="text-xs text-muted-foreground">Top medicine categories</p>
          </div>
          {inventoryByCategory.length === 0 ? (
            <div className="flex items-center justify-center h-[180px] text-xs text-muted-foreground">No inventory data</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={inventoryByCategory} margin={{ top:4, right:4, left:-24, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize:10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize:11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" fill="#10b981" radius={[4,4,0,0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Alerts section */}
      {(lowStock.length > 0 || expiring.length > 0) && (
        <div className="pm-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Active Inventory Alerts</p>
              <p className="text-xs text-muted-foreground">{lowStock.length} low stock  {expiring.length} expiring soon</p>
            </div>
            <Link to="/inventory" className="btn-ghost btn-sm text-primary flex items-center gap-1">
              Manage inventory <ChevronRight size={13} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...lowStock.slice(0,4), ...expiring.slice(0,4)].slice(0,8).map((item, i) => (
              <div key={item.id || i} className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/40 border border-border">
                <AlertTriangle size={14} className={lowStock.includes(item) ? 'text-red-500' : 'text-amber-500'} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{item.medicineName || item.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {lowStock.includes(item) ? `Stock: ${item.quantity}` : `Exp: ${item.expiryDate}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}