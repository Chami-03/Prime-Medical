import { useState, useRef, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, X, Package, Calendar, AlertTriangle, CheckCircle2, Info, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { inventoryApi } from '../../api/inventoryApi'
import { appointmentApi } from '../../api/appointmentApi'
import { prescriptionApi } from '../../api/prescriptionApi'
import { queueApi } from '../../api/queueApi'
import { consultationApi } from '../../api/consultationApi'
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
  const queryClient       = useQueryClient()
  const previousRxIdsRef  = useRef([])
  const initializedRxRef  = useRef(false)
  const previousRecentPendingIdsRef = useRef([])
  const initializedRecentPendingRef = useRef(false)
  const previousDispensedIdsRef = useRef([])
  const initializedDispensedRef = useRef(false)
  const previousReadyQueueIdsRef = useRef([])
  const initializedReadyQueueRef = useRef(false)
  const previousBloodCheckIdsRef = useRef([])
  const initializedBloodCheckRef = useRef(false)
  const previousCompletedBloodCheckIdsRef = useRef([])
  const initializedCompletedBloodCheckRef = useRef(false)

  const showInventory = hasAnyRole('ADMIN', 'PHARMACIST', 'DOCTOR')
  const showAppts     = hasAnyRole('DOCTOR', 'NURSE', 'RECEPTIONIST', 'ADMIN', 'PATIENT')
  const showPharmacyRx = hasAnyRole('PHARMACIST')
  const showReceptionDesk = hasAnyRole('RECEPTIONIST')
  const showNurseQueue = hasAnyRole('NURSE')
  const showBloodCheckups = hasAnyRole('NURSE')
  const showDoctorBloodReports = hasAnyRole('DOCTOR')

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

  const { data: pendingRxRes } = useQuery({
    queryKey: ['notifications-pending-prescriptions'],
    queryFn: () => prescriptionApi.getPending(),
    enabled: showPharmacyRx,
    refetchInterval: 5000,
  })

  const { data: recentPendingRxRes } = useQuery({
    queryKey: ['notifications-recent-pending-prescriptions'],
    queryFn: () => prescriptionApi.getRecentlyPending(120),
    enabled: showPharmacyRx,
    refetchInterval: 3000,
  })

  const { data: dispensedRecentRes } = useQuery({
    queryKey: ['notifications-dispensed-recent'],
    queryFn: () => prescriptionApi.getRecentlyDispensed(120),
    enabled: showReceptionDesk,
    refetchInterval: 5000,
  })

  const { data: queueTodayRes } = useQuery({
    queryKey: ['notifications-queue-today'],
    queryFn: () => queueApi.getToday(),
    enabled: showNurseQueue,
    refetchInterval: 5000,
  })

  const { data: pendingBloodCheckupsRes } = useQuery({
    queryKey: ['notifications-pending-blood-checkups'],
    queryFn: () => consultationApi.getPendingBloodCheckups(),
    enabled: showBloodCheckups,
    refetchInterval: 5000,
  })

  const { data: completedBloodCheckupsRes } = useQuery({
    queryKey: ['notifications-completed-blood-checkups'],
    queryFn: () => consultationApi.getCompletedBloodCheckups(),
    enabled: showDoctorBloodReports,
    refetchInterval: 5000,
  })

  const alerts   = alertsRes?.data
  const lowStock = alerts?.lowStockCount  || 0
  const expiring = alerts?.expiringCount  || 0
  const todayAppts = Array.isArray(apptRes?.data) ? apptRes.data : []
  const upcomingCount = todayAppts.filter(a => ['SCHEDULED', 'CHECKED_IN'].includes(a.status)).length
  const pendingPrescriptions = Array.isArray(pendingRxRes?.data) ? pendingRxRes.data : []
  const recentPendingPrescriptions = Array.isArray(recentPendingRxRes?.data) ? recentPendingRxRes.data : []
  const recentlyDispensed = Array.isArray(dispensedRecentRes?.data) ? dispensedRecentRes.data : []
  const queueToday = Array.isArray(queueTodayRes?.data) ? queueTodayRes.data : []
  const pendingBloodCheckups = Array.isArray(pendingBloodCheckupsRes?.data) ? pendingBloodCheckupsRes.data : []
  const completedBloodCheckups = Array.isArray(completedBloodCheckupsRes?.data) ? completedBloodCheckupsRes.data : []
  const readyPatients = queueToday.filter((q) => q?.status === 'READY')

  useEffect(() => {
    if (!showPharmacyRx) return

    const ids = pendingPrescriptions.map((rx) => rx.id).filter(Boolean)
    if (!initializedRxRef.current) {
      previousRxIdsRef.current = ids
      initializedRxRef.current = true
      return
    }

    const previousSet = new Set(previousRxIdsRef.current)
    const newOnes = pendingPrescriptions.filter((rx) => rx?.id && !previousSet.has(rx.id))

    if (newOnes.length > 0) {
      const latest = newOnes[0]
      toast.success(`New prescription for ${latest?.patientName || 'patient'}`)
    }

    previousRxIdsRef.current = ids
  }, [pendingPrescriptions, showPharmacyRx])

  useEffect(() => {
    if (!showPharmacyRx) return

    const ids = recentPendingPrescriptions.map((rx) => rx.id).filter(Boolean)
    if (!initializedRecentPendingRef.current) {
      previousRecentPendingIdsRef.current = ids
      initializedRecentPendingRef.current = true
      return
    }

    const previousSet = new Set(previousRecentPendingIdsRef.current)
    const newOnes = recentPendingPrescriptions.filter((rx) => rx?.id && !previousSet.has(rx.id))

    if (newOnes.length > 0) {
      const latest = newOnes[0]
      toast.success(`Doctor added prescription for ${latest?.patientName || 'patient'}`)
    }

    previousRecentPendingIdsRef.current = ids
  }, [recentPendingPrescriptions, showPharmacyRx])

  useEffect(() => {
    if (!showReceptionDesk) return

    const ids = recentlyDispensed.map((rx) => rx.id).filter(Boolean)
    if (!initializedDispensedRef.current) {
      previousDispensedIdsRef.current = ids
      initializedDispensedRef.current = true
      return
    }

    const previousSet = new Set(previousDispensedIdsRef.current)
    const newOnes = recentlyDispensed.filter((rx) => rx?.id && !previousSet.has(rx.id))

    if (newOnes.length > 0) {
      const latest = newOnes[0]
      toast.success(`Pharmacy dispensed for ${latest?.patientName || 'patient'}; billing updated`)

      // Ensure receptionist billing views reflect recalculated medicine charges immediately.
      queryClient.invalidateQueries({ queryKey: ['patient-bills'] })
      queryClient.invalidateQueries({ queryKey: ['patient-bills-profile'] })
      queryClient.invalidateQueries({ queryKey: ['my-patient-profile-billing'] })
      queryClient.invalidateQueries({ queryKey: ['bill'] })
    }

    previousDispensedIdsRef.current = ids
  }, [recentlyDispensed, showReceptionDesk, queryClient])

  useEffect(() => {
    if (!showNurseQueue) return

    const ids = readyPatients.map((entry) => entry.id).filter(Boolean)
    if (!initializedReadyQueueRef.current) {
      previousReadyQueueIdsRef.current = ids
      initializedReadyQueueRef.current = true
      return
    }

    const previousSet = new Set(previousReadyQueueIdsRef.current)
    const newReady = readyPatients.filter((entry) => entry?.id && !previousSet.has(entry.id))

    if (newReady.length > 0) {
      const latest = newReady[0]
      toast.success(`${latest?.patientName || 'Patient'} is ready for next call`)
    }

    previousReadyQueueIdsRef.current = ids
  }, [readyPatients, showNurseQueue])

  useEffect(() => {
    if (!showBloodCheckups) return

    const ids = pendingBloodCheckups.map((c) => c.id).filter(Boolean)
    if (!initializedBloodCheckRef.current) {
      previousBloodCheckIdsRef.current = ids
      initializedBloodCheckRef.current = true
      return
    }

    const previousSet = new Set(previousBloodCheckIdsRef.current)
    const newOnes = pendingBloodCheckups.filter((c) => c?.id && !previousSet.has(c.id))

    if (newOnes.length > 0) {
      const latest = newOnes[0]
      toast.success(`Blood checkup requested for ${latest?.patientName || 'patient'}`)
    }

    previousBloodCheckIdsRef.current = ids
  }, [pendingBloodCheckups, showBloodCheckups])

  useEffect(() => {
    if (!showDoctorBloodReports) return

    const ids = completedBloodCheckups.map((c) => c.id).filter(Boolean)
    if (!initializedCompletedBloodCheckRef.current) {
      previousCompletedBloodCheckIdsRef.current = ids
      initializedCompletedBloodCheckRef.current = true
      return
    }

    const previousSet = new Set(previousCompletedBloodCheckIdsRef.current)
    const newOnes = completedBloodCheckups.filter((c) => c?.id && !previousSet.has(c.id))

    if (newOnes.length > 0) {
      const latest = newOnes[0]
      toast.success(`Blood report submitted for ${latest?.patientName || 'patient'}`)
    }

    previousCompletedBloodCheckIdsRef.current = ids
  }, [completedBloodCheckups, showDoctorBloodReports])

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

  if (pendingPrescriptions.length > 0 && showPharmacyRx) {
    notifications.push({
      id: 'pending-prescriptions',
      type: 'success',
      title: `${pendingPrescriptions.length} pending prescription${pendingPrescriptions.length > 1 ? 's' : ''}`,
      desc: 'New doctor prescriptions are ready for dispensing.',
      link: `/dispense/${pendingPrescriptions[0]?.id || ''}`,
      unread: true,
    })
  }

  if (recentPendingPrescriptions.length > 0 && showPharmacyRx) {
    notifications.push({
      id: 'doctor-new-prescriptions',
      type: 'appt',
      title: `${recentPendingPrescriptions.length} doctor-added prescription${recentPendingPrescriptions.length > 1 ? 's' : ''}`,
      desc: 'New prescriptions need pharmacist action.',
      link: `/dispense/${recentPendingPrescriptions[0]?.id || ''}`,
      unread: true,
    })
  }

  if (recentlyDispensed.length > 0 && showReceptionDesk) {
    notifications.push({
      id: 'dispensed-recent',
      type: 'success',
      title: `${recentlyDispensed.length} pharmacy dispense update${recentlyDispensed.length > 1 ? 's' : ''}`,
      desc: 'Medicine charges added. Billing prices were updated.',
      link: '/billing',
      unread: true,
    })
  }

  if (showNurseQueue && readyPatients.length > 0) {
    notifications.push({
      id: 'nurse-ready-queue',
      type: 'appt',
      title: `${readyPatients.length} patient${readyPatients.length > 1 ? 's' : ''} ready in queue`,
      desc: 'Vitals recorded. Call the next patient when ready.',
      link: '/queue',
      unread: true,
    })
  }

  if (showBloodCheckups && pendingBloodCheckups.length > 0) {
    notifications.push({
      id: 'pending-blood-checkups',
      type: 'warning',
      title: `${pendingBloodCheckups.length} blood checkup request${pendingBloodCheckups.length > 1 ? 's' : ''}`,
      desc: 'Doctor requested blood checkups. Update results from consultation.',
      link: `/consultation/${pendingBloodCheckups[0]?.id || ''}`,
      unread: true,
    })
  }

  if (showDoctorBloodReports && completedBloodCheckups.length > 0) {
    notifications.push({
      id: 'completed-blood-checkups',
      type: 'success',
      title: `${completedBloodCheckups.length} blood report${completedBloodCheckups.length > 1 ? 's' : ''} submitted`,
      desc: 'Nurse completed blood tests. Open consultation to review report.',
      link: `/consultation/${completedBloodCheckups[0]?.id || ''}`,
      unread: true,
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