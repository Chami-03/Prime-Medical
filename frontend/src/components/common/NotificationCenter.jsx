import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bell, X, Package, Calendar, AlertTriangle, CheckCircle2, Info, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { inventoryApi } from '../../api/inventoryApi'
import { appointmentApi } from '../../api/appointmentApi'
import { useAuth } from '../../context/AuthContext'

function NotifIcon({ type }) {
  const cls = 'w-7 h-7 rounded-full flex items-center justify-center shrink-0'
  if (type === 'warning') return <div className={`${cls} bg-amber-100 dark:bg-amber-900/30`}><AlertTriangle size={13} className="text-amber-600" /></div>
  if (type === 'success') return <div className={`${cls} bg-emerald-100 dark:bg-emerald-900/30`}><CheckCircle2 size={13} className="text-emerald-600" /></div>
  if (type === 'appt')    return <div className={`${cls} bg-blue-100 dark:bg-blue-900/30`}><Calendar size={13} className="text-blue-600" /></div>
  if (type === 'stock')   return <div className={`${cls} bg-red-100 dark:bg-red-900/30`}><Package size={13} className="text-red-600" /></div>
  return <div className={`${cls} bg-muted`}><Info size={13} className="text-muted-foreground" /></div>
}

export default function NotificationCenter() {
  const [open, setOpen]   = useState(false)
  const ref               = useRef(null)
  const { hasAnyRole }    = useAuth()

  const showInventory = hasAnyRole('ADMIN', 'PHARMACIST', 'DOCTOR')
  const showAppts     = hasAnyRole('DOCTOR', 'NURSE', 'RECEPTIONIST', 'ADMIN', 'PATIENT')

  const { data: alertsRes } = useQuery({
    queryKey: ['notifications-alerts'],
    queryFn: () => inventoryApi.getAlerts(),
    enabled: showInventory,
    refetchInterval: 60000,
  })

  const todayDate = new Date().toLocaleDateString('en-CA')
  const { data: apptRes } = useQuery({
    queryKey: ['notifications-today-appts', todayDate],
    queryFn:  () => appointmentApi.getAll({ startDate: todayDate, endDate: todayDate }),
    enabled: showAppts,
    refetchInterval: 60000,
  })

  const alerts   = alertsRes?.data
  const lowStock = alerts?.lowStockCount  || 0
  const expiring = alerts?.expiringCount  || 0
  const todayAppts = Array.isArray(apptRes?.data) ? apptRes.data : []
  const upcomingCount = todayAppts.filter(a => ['SCHEDULED', 'CHECKED_IN'].includes(a.status)).length

  // Build notification list
  const notifications = []

  if (lowStock > 0) {
    notifications.push({
      id: 'low-stock',
      type: 'stock',
      title: `${lowStock} medicine${lowStock > 1 ? 's' : ''} low in stock`,
      desc: 'Reorder required to maintain pharmacy operations.',
      link: '/inventory',
      unread: true,
    })
  }

  if (expiring > 0) {
    notifications.push({
      id: 'expiring',
      type: 'warning',
      title: `${expiring} item${expiring > 1 ? 's' : ''} expiring soon`,
      desc: 'Check pharmacy inventory for expiry dates.',
      link: '/inventory',
      unread: true,
    })
  }

  if (upcomingCount > 0) {
    notifications.push({
      id: 'today-appts',
      type: 'appt',
      title: `${upcomingCount} appointment${upcomingCount > 1 ? 's' : ''} today`,
      desc: 'Scheduled or checked-in patients waiting.',
      link: '/appointments',
      unread: false,
    })
  }

  const total     = notifications.length
  const unreadCnt = notifications.filter(n => n.unread).length

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="btn-neu relative text-muted-foreground hover:text-foreground"
        title="Notifications"
      >
        <Bell size={16} />
        {unreadCnt > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center
                           rounded-full bg-red-500 text-white text-[9px] font-bold px-1">
            {unreadCnt > 9 ? '9+' : unreadCnt}
          </span>
        )}
      </button>

      {open && (
        <div
          className="dropdown-panel"
          style={{ top: 'calc(100% + 8px)', right: '0', width: '340px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-foreground" />
              <span className="text-sm font-semibold text-foreground">Notifications</span>
              {unreadCnt > 0 && (
                <span className="badge-red text-[10px] px-1.5 py-0.5">{unreadCnt} new</span>
              )}
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          </div>

          {/* List */}
          {total === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <CheckCircle2 size={28} className="text-emerald-500/50 mb-2" />
              <p className="text-sm font-medium text-foreground">All clear!</p>
              <p className="text-xs text-muted-foreground mt-0.5">No active alerts right now.</p>
            </div>
          ) : (
            <div>
              {notifications.map(n => (
                <Link
                  key={n.id}
                  to={n.link}
                  onClick={() => setOpen(false)}
                  className={`notif-item ${n.unread ? 'unread' : ''}`}
                >
                  <NotifIcon type={n.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground leading-snug">{n.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{n.desc}</p>
                  </div>
                  <ChevronRight size={12} className="text-muted-foreground shrink-0 mt-0.5" />
                </Link>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border bg-muted/20">
            <Link
              to="/inventory"
              onClick={() => setOpen(false)}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View inventory alerts <ChevronRight size={11} />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}