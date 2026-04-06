import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Calendar, Plus, Clock, UserCheck, RefreshCw, Printer, X, ChevronRight, AlertCircle, Trash2, Eye } from 'lucide-react'
import { appointmentApi } from '../../api/appointmentApi'
import { queueApi } from '../../api/queueApi'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import CheckInModal from '../../components/common/CheckInModal'

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

export default function AppointmentListPage() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const initialDate = searchParams.get('date') || new Date().toISOString().slice(0, 10)
  const [detailAppt, setDetailAppt] = useState(null)
  const [selectedAppt, setSelectedAppt] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [checkInAppt, setCheckInAppt] = useState(null)
  const [rescheduleAppt, setRescheduleAppt] = useState(null)
  const [newRescheduleTime, setNewRescheduleTime] = useState('')
  const [delayAppt, setDelayAppt] = useState(null)
  const [delayHours, setDelayHours] = useState(0)
  const [delayMinutes, setDelayMinutes] = useState(0)
  const [delayReason, setDelayReason] = useState('')
  const [deleteAppt, setDeleteAppt] = useState(null)
  const [selectedDate, setSelectedDate] = useState(initialDate)

  const { user, hasRole } = useAuth()
  const isPatient = hasRole('PATIENT')
  const isReceptionist = hasRole('RECEPTIONIST')
  const isDoctor = hasRole('DOCTOR')
  const canBookAppointments = isPatient || isReceptionist || isDoctor
  const doctorId = user?.id ?? null

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', isPatient ? 'mine' : (isReceptionist ? 'reception' : doctorId), selectedDate],
    queryFn: () => {
      if (isPatient) return appointmentApi.getMyCalendar(selectedDate)
      if (isReceptionist || isDoctor) {
        return appointmentApi.getAll({ startDate: selectedDate, endDate: selectedDate })
      }
      return appointmentApi.getCalendar(doctorId, selectedDate)
    },
    enabled: !isDoctor || !!doctorId,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 3000,
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

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }) => appointmentApi.cancel(id, reason),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['appointments'] })
      await queryClient.cancelQueries({ queryKey: ['calendar'] })

      const previousAppointments = queryClient.getQueriesData({ queryKey: ['appointments'] })
      const previousCalendar = queryClient.getQueriesData({ queryKey: ['calendar'] })

      queryClient.setQueriesData({ queryKey: ['appointments'] }, (oldValue) =>
        removeAppointmentFromCachedResponse(oldValue, id)
      )
      queryClient.setQueriesData({ queryKey: ['calendar'] }, (oldValue) =>
        removeAppointmentFromCachedResponse(oldValue, id)
      )

      return { previousAppointments, previousCalendar }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      toast.success('Appointment cancelled')
      setSelectedAppt(null)
      setCancelReason('')
    },
    onError: (err, _variables, context) => {
      context?.previousAppointments?.forEach(([queryKey, queryData]) => {
        queryClient.setQueryData(queryKey, queryData)
      })
      context?.previousCalendar?.forEach(([queryKey, queryData]) => {
        queryClient.setQueryData(queryKey, queryData)
      })
      toast.error(err.response?.data?.message || 'Failed to cancel appointment')
    },
  })

  const checkInMutation = useMutation({
    mutationFn: (data) => queueApi.checkIn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['today-queue'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      toast.success('Patient checked in successfully')
      setCheckInAppt(null)
    },
    onError: () => toast.error('Check-in failed'),
  })

  const noShowMutation = useMutation({
    mutationFn: (id) => appointmentApi.updateStatus(id, 'NO_SHOW'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      toast.success('Marked as No-Show')
    },
    onError: () => toast.error('Failed to mark as No-Show'),
  })

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, newTime }) => appointmentApi.reschedule(id, newTime),
    onMutate: async ({ id, newTime }) => {
      await queryClient.cancelQueries({ queryKey: ['appointments'] })
      await queryClient.cancelQueries({ queryKey: ['calendar'] })

      const previousAppointments = queryClient.getQueriesData({ queryKey: ['appointments'] })
      const previousCalendar = queryClient.getQueriesData({ queryKey: ['calendar'] })

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

      queryClient.setQueriesData({ queryKey: ['appointments'] }, applyReschedule)
      queryClient.setQueriesData({ queryKey: ['calendar'] }, applyReschedule)

      return { previousAppointments, previousCalendar }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      toast.success('Appointment rescheduled successfully')
      setRescheduleAppt(null)
      setNewRescheduleTime('')
    },
    onError: (err, _variables, context) => {
      context?.previousAppointments?.forEach(([queryKey, queryData]) => {
        queryClient.setQueryData(queryKey, queryData)
      })
      context?.previousCalendar?.forEach(([queryKey, queryData]) => {
        queryClient.setQueryData(queryKey, queryData)
      })
      toast.error(err.response?.data?.message || 'Failed to reschedule')
    },
  })

  const doctorDelayMutation = useMutation({
    mutationFn: ({ id, delayMinutesTotal, reason }) =>
      appointmentApi.notifyDoctorDelay(id, delayMinutesTotal, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      toast.success('Patient notified about doctor delay')
      setDelayAppt(null)
      setDelayHours(0)
      setDelayMinutes(0)
      setDelayReason('')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to notify patient about delay')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => appointmentApi.deletePermanent(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['appointments'] })
      await queryClient.cancelQueries({ queryKey: ['calendar'] })

      setDeleteAppt(null)

      const previousAppointments = queryClient.getQueriesData({ queryKey: ['appointments'] })
      const previousCalendar = queryClient.getQueriesData({ queryKey: ['calendar'] })

      queryClient.setQueriesData({ queryKey: ['appointments'] }, (oldValue) =>
        removeAppointmentFromCachedResponse(oldValue, id)
      )
      queryClient.setQueriesData({ queryKey: ['calendar'] }, (oldValue) =>
        removeAppointmentFromCachedResponse(oldValue, id)
      )

      return { previousAppointments, previousCalendar }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      toast.success('Successfully deleted')
      setDeleteAppt(null)
    },
    onError: (err, _id, context) => {
      context?.previousAppointments?.forEach(([queryKey, queryData]) => {
        queryClient.setQueryData(queryKey, queryData)
      })
      context?.previousCalendar?.forEach(([queryKey, queryData]) => {
        queryClient.setQueryData(queryKey, queryData)
      })
      toast.error(err.response?.data?.message || 'Failed to delete appointment')
    },
  })

  const appts = (data?.data || []).filter((appointment) => appointment?.status !== 'CANCELLED')
  const confirmedCount = appts.filter((a) => a?.status === 'CONFIRMED').length
  const pendingCount = appts.filter((a) => ['PENDING', 'REQUESTED'].includes(a?.status)).length
  const completedCount = appts.filter((a) => a?.status === 'COMPLETED').length
  const fallbackDoctorName = user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ')
  const doctorLabel = (appointment) => {
    const name = appointment?.doctorName || fallbackDoctorName
    return name ? `Dr. ${name}` : 'Dr. -'
  }
  const auditTimeline = auditTimelineData?.data || []

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

  const handlePrintAppointment = (appointment) => {
    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) {
      toast.error('Popup blocked. Please allow popups to print appointment details.')
      return
    }

    const appointmentDate = appointment?.appointmentTime
      ? new Date(appointment.appointmentTime).toLocaleString()
      : '-'

    const printHtml = `
      <!doctype html>
      <html>
        <head>
          <title>Appointment ${appointment?.confirmationCode || ''}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { margin: 0 0 16px 0; font-size: 20px; }
            .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; }
            .row { display: flex; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
            .row:last-child { border-bottom: none; }
            .label { width: 180px; color: #6b7280; font-weight: 600; }
            .value { flex: 1; color: #111827; }
            .meta { margin-top: 14px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Appointment Details</h1>
          <div class="card">
            <div class="row"><div class="label">Confirmation Code</div><div class="value">${appointment?.confirmationCode || '-'}</div></div>
            <div class="row"><div class="label">Patient</div><div class="value">${appointment?.patientName || '-'}</div></div>
            <div class="row"><div class="label">Patient Number</div><div class="value">${appointment?.patientNumber || '-'}</div></div>
            <div class="row"><div class="label">Doctor</div><div class="value">${doctorLabel(appointment)}</div></div>
            <div class="row"><div class="label">Date & Time</div><div class="value">${appointmentDate}</div></div>
            <div class="row"><div class="label">Visit Type</div><div class="value">${appointment?.visitType || '-'}</div></div>
            <div class="row"><div class="label">Status</div><div class="value">${appointment?.status || '-'}</div></div>
            <div class="row"><div class="label">Reason</div><div class="value">${appointment?.reason || '-'}</div></div>
          </div>
          <div class="meta">Printed on ${new Date().toLocaleString()}</div>
          <script>
            window.onload = function () {
              window.print();
              setTimeout(function () { window.close(); }, 150);
            }
          </script>
        </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(printHtml)
    printWindow.document.close()
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="epic-shell space-y-4">
        <div className="epic-toolbar">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Appointments</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="epic-toolbar-actions">
            <input
              type="date"
              className="form-input h-9 text-sm w-44"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <Link to="/appointments/calendar">
              <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
                <Calendar size={14} />
                Calendar
              </Button>
            </Link>
            {canBookAppointments && (
              <Link to="/appointments/book">
                <Button size="sm" className="flex items-center gap-1.5">
                  <Plus size={14} />
                  Book Appointment
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="epic-kpi-grid">
          <div className="epic-kpi">
            <p className="epic-kpi-label">Total</p>
            <p className="epic-kpi-value">{appts.length}</p>
          </div>
          <div className="epic-kpi">
            <p className="epic-kpi-label">Confirmed</p>
            <p className="epic-kpi-value">{confirmedCount}</p>
          </div>
          <div className="epic-kpi">
            <p className="epic-kpi-label">Pending</p>
            <p className="epic-kpi-value">{pendingCount}</p>
          </div>
          <div className="epic-kpi">
            <p className="epic-kpi-label">Completed</p>
            <p className="epic-kpi-value">{completedCount}</p>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="pm-card overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">Loading appointments</p>
          </div>
        ) : appts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Calendar size={40} className="text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No appointments today</p>
            {canBookAppointments && (
              <Link to="/appointments/book" className="mt-3 text-sm text-primary hover:underline underline-offset-4 font-medium flex items-center gap-1">
                Book one now <ChevronRight size={13} />
              </Link>
            )}
          </div>
        ) : (
          <table className="pm-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Visit Type</th>
                <th>Status</th>
                <th className="!text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appts.map((appt) => {
                const time = appt.slotTime ?? appt.appointmentTime?.split('T')[1]?.substring(0, 5)
                const active = appt.status !== 'CANCELLED' && appt.status !== 'COMPLETED'
                return (
                  <tr key={appt.id}>
                    <td>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <Clock size={13} className="text-muted-foreground flex-shrink-0" />
                        {time}
                      </div>
                    </td>
                    <td>
                      <p className="text-sm font-medium text-foreground">{appt.patientName}</p>
                      <p className="text-xs text-muted-foreground">{appt.confirmationCode}</p>
                    </td>
                    <td className="text-sm text-foreground">{doctorLabel(appt)}</td>
                    <td className="text-sm text-muted-foreground">{appt.visitType}</td>
                    <td><Badge status={appt.status} /></td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        {active && appt.status === 'CONFIRMED' && (
                          <>
                            {!isPatient && (
                              <>
                                <button
                                  title="View"
                                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                                  onClick={() => setDetailAppt(appt)}
                                >
                                  <Eye size={15} />
                                </button>
                                <button
                                  title="Check In"
                                  className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors"
                                  onClick={() => setCheckInAppt(appt)}
                                >
                                  <UserCheck size={15} />
                                </button>
                              </>
                            )}
                            <button
                              title="Reschedule"
                              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                              onClick={() => {
                                setRescheduleAppt(appt)
                                setNewRescheduleTime(appt.appointmentTime?.slice(0, 16) || '')
                              }}
                            >
                              <RefreshCw size={15} />
                            </button>
                            {isDoctor && (
                              <button
                                title="Notify Delay"
                                className="p-1.5 rounded-md hover:bg-amber-100 text-amber-700 transition-colors"
                                onClick={() => {
                                  setDelayAppt(appt)
                                  setDelayHours(0)
                                  setDelayMinutes(15)
                                  setDelayReason('')
                                }}
                              >
                                <Clock size={15} />
                              </button>
                            )}
                          </>
                        )}
                        {!isPatient && active && (
                          <button
                            title="Print"
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                            onClick={() => handlePrintAppointment(appt)}
                          >
                            <Printer size={15} />
                          </button>
                        )}
                        {!isPatient && !active && (
                          <button
                            title="View"
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                            onClick={() => setDetailAppt(appt)}
                          >
                            <Eye size={15} />
                          </button>
                        )}
                        {active && (
                          <button
                            title="Cancel"
                            className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                            onClick={() => setSelectedAppt(appt)}
                          >
                            <X size={15} />
                          </button>
                        )}
                        {!isPatient && (
                          <button
                            title="Delete"
                            className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                            onClick={() => setDeleteAppt(appt)}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Cancel Modal */}
      <Modal isOpen={!!detailAppt} onClose={() => setDetailAppt(null)} title="Appointment Details">
        <div className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Code:</span> {detailAppt?.confirmationCode}</p>
          <p><span className="text-muted-foreground">Patient:</span> {detailAppt?.patientName}</p>
          <p><span className="text-muted-foreground">Patient No:</span> {detailAppt?.patientNumber || '-'}</p>
          <p><span className="text-muted-foreground">Doctor:</span> {doctorLabel(detailAppt)}</p>
          <p><span className="text-muted-foreground">Time:</span> {detailAppt?.appointmentTime?.replace('T', ' ')}</p>
          <p><span className="text-muted-foreground">Visit Type:</span> {detailAppt?.visitType || '-'}</p>
          <p><span className="text-muted-foreground">Reason:</span> {detailAppt?.reason || '-'}</p>
          <p><span className="text-muted-foreground">Status:</span> {detailAppt?.status}</p>
          {detailAppt?.cancellationReason && (
            <p><span className="text-muted-foreground">Cancellation Reason:</span> {detailAppt?.cancellationReason}</p>
          )}
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
                    <p className="text-xs text-muted-foreground mt-1">
                      By: {event.changedByName || 'System'}
                    </p>
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

      <Modal isOpen={!!selectedAppt} onClose={() => setSelectedAppt(null)} title="Cancel Appointment">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-destructive/5 border border-destructive/10 rounded-xl">
            <AlertCircle size={16} className="text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">
              Cancel appointment for <strong>{selectedAppt?.patientName}</strong> with {doctorLabel(selectedAppt)}?
            </p>
          </div>
          <div>
            <label className="form-label mb-1.5 block">Cancellation reason</label>
            <textarea
              className="form-input min-h-[96px] resize-none"
              placeholder="Enter a reason for cancellation"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setSelectedAppt(null)}>Keep</Button>
            <Button
              variant="danger"
              className="flex-1"
              loading={cancelMutation.isPending}
              onClick={() =>
                cancelMutation.mutate({
                  id: selectedAppt.id,
                  reason: cancelReason.trim() || (isPatient ? 'Cancelled by patient' : 'Cancelled by receptionist'),
                })
              }
            >
              Cancel Appointment
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteAppt} onClose={() => setDeleteAppt(null)} title="Delete Appointment">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-destructive/5 border border-destructive/10 rounded-xl">
            <AlertCircle size={16} className="text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">
              Permanently delete appointment for <strong>{deleteAppt?.patientName}</strong>? This cannot be undone.
            </p>
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteAppt(null)}>Cancel</Button>
            <Button
              variant="danger"
              className="flex-1"
              loading={deleteMutation.isPending}
              onClick={handleConfirmDelete}
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reschedule Modal */}
      <Modal isOpen={!!rescheduleAppt} onClose={() => setRescheduleAppt(null)} title="Reschedule Appointment">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Rescheduling appointment for <strong className="text-foreground">{rescheduleAppt?.patientName}</strong>.
          </p>
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
              Confirm Reschedule
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!delayAppt} onClose={() => setDelayAppt(null)} title="Doctor Delay Notification">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Notify <strong className="text-foreground">{delayAppt?.patientName}</strong> that doctor is delayed.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label mb-1.5 block">Delay Hours</label>
              <input
                type="number"
                min="0"
                max="8"
                className="form-input"
                value={delayHours}
                onChange={(e) => setDelayHours(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
            <div>
              <label className="form-label mb-1.5 block">Delay Minutes</label>
              <input
                type="number"
                min="0"
                max="59"
                className="form-input"
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(Math.min(59, Math.max(0, Number(e.target.value) || 0)))}
              />
            </div>
          </div>
          <div>
            <label className="form-label mb-1.5 block">Reason (optional)</label>
            <textarea
              className="form-input min-h-[88px] resize-none"
              placeholder="Doctor in another consultation / emergency..."
              value={delayReason}
              onChange={(e) => setDelayReason(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setDelayAppt(null)
                setDelayHours(0)
                setDelayMinutes(0)
                setDelayReason('')
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              loading={doctorDelayMutation.isPending}
              onClick={() => {
                const totalDelay = (Number(delayHours) || 0) * 60 + (Number(delayMinutes) || 0)
                if (totalDelay <= 0) {
                  toast.error('Please enter delay hours or minutes')
                  return
                }

                doctorDelayMutation.mutate({
                  id: delayAppt.id,
                  delayMinutesTotal: totalDelay,
                  reason: delayReason.trim(),
                })
              }}
            >
              Notify Patient
            </Button>
          </div>
        </div>
      </Modal>

      <CheckInModal
        isOpen={!!checkInAppt}
        onClose={() => setCheckInAppt(null)}
        patient={{
          firstName: checkInAppt?.patientName?.split(' ')[0],
          lastName: checkInAppt?.patientName?.split(' ').slice(1).join(' '),
          patientNumber: checkInAppt?.patientNumber || 'PENDING_ID',
        }}
        appointment={checkInAppt}
        isPending={checkInMutation.isPending}
        onConfirm={(priority) => checkInMutation.mutate({
          patientId: checkInAppt.patientId,
          appointmentId: checkInAppt.id,
          priority,
        })}
      />
    </div>
  )
}
