import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Activity, Clock, ChevronRight, User } from 'lucide-react'
import { queueApi } from '../../api/queueApi'
import { consultationApi } from '../../api/consultationApi'
import { useAuth, RoleProtected } from '../../context/AuthContext'
import Badge from '../../components/common/Badge'
import VitalsModal from './VitalsModal'

export default function QueueManagementPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user, hasAnyRole } = useAuth()
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState(null)

  const { data: queueRes, isLoading } = useQuery({
    queryKey: ['today-queue'],
    queryFn: () => queueApi.getToday(),
    refetchInterval: 10000,
  })

  const callNextMutation = useMutation({
    mutationFn: (id) => queueApi.callNext(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['today-queue'] })
      toast.success('Patient called')
      if (hasAnyRole('DOCTOR')) {
        startConsultationMutation.mutate({
          queueEntryId: res.data.id,
          appointmentId: res.data.appointmentId,
          doctorId: user.id,
        })
      }
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to call next patient')
    },
  })

  const startConsultationMutation = useMutation({
    mutationFn: (data) => consultationApi.start(data),
    onSuccess: (res) => navigate(`/consultation/${res.data.id}`),
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to start consultation')
    },
  })

  const stopMutation = useMutation({
    mutationFn: ({ id, action }) => {
      if (action === 'complete') return queueApi.complete(id)
      return queueApi.markNoShow(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-queue'] })
      toast.success('Queue updated')
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to update queue entry')
    },
  })

  const queueEntries = queueRes?.data || []
  const waiting = queueEntries.filter(e => ['WAITING', 'VITALS_PENDING', 'READY'].includes(e.status))
  const inConsultation = queueEntries.filter(e => e.status === 'IN_CONSULTATION')
  const done = queueEntries.filter(e => ['COMPLETED', 'NO_SHOW'].includes(e.status))
  const nextCallable = queueEntries.find(e => ['WAITING', 'VITALS_PENDING', 'READY'].includes(e.status))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Patient Queue</h2>
          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live  auto-updates every 10 s
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <RoleProtected allowedRoles={['NURSE', 'DOCTOR', 'RECEPTIONIST', 'ADMIN']}>
            <button
              className="btn-primary h-8 px-3 text-xs"
              onClick={() => {
                if (!nextCallable) {
                  toast('No waiting patients to call', { icon: 'ℹ️' })
                  return
                }
                callNextMutation.mutate(nextCallable.id)
              }}
              disabled={callNextMutation.isPending}
            >
              {callNextMutation.isPending ? 'Calling…' : 'Call Next Patient'}
            </button>
          </RoleProtected>
          <span className="badge-amber">{waiting.length} Waiting</span>
          <span className="badge-purple">{inConsultation.length} In consultation</span>
          <span className="badge-gray">{done.length} Done</span>
        </div>
      </div>

      {isLoading ? (
        <div className="pm-card flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : queueEntries.length === 0 ? (
        <div className="pm-card flex flex-col items-center justify-center py-16">
          <Activity size={32} className="text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">Queue is empty for today</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {queueEntries.map((entry) => {
            const isActive = entry.status === 'IN_CONSULTATION'
            return (
              <div
                key={entry.id}
                className={`pm-card p-4 flex flex-col gap-3 ${isActive ? 'ring-2 ring-primary border-primary/30' : ''}`}
              >
                {/* Top row: number + badge */}
                <div className="flex items-start justify-between">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                    {entry.queueNumber}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {entry.priority === 'EMERGENCY' && <span className="badge-red text-[10px]">Emergency</span>}
                    <Badge status={entry.status} />
                  </div>
                </div>

                {/* Patient info */}
                <div>
                  <p className="text-sm font-semibold text-foreground">{entry.patientName}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {new Date(entry.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>{entry.visitType}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-2 border-t border-border">
                  <button
                    className="btn-ghost text-xs h-8 px-2 text-muted-foreground"
                    onClick={() => navigate(`/patients/${entry.patientId}`)}
                  >
                    History
                  </button>
                  {(entry.status === 'WAITING' || entry.status === 'VITALS_PENDING') && (
                    <>
                      <RoleProtected allowedRoles={['NURSE']}>
                        <button
                          className="flex-1 btn-secondary text-xs h-8 flex items-center justify-center"
                          onClick={() => { setSelectedEntry(entry); setIsVitalsModalOpen(true) }}
                        >
                          Vitals
                        </button>
                      </RoleProtected>
                      <RoleProtected allowedRoles={['DOCTOR', 'RECEPTIONIST', 'NURSE', 'ADMIN']}>
                        <button
                          className="flex-1 btn-primary text-xs h-8 flex items-center justify-center"
                          onClick={() => callNextMutation.mutate(entry.id)}
                        >
                          {callNextMutation.isPending ? '…' : 'Call'}
                        </button>
                        <RoleProtected allowedRoles={['DOCTOR', 'RECEPTIONIST', 'ADMIN']}>
                          <button
                            className="btn-ghost text-xs h-8 px-2 text-muted-foreground"
                            onClick={() => stopMutation.mutate({ id: entry.id, action: 'noShow' })}
                          >
                            No-show
                          </button>
                        </RoleProtected>
                      </RoleProtected>
                    </>
                  )}
                  {entry.status === 'READY' && (
                    <RoleProtected allowedRoles={['DOCTOR', 'RECEPTIONIST', 'NURSE', 'ADMIN']}>
                      <button
                        className="flex-1 btn-primary text-xs h-8 flex items-center justify-center gap-1"
                        onClick={() => callNextMutation.mutate(entry.id)}
                      >
                        Call Patient <ChevronRight size={12} />
                      </button>
                    </RoleProtected>
                  )}
                  {entry.status === 'IN_CONSULTATION' && (
                    <button
                      className="flex-1 btn-primary text-xs h-8 flex items-center justify-center gap-1"
                      onClick={() => {
                        const consultationId = Number(entry.consultationId)
                        if (Number.isInteger(consultationId) && consultationId > 0) {
                          navigate(`/consultation/${consultationId}`)
                          return
                        }

                        if (!hasAnyRole('DOCTOR', 'ADMIN')) {
                          toast.error('Consultation ID is missing. Please ask doctor to start consultation.')
                          return
                        }

                        const fallbackDoctorId = Number(user?.id)
                        if (!Number.isInteger(fallbackDoctorId) || fallbackDoctorId <= 0) {
                          toast.error('Unable to detect doctor account. Please sign in again.')
                          return
                        }

                        startConsultationMutation.mutate({
                          queueEntryId: entry.id,
                          appointmentId: null,
                          doctorId: fallbackDoctorId,
                        })
                      }}
                    >
                      Go to Consultation <ChevronRight size={12} />
                    </button>
                  )}
                  {['COMPLETED', 'NO_SHOW'].includes(entry.status) && (
                    <div className="flex-1 py-1 text-center">
                      <span className="text-xs text-muted-foreground"></span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedEntry && (
        <VitalsModal
          isOpen={isVitalsModalOpen}
          onClose={() => { setIsVitalsModalOpen(false); setSelectedEntry(null) }}
          queueEntry={selectedEntry}
        />
      )}
    </div>
  )
}
