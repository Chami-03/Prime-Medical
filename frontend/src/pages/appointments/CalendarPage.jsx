import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { appointmentApi } from '../../api/appointmentApi'
import { userApi } from '../../api/userApi'
import { useAuth } from '../../context/AuthContext'
import Badge from '../../components/common/Badge'
import { CalendarDays, Clock, Eye, RefreshCw, Trash2, X } from 'lucide-react'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'

function removeAppointmentFromCachedResponse(oldValue, appointmentId) {
  if (!oldValue) return oldValue
  if (Array.isArray(oldValue)) return oldValue.filter((item) => item?.id !== appointmentId)
  if (Array.isArray(oldValue?.data)) {
    return {
      ...oldValue,
      data: oldValue.data.filter((item) => item?.id !== appointmentId),
    }
  }
  return oldValue
}

function updateAppointmentInCachedResponse(oldValue, appointmentId, updater) {
  if (!oldValue) return oldValue
  if (Array.isArray(oldValue)) {
    return oldValue.map((item) => (item?.id === appointmentId ? updater(item) : item))
  }
  if (Array.isArray(oldValue?.data)) {
    return {
      ...oldValue,
      data: oldValue.data.map((item) => (item?.id === appointmentId ? updater(item) : item)),
    }
  }
  return oldValue
}

const STATUS_ORDER = ['CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED']

function extractDoctors(payload) {
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.data)) return payload.data.data
  if (Array.isArray(payload)) return payload
  return []
}

export default function CalendarPage() {
  const queryClient = useQueryClient()
  const { user, hasRole } = useAuth()
  const isPatient = hasRole('PATIENT')
  const isReceptionist = hasRole('RECEPTIONIST')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedDoctorId, setSelectedDoctorId] = useState(hasRole('DOCTOR') ? (user?.id || null) : null)
  const [detailAppt, setDetailAppt] = useState(null)
  const [rescheduleAppt, setRescheduleAppt] = useState(null)
  const [newRescheduleTime, setNewRescheduleTime] = useState('')
  const [cancelAppt, setCancelAppt] = useState(null)
  const [deleteAppt, setDeleteAppt] = useState(null)

  const { data: doctorsRes } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => userApi.getDoctors(),
    enabled: !isPatient,
    refetchInterval: 30000,
  })

  const doctors = useMemo(() => extractDoctors(doctorsRes), [doctorsRes])

  const { data: apptsRes, isLoading } = useQuery({
    queryKey: ['calendar', isPatient ? 'mine' : selectedDoctorId, selectedDate],
    queryFn: () =>
      isPatient
        ? appointmentApi.getMyCalendar(selectedDate)
        : appointmentApi.getCalendar(selectedDoctorId, selectedDate),
    enabled: isPatient || !!selectedDoctorId,
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  })

  const { data: auditTimelineData, isLoading: isAuditLoading } = useQuery({
    queryKey: ['appointment-audit-timeline', detailAppt?.id],
    queryFn: () => appointmentApi.getAuditTimeline(detailAppt.id),
    enabled: !!detailAppt?.id,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, newTime }) => appointmentApi.reschedule(id, newTime),
    onMutate: async ({ id, newTime }) => {
      await queryClient.cancelQueries({ queryKey: ['calendar'] })
      await queryClient.cancelQueries({ queryKey: ['appointments'] })

      const previousCalendar = queryClient.getQueriesData({ queryKey: ['calendar'] })
      const previousAppointments = queryClient.getQueriesData({ queryKey: ['appointments'] })

      const [nextDate, nextTime] = newTime.split('T')
      const selectedDateForView = selectedDate

      const applyReschedule = (oldValue) => {
        if (nextDate !== selectedDateForView) {
          return removeAppointmentFromCachedResponse(oldValue, id)
        }
        return updateAppointmentInCachedResponse(oldValue, id, (item) => ({
          ...item,
          appointmentTime: newTime,
          slotTime: nextTime ? `${nextTime}:00` : item.slotTime,
        }))
      }

      queryClient.setQueriesData({ queryKey: ['calendar'] }, applyReschedule)
      queryClient.setQueriesData({ queryKey: ['appointments'] }, applyReschedule)

      return { previousCalendar, previousAppointments }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Appointment rescheduled successfully')
      setRescheduleAppt(null)
      setNewRescheduleTime('')
    },
    onError: (err, _variables, context) => {
      context?.previousCalendar?.forEach(([queryKey, queryData]) => {
        queryClient.setQueryData(queryKey, queryData)
      })
      context?.previousAppointments?.forEach(([queryKey, queryData]) => {
        queryClient.setQueryData(queryKey, queryData)
      })
      toast.error(err.response?.data?.message || 'Failed to edit appointment')
    },
  })

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }) => appointmentApi.cancel(id, reason),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['calendar'] })
      await queryClient.cancelQueries({ queryKey: ['appointments'] })

      const previousCalendar = queryClient.getQueriesData({ queryKey: ['calendar'] })
      const previousAppointments = queryClient.getQueriesData({ queryKey: ['appointments'] })

      queryClient.setQueriesData({ queryKey: ['calendar'] }, (oldValue) =>
        removeAppointmentFromCachedResponse(oldValue, id)
      )
      queryClient.setQueriesData({ queryKey: ['appointments'] }, (oldValue) =>
        removeAppointmentFromCachedResponse(oldValue, id)
      )

      return { previousCalendar, previousAppointments }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Appointment cancelled successfully')
      setCancelAppt(null)
    },
    onError: (err, _variables, context) => {
      context?.previousCalendar?.forEach(([queryKey, queryData]) => {
        queryClient.setQueryData(queryKey, queryData)
      })
      context?.previousAppointments?.forEach(([queryKey, queryData]) => {
        queryClient.setQueryData(queryKey, queryData)
      })
      toast.error(err.response?.data?.message || 'Failed to cancel appointment')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => appointmentApi.deletePermanent(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['calendar'] })
      await queryClient.cancelQueries({ queryKey: ['appointments'] })

      setDeleteAppt(null)

      const previousCalendar = queryClient.getQueriesData({ queryKey: ['calendar'] })
      const previousAppointments = queryClient.getQueriesData({ queryKey: ['appointments'] })

      queryClient.setQueriesData({ queryKey: ['calendar'] }, (oldValue) =>
        removeAppointmentFromCachedResponse(oldValue, id)
      )
      queryClient.setQueriesData({ queryKey: ['appointments'] }, (oldValue) =>
        removeAppointmentFromCachedResponse(oldValue, id)
      )

      return { previousCalendar, previousAppointments }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Successfully deleted')
      setDeleteAppt(null)
    },
    onError: (err, _id, context) => {
      context?.previousCalendar?.forEach(([queryKey, queryData]) => {
        queryClient.setQueryData(queryKey, queryData)
      })
      context?.previousAppointments?.forEach(([queryKey, queryData]) => {
        queryClient.setQueryData(queryKey, queryData)
      })
      toast.error(err.response?.data?.message || 'Failed to delete appointment')
    },
  })

  const appointments = (apptsRes?.data || []).filter((appointment) => appointment?.status !== 'CANCELLED')
  const auditTimeline = auditTimelineData?.data || []
  const currentDoctorName = user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ')
  const selectedDoctor = doctors.find((doc) => Number(doc?.id) === Number(selectedDoctorId))
  const selectedDoctorName = selectedDoctor
    ? [selectedDoctor.firstName, selectedDoctor.lastName].filter(Boolean).join(' ')
    : currentDoctorName

  const formatAuditAction = (action) => {
    if (!action) return '-'
    return action
      .split('_')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  const handleConfirmDelete = () => {
    if (!deleteAppt?.id) {
      toast.error('No appointment selected for delete')
      return
    }
    deleteMutation.mutate(deleteAppt.id)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <CalendarDays size={18} className="text-primary" /> {isPatient ? 'My Appointments' : 'Doctor Schedule'}
        </h2>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end">
          {!isPatient && hasRole('DOCTOR') && <span className="text-sm text-muted-foreground">Dr. {currentDoctorName || '-'}</span>}
          {!isPatient && isReceptionist && (
            <select
              className="form-select h-10 py-0 text-sm leading-6 w-full sm:w-56 min-w-[12rem]"
              value={selectedDoctorId != null ? String(selectedDoctorId) : ''}
              onChange={(e) => {
                const nextValue = e.target.value
                if (!nextValue) {
                  setSelectedDoctorId(null)
                  return
                }
                const parsedId = Number(nextValue)
                setSelectedDoctorId(Number.isNaN(parsedId) ? null : parsedId)
              }}
            >
              <option value="">-- Select Doctor --</option>
              {doctors.map((doc) => (
                <option key={doc?.id} value={String(doc?.id)}>
                  Dr. {[doc?.firstName, doc?.lastName].filter(Boolean).join(' ')}
                </option>
              ))}
            </select>
          )}
          <input
            type="date"
            className="form-input h-10 py-0 text-sm leading-6 w-full sm:w-44"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Sidebar stats */}
        <div className="space-y-4">
          {/* Total */}
          <div className="pm-card p-5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Total Today</p>
            <p className="text-4xl font-bold text-primary mt-1">{appointments.length}</p>
            <p className="text-xs text-muted-foreground mt-1">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>

          {/* Status breakdown */}
          <div className="pm-card p-5">
            <p className="text-xs font-semibold text-foreground mb-3">Status Overview</p>
            <div className="space-y-2">
              {STATUS_ORDER.map(status => {
                const count = appointments.filter(a => a.status === status).length
                if (count === 0) return null
                return (
                  <div key={status} className="flex items-center justify-between">
                    <Badge status={status} />
                    <span className="text-sm font-bold text-foreground tabular-nums">{count}</span>
                  </div>
                )
              })}
              {appointments.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No appointments</p>}
            </div>
          </div>

          {/* Real-time notice */}
          <div className="pm-card p-4 border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 text-xs text-primary font-medium">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              Real-time updates active
            </div>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Calendar syncs live with the queue and appointment system.</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="lg:col-span-3 pm-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-primary" />
              <span className="text-sm font-semibold text-foreground">
                Schedule  {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">Room 1</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : !isPatient && !selectedDoctorId ? (
            <div className="flex flex-col items-center justify-center py-16">
              <CalendarDays size={28} className="text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Select a doctor to view calendar</p>
            </div>
          ) : appointments.length > 0 ? (
            <div className="divide-y divide-border">
              {appointments.map((appt, idx) => (
                <div key={idx} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                  {/* Time */}
                  <div className="w-16 text-center shrink-0">
                    <p className="text-base font-bold text-foreground font-mono">{appt.slotTime?.substring(0, 5) || '--:--'}</p>
                  </div>

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0 uppercase">
                    {appt.patientName?.charAt(0) || '?'}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{appt.patientName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono text-muted-foreground">{appt.confirmationCode}</span>
                      {appt.visitType && <span className="text-[10px] uppercase text-muted-foreground/60">{appt.visitType}</span>}
                    </div>
                  </div>

                  {/* Reason */}
                  {appt.reason && (
                    <p className="hidden xl:block text-xs text-muted-foreground max-w-48 truncate">{appt.reason}</p>
                  )}

                  {/* Status + actions */}
                  <div className="flex items-center gap-2">
                    <Badge status={appt.status} />
                    <div className="flex items-center gap-1">
                      <button
                        title="Read"
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                        onClick={() => setDetailAppt(appt)}
                      >
                        <Eye size={14} />
                      </button>
                      {appt.status !== 'CANCELLED' && appt.status !== 'COMPLETED' && (
                        <>
                          <button
                            title="Edit"
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                            onClick={() => {
                              setRescheduleAppt(appt)
                              setNewRescheduleTime(appt.appointmentTime?.slice(0, 16) || '')
                            }}
                          >
                            <RefreshCw size={14} />
                          </button>
                          <button
                            title="Cancel"
                            className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                            onClick={() => setCancelAppt(appt)}
                          >
                            <X size={14} />
                          </button>
                        </>
                      )}
                      <button
                        title="Delete"
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                        onClick={() => setDeleteAppt(appt)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <CalendarDays size={28} className="text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No appointments scheduled</p>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={!!detailAppt} onClose={() => setDetailAppt(null)} title="Appointment Details">
        <div className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Code:</span> {detailAppt?.confirmationCode}</p>
          <p><span className="text-muted-foreground">Doctor:</span> Dr. {detailAppt?.doctorName || selectedDoctorName || '-'}</p>
          <p><span className="text-muted-foreground">Time:</span> {detailAppt?.appointmentTime?.replace('T', ' ')}</p>
          <p><span className="text-muted-foreground">Visit Type:</span> {detailAppt?.visitType}</p>
          <p><span className="text-muted-foreground">Reason:</span> {detailAppt?.reason || '-'}</p>
          <div className="pt-2">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Audit Timeline</p>
            {isAuditLoading ? (
              <p className="text-xs text-muted-foreground">Loading timeline...</p>
            ) : auditTimeline.length === 0 ? (
              <p className="text-xs text-muted-foreground">No audit events yet.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {auditTimeline.map((event) => (
                  <div key={event.id} className="rounded-lg border border-border p-2.5 bg-muted/30">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-foreground">{formatAuditAction(event.action)}</p>
                      <p className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {event.changedAt ? new Date(event.changedAt).toLocaleString() : '-'}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">By: {event.changedByName || 'System'}</p>
                    {(event.fromStatus || event.toStatus) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Status: {event.fromStatus || '-'} → {event.toStatus || '-'}
                      </p>
                    )}
                    {event.reason && (
                      <p className="text-xs text-muted-foreground mt-1">Reason: {event.reason}</p>
                    )}
                    {event.details && (
                      <p className="text-xs text-muted-foreground mt-1">{event.details}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="pt-3">
            <Button className="w-full" onClick={() => setDetailAppt(null)}>Close</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!rescheduleAppt} onClose={() => setRescheduleAppt(null)} title="Edit Appointment">
        <div className="space-y-4">
          <div>
            <label className="form-label mb-1.5 block">New date & time</label>
            <input
              type="datetime-local"
              className="form-input"
              value={newRescheduleTime}
              onChange={(e) => setNewRescheduleTime(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setRescheduleAppt(null)
                setNewRescheduleTime('')
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              loading={rescheduleMutation.isPending}
              disabled={!newRescheduleTime}
              onClick={() => rescheduleMutation.mutate({ id: rescheduleAppt.id, newTime: `${newRescheduleTime}:00` })}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!cancelAppt} onClose={() => setCancelAppt(null)} title="Cancel Appointment">
        <div className="space-y-4">
          <p className="text-sm text-foreground">Cancel this appointment?</p>
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setCancelAppt(null)}>Back</Button>
            <Button
              variant="danger"
              className="flex-1"
              loading={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate({ id: cancelAppt.id, reason: 'Cancelled by receptionist' })}
            >
              Confirm Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteAppt} onClose={() => setDeleteAppt(null)} title="Delete Appointment">
        <div className="space-y-4">
          <p className="text-sm text-foreground">Delete this appointment permanently?</p>
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteAppt(null)}>Back</Button>
            <Button
              variant="danger"
              className="flex-1"
              loading={deleteMutation.isPending}
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}