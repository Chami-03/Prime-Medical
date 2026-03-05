import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Calendar, Users, CreditCard, Activity, Pill, Box,
  ChevronRight, UserPlus, TrendingUp, TrendingDown, Minus,
  Clock, CheckCircle2, AlertTriangle, Stethoscope, HeartPulse,
  Package, ArrowUpRight,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts'
import { useAuth, RoleProtected } from '../context/AuthContext'
import { appointmentApi } from '../api/appointmentApi'
import { queueApi } from '../api/queueApi'
import { inventoryApi } from '../api/inventoryApi'
import Badge from '../components/common/Badge'

/*  helpers  */
function unwrapList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

function toDateKey(value) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-CA')
}

function toMonthKey(value) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getDateRange(daysBack = 6) {
  const end   = new Date()
  const start = new Date(); start.setDate(end.getDate() - daysBack)
  return { start: start.toLocaleDateString('en-CA'), end: end.toLocaleDateString('en-CA') }
}

function getMonthRange(monthsBack = 5) {
  const end   = new Date()
  const start = new Date(end.getFullYear(), end.getMonth() - monthsBack, 1)
  return { start: start.toLocaleDateString('en-CA'), end: end.toLocaleDateString('en-CA') }
}

function countByStatus(list, statuses) {
  return list.filter(item => statuses.includes(item?.status)).length
}

function deriveTrend(current, previous) {
  return current > previous ? 'up' : current < previous ? 'down' : 'same'
}

function formatChange(current, previous) {
  const d = current - previous
  return d === 0 ? '0' : `${d > 0 ? '+' : ''}${d}`
}

/*  sub-components  */
function TrendBadge({ trend, change }) {
  if (trend === 'up')   return <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-full px-2 py-0.5"><TrendingUp size={9}/>{change}</span>
  if (trend === 'down') return <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-full px-2 py-0.5"><TrendingDown size={9}/>{change}</span>
  return <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5"><Minus size={9}/>{change}</span>
}

function StatCard({ label, value, icon: Icon, trend, change, accent, accentBg }) {
  return (
    <div className={`stat-card ${accentBg || ''} flex flex-col gap-3 group hover:shadow-md transition-all duration-200`}>
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon size={18} strokeWidth={2} />
        </div>
        <TrendBadge trend={trend} change={change} />
      </div>
      <div>
        <p className="kpi-value text-3xl">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        <p className="kpi-label">{label}</p>
      </div>
    </div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-primary font-bold mt-0.5">{payload[0].value}</p>
    </div>
  )
}

function QuickAction({ to, icon: Icon, label, desc, color }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-muted/60
                 border border-transparent hover:border-border transition-all duration-150"
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{label}</p>
        {desc && <p className="text-xs text-muted-foreground truncate">{desc}</p>}
      </div>
      <ArrowUpRight size={13} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
    </Link>
  )
}

function QueueRow({ entry }) {
  const time = entry?.checkedInAt
    ? new Date(entry.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--'
  const isActive = entry?.status === 'IN_CONSULTATION'

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors
                     ${isActive ? 'bg-primary/5 border border-primary/15' : 'hover:bg-muted/50'}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0
                       ${isActive ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
        {entry?.queueNumber || '#'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{entry?.patientName || 'Unknown Patient'}</p>
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Clock size={9} /> {time}
          {entry?.visitType && <>  {entry.visitType}</>}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {entry?.priority === 'EMERGENCY' && <span className="badge-red text-[10px]">Emergency</span>}
        <Badge status={entry?.status} />
      </div>
    </div>
  )
}

/* 
   MAIN DASHBOARD
 */
export default function Dashboard() {
  const { user, hasRole } = useAuth()

  const role       = ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PHARMACIST', 'PATIENT', 'NURSE'].find(r => hasRole(r))
  const isPatient  = hasRole('PATIENT')
  const isDoctor   = hasRole('DOCTOR')
  const isNurse    = hasRole('NURSE')
  const showCharts = isDoctor || hasRole('RECEPTIONIST') || hasRole('ADMIN')
  const showQueue  = isDoctor || hasRole('NURSE') || hasRole('RECEPTIONIST')
  const doctorId   = user?.id

  const todayDate  = new Date().toLocaleDateString('en-CA')
  const weekRange  = getDateRange(6)
  const monthRange = getMonthRange(5)

  const { data: todayAppointmentsRes } = useQuery({
    queryKey: ['dashboard-appointments-today', role, doctorId, todayDate],
    queryFn:  () => {
      if (isPatient) return appointmentApi.getMyCalendar(todayDate)
      if (isDoctor && doctorId) return appointmentApi.getCalendar(doctorId, todayDate)
      return appointmentApi.getAll({ startDate: todayDate, endDate: todayDate,
        ...(isDoctor && doctorId ? { doctorId } : {}),
      })
    },
    refetchInterval: 10000,
  })

  const { data: weekAppointmentsRes } = useQuery({
    queryKey: ['dashboard-appointments-week', role, doctorId, weekRange.start, weekRange.end],
    queryFn: () => appointmentApi.getAll({ startDate: weekRange.start, endDate: weekRange.end,
      ...(isDoctor && doctorId ? { doctorId } : {}),
    }),
    enabled: showCharts,
    refetchInterval: 10000,
  })

  const { data: monthAppointmentsRes } = useQuery({
    queryKey: ['dashboard-appointments-months', role, doctorId, monthRange.start, monthRange.end],
    queryFn: () => appointmentApi.getAll({ startDate: monthRange.start, endDate: monthRange.end,
      ...(isDoctor && doctorId ? { doctorId } : {}),
    }),
    enabled: showCharts,
    refetchInterval: 10000,
  })

  const { data: queueRes } = useQuery({
    queryKey: ['dashboard-today-queue'],
    queryFn:  () => queueApi.getToday(),
    enabled:  showQueue || isNurse,
    refetchInterval: 10000,
  })

  const { data: lowStockRes } = useQuery({
    queryKey: ['dashboard-low-stock'],
    queryFn:  () => inventoryApi.getLowStock(),
    enabled:  hasRole('PHARMACIST') || hasRole('ADMIN'),
    refetchInterval: 20000,
  })

  const todayAppointments  = unwrapList(todayAppointmentsRes)
  const weekAppointments   = unwrapList(weekAppointmentsRes)
  const monthAppointments  = unwrapList(monthAppointmentsRes)
  const queueEntries       = unwrapList(queueRes)
  const lowStockItems      = unwrapList(lowStockRes)

  const waitingCount        = queueEntries.filter(e => ['WAITING', 'VITALS_PENDING', 'READY'].includes(e?.status)).length
  const inConsultationCount = queueEntries.filter(e => e?.status === 'IN_CONSULTATION').length
  const completedQueueCount = queueEntries.filter(e => e?.status === 'COMPLETED').length

  const patientUpcoming = todayAppointments
    .filter(a => ['SCHEDULED', 'CONFIRMED'].includes(a?.status) &&
      new Date(a?.appointmentTime || a?.slotTime || 0) >= new Date())
    .sort((a, b) => new Date(a?.appointmentTime || 0) - new Date(b?.appointmentTime || 0))
  const nextAppointment = patientUpcoming[0] || null

  /*  Stats per role  */
  const stats = useMemo(() => {
    const yesterday    = new Date(); yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayKey = yesterday.toLocaleDateString('en-CA')
    const yesterdayAppts = weekAppointments.filter(a =>
      toDateKey(a?.appointmentTime || a?.slotTime) === yesterdayKey
    )

    const totalToday     = todayAppointments.length
    const totalYesterday = yesterdayAppts.length
    const confirmedToday = countByStatus(todayAppointments, ['CONFIRMED'])
    const confirmedYest  = countByStatus(yesterdayAppts, ['CONFIRMED'])
    const pendingToday   = countByStatus(todayAppointments, ['PENDING', 'REQUESTED'])
    const pendingYest    = countByStatus(yesterdayAppts, ['PENDING', 'REQUESTED'])
    const resched        = countByStatus(todayAppointments, ['RESCHEDULED'])
    const reschedYest    = countByStatus(yesterdayAppts, ['RESCHEDULED'])

    if (role === 'DOCTOR') {
      return [
        { label: "Today's Appointments", value: totalToday,         icon: Calendar,    trend: deriveTrend(totalToday, totalYesterday),   change: formatChange(totalToday, totalYesterday),   accent: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',   accentBg: 'stat-card-blue' },
        { label: 'Confirmed Slots',       value: confirmedToday,     icon: CheckCircle2, trend: deriveTrend(confirmedToday, confirmedYest), change: formatChange(confirmedToday, confirmedYest), accent: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400', accentBg: 'stat-card-purple' },
        { label: 'Patients Waiting',      value: waitingCount,       icon: Users,       trend: 'same', change: 'Live', accent: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',   accentBg: 'stat-card-amber' },
        { label: 'In Consultation',       value: inConsultationCount,icon: Stethoscope, trend: 'same', change: 'Live', accent: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', accentBg: 'stat-card-green' },
      ]
    }
    if (role === 'NURSE') {
      return [
        { label: "Today's Appointments", value: totalToday,         icon: Calendar,    trend: deriveTrend(totalToday, totalYesterday), change: formatChange(totalToday, totalYesterday), accent: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', accentBg: 'stat-card-blue' },
        { label: 'Patients Waiting',     value: waitingCount,       icon: Users,       trend: 'same', change: 'Live', accent: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', accentBg: 'stat-card-amber' },
        { label: 'In Consultation',      value: inConsultationCount,icon: Stethoscope, trend: 'same', change: 'Live', accent: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', accentBg: 'stat-card-green' },
        { label: 'Completed',            value: completedQueueCount,icon: CheckCircle2,trend: 'same', change: 'Live', accent: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400', accentBg: 'stat-card-purple' },
      ]
    }
    if (role === 'RECEPTIONIST') {
      return [
        { label: "Today's Appointments", value: totalToday,         icon: Calendar,     trend: deriveTrend(totalToday, totalYesterday), change: formatChange(totalToday, totalYesterday), accent: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', accentBg: 'stat-card-blue' },
        { label: 'Pending Confirmation', value: pendingToday,        icon: Clock,        trend: deriveTrend(pendingToday, pendingYest), change: formatChange(pendingToday, pendingYest), accent: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', accentBg: 'stat-card-amber' },
        { label: 'Checked In',           value: completedQueueCount, icon: CheckCircle2, trend: 'same', change: 'Live', accent: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', accentBg: 'stat-card-green' },
        { label: 'Reschedules',          value: resched,             icon: Activity,     trend: deriveTrend(resched, reschedYest), change: formatChange(resched, reschedYest), accent: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400', accentBg: 'stat-card-purple' },
      ]
    }
    if (role === 'PHARMACIST') {
      return [
        { label: 'Active Prescriptions', value: totalToday,     icon: Pill,         trend: deriveTrend(totalToday, totalYesterday), change: formatChange(totalToday, totalYesterday), accent: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', accentBg: 'stat-card-blue' },
        { label: 'Pending Dispense',      value: confirmedToday, icon: Package,       trend: deriveTrend(confirmedToday, confirmedYest), change: formatChange(confirmedToday, confirmedYest), accent: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', accentBg: 'stat-card-green' },
        { label: 'Low Stock Alerts',      value: lowStockItems.length, icon: AlertTriangle, trend: 'same', change: 'Live', accent: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', accentBg: 'stat-card-red' },
        { label: 'Dispensed Today',       value: completedQueueCount, icon: CheckCircle2, trend: 'same', change: 'Live', accent: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', accentBg: 'stat-card-amber' },
      ]
    }
    if (role === 'ADMIN') {
      return [
        { label: "Today's Appointments", value: totalToday,         icon: Calendar,     trend: deriveTrend(totalToday, totalYesterday), change: formatChange(totalToday, totalYesterday), accent: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', accentBg: 'stat-card-blue' },
        { label: 'Active Queue',         value: queueEntries.length, icon: Activity,    trend: 'same', change: 'Live', accent: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', accentBg: 'stat-card-amber' },
        { label: 'Low Stock Items',      value: lowStockItems.length,icon: Box,          trend: 'same', change: 'Live', accent: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', accentBg: 'stat-card-red' },
        { label: 'Pending Approval',     value: pendingToday,        icon: Clock,        trend: deriveTrend(pendingToday, pendingYest), change: formatChange(pendingToday, pendingYest), accent: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', accentBg: 'stat-card-green' },
      ]
    }
    /* Patient */
    return [
      { label: "Today's Appointments",  value: totalToday,          icon: Calendar,     trend: deriveTrend(totalToday, totalYesterday), change: formatChange(totalToday, totalYesterday), accent: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', accentBg: 'stat-card-blue' },
      { label: 'Upcoming',              value: patientUpcoming.length, icon: Clock,      trend: 'same', change: '--', accent: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', accentBg: 'stat-card-amber' },
      { label: 'Confirmed',             value: confirmedToday,       icon: CheckCircle2, trend: 'same', change: '--', accent: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', accentBg: 'stat-card-green' },
      { label: 'Pending',               value: pendingToday,         icon: Activity,     trend: 'same', change: '--', accent: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400', accentBg: 'stat-card-purple' },
    ]
  }, [role, todayAppointments, weekAppointments, waitingCount, inConsultationCount, completedQueueCount, lowStockItems.length, patientUpcoming.length, queueEntries.length])

  /*  Chart data  */
  const appointmentTrend = useMemo(() => {
    const days = [...Array(7)].map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i))
      return {
        day:   d.toLocaleDateString('en-US', { weekday: 'short' }),
        key:   d.toLocaleDateString('en-CA'),
        count: 0,
      }
    })
    const counts = weekAppointments.reduce((acc, a) => {
      const k = toDateKey(a?.appointmentTime || a?.slotTime)
      if (k) acc[k] = (acc[k] || 0) + 1
      return acc
    }, {})
    return days.map(d => ({ ...d, count: counts[d.key] || 0 }))
  }, [weekAppointments])

  const monthlyTrend = useMemo(() => {
    const months = [...Array(6)].map((_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - (5 - i))
      return {
        key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        month: d.toLocaleDateString('en-US', { month: 'short' }),
      }
    })
    const counts = monthAppointments.reduce((acc, a) => {
      const k = toMonthKey(a?.appointmentTime || a?.slotTime)
      if (k) acc[k] = (acc[k] || 0) + 1
      return acc
    }, {})
    return months.map(d => ({ month: d.month, appointments: counts[d.key] || 0 }))
  }, [monthAppointments])

  const recentQueue = queueEntries.slice(0, 6)

  /*  Greeting  */
  const firstName = user?.firstName || user?.fullName?.split(' ')[0] || 'there'
  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const today     = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  /*  Quick actions by role  */
  const quickActions = useMemo(() => {
    const all = [
      { to: '/patients/register',     icon: UserPlus,     label: 'Register Patient',     desc: 'Add new patient record',       color: 'bg-blue-100   text-blue-600   dark:bg-blue-900/30   dark:text-blue-400',   roles: ['DOCTOR','RECEPTIONIST','ADMIN'] },
      { to: '/appointments/book',     icon: Calendar,     label: 'Book Appointment',      desc: 'Schedule a new slot',          color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400', roles: ['DOCTOR','RECEPTIONIST','ADMIN','PATIENT'] },
      { to: '/appointments/calendar', icon: Calendar,     label: 'View Calendar',         desc: 'Daily appointment view',       color: 'bg-primary/10 text-primary',   roles: ['DOCTOR','RECEPTIONIST','NURSE','ADMIN'] },
      { to: '/queue',                 icon: Activity,     label: 'Patient Queue',         desc: 'Manage today\'s queue',         color: 'bg-amber-100  text-amber-600  dark:bg-amber-900/30  dark:text-amber-400',  roles: ['DOCTOR','NURSE','RECEPTIONIST','ADMIN'] },
      { to: '/billing',               icon: CreditCard,   label: 'Billing',               desc: 'Invoices & payments',          color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', roles: ['DOCTOR','RECEPTIONIST','ADMIN','PATIENT'] },
      { to: '/inventory',             icon: Box,          label: 'Inventory',             desc: 'Medicine stock management',    color: 'bg-red-100    text-red-600    dark:bg-red-900/30    dark:text-red-400',    roles: ['PHARMACIST','DOCTOR','ADMIN'] },
      { to: '/staff',                 icon: Users,        label: 'Staff Profiles',        desc: 'Manage staff accounts',        color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', roles: ['ADMIN','DOCTOR'] },
    ]
    return all.filter(a => a.roles.includes(role)).slice(0, 5)
  }, [role])

  /* 
     RENDER
   */
  return (
    <div className="page-container">

      {/*  Page Header  */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{greeting}, {firstName} </h1>
          <p className="page-subtitle">{today}</p>
        </div>
        <RoleProtected allowedRoles={['DOCTOR', 'RECEPTIONIST', 'ADMIN']}>
          <Link to="/appointments/book" className="btn-primary btn-sm flex items-center gap-1.5">
            <Calendar size={13} /> New Appointment
          </Link>
        </RoleProtected>
      </div>

      {/*  KPI Stats  */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/*  Charts strip (Doctor / Receptionist / Admin)  */}
      {showCharts && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          {/* Weekly line chart */}
          <div className="pm-card p-5 xl:col-span-3">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Weekly Appointments</p>
                <p className="text-xs text-muted-foreground mt-0.5">Daily volume over the last 7 days</p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="status-dot-live" />
                Live data
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={appointmentTrend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fill="url(#areaGrad)"
                  dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly bar chart */}
          <div className="pm-card p-5 xl:col-span-2">
            <div className="mb-4">
              <p className="text-sm font-semibold text-foreground">Monthly Volume</p>
              <p className="text-xs text-muted-foreground mt-0.5">Appointments per month</p>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyTrend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="appointments" fill="hsl(var(--primary) / 0.9)" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/*  Bottom row  */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Queue strip */}
        {(showQueue || isNurse) && (
          <div className="pm-card lg:col-span-2">
            <div className="pm-card-section flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Live Patient Queue</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="status-dot-live" />
                  <span className="text-xs text-muted-foreground">
                    {waitingCount} waiting  {inConsultationCount} in consultation  {completedQueueCount} done
                  </span>
                </div>
              </div>
              <Link to="/queue" className="btn-ghost btn-sm flex items-center gap-1 text-primary">
                Full Queue <ChevronRight size={13} />
              </Link>
            </div>
            <div className="p-3 space-y-1">
              {recentQueue.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Queue is empty  Check back later
                </div>
              ) : (
                recentQueue.map(e => <QueueRow key={e.id} entry={e} />)
              )}
            </div>
          </div>
        )}

        {/* Patient: next appointment */}
        {isPatient && (
          <div className="pm-card lg:col-span-2 p-5">
            <p className="text-sm font-semibold text-foreground mb-4">Next Appointment</p>
            {nextAppointment ? (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/15">
                <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex flex-col items-center justify-center font-bold leading-tight shrink-0">
                  <span className="text-xl">{new Date(nextAppointment.appointmentTime).getDate()}</span>
                  <span className="text-[9px] uppercase">{new Date(nextAppointment.appointmentTime).toLocaleDateString('en-US', { month: 'short' })}</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Dr. {nextAppointment.doctorName || '-'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {nextAppointment.visitType || 'General Visit'} &bull;{' '}
                    {new Date(nextAppointment.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <span className="badge-blue mt-2 inline-block">{nextAppointment.status}</span>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-xl bg-muted/40 text-center">
                <Calendar size={24} className="text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming appointments</p>
                <Link to="/appointments/book" className="btn-primary btn-sm mt-3 inline-flex">
                  Book now
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions panel */}
        <div className="pm-card p-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1 mb-2">
            Quick Actions
          </p>
          <div className="space-y-0.5">
            {quickActions.map(a => (
              <QuickAction key={a.to} {...a} />
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border flex items-center gap-2">
            <span className="status-dot-live" />
            <span className="text-[11px] text-muted-foreground">All systems operational</span>
          </div>
        </div>
      </div>
    </div>
  )
}