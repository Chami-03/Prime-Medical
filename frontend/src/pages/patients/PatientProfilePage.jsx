import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import {
  Calendar, User, Phone, Mail, MapPin, AlertTriangle,
  Printer, Plus, Clock, FileText, Activity, X
} from 'lucide-react'
import { patientApi } from '../../api/patientApi'
import { consultationApi } from '../../api/consultationApi'
import { RoleProtected } from '../../context/AuthContext'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'

export default function PatientProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [allergyModal, setAllergyModal] = useState(false)

  const { data: patientRes, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientApi.getById(id),
  })

  const { data: historyRes, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['patient-history', id],
    queryFn: () => consultationApi.getPatientHistory(id),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  const allergyMutation = useMutation({
    mutationFn: (data) => patientApi.addAllergy(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', id] })
      toast.success('Allergy added')
      setAllergyModal(false)
      reset()
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to add allergy')
    },
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  )

  const patient = patientRes

  if (!patient) return (
    <div className="pm-card flex flex-col items-center justify-center py-16 text-center">
      <AlertTriangle size={32} className="text-destructive/40 mb-2" />
      <p className="text-sm font-medium text-foreground">Patient not found</p>
      <button className="btn-secondary mt-4 h-9 px-4 text-sm" onClick={() => navigate('/patients')}>
        Back to directory
      </button>
    </div>
  )

  const history = Array.isArray(historyRes) ? historyRes : historyRes?.data || []

  return (
    <div className="space-y-5">
      {/* Profile header */}
      <div className="pm-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl font-semibold uppercase flex-shrink-0">
              {patient.firstName?.[0]}{patient.lastName?.[0]}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {patient.firstName} {patient.lastName}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar size={13} />
                  {patient.dateOfBirth}
                  {patient.age && <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded font-medium">{patient.age}y</span>}
                </span>
                <span className="flex items-center gap-1">
                  <User size={13} />
                  {patient.gender}
                </span>
                <span className="font-mono text-xs">{patient.nicNumber}</span>
                <span className="font-mono text-xs text-primary">{patient.patientNumber}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <RoleProtected allowedRoles={['DOCTOR', 'RECEPTIONIST']}>
              <button
                className="btn-primary h-9 px-3 text-sm flex items-center gap-1.5"
                onClick={() => navigate('/appointments/book', { state: { patient } })}
              >
                <Calendar size={14} />
                Book Appointment
              </button>
            </RoleProtected>
            <button
              className="btn-secondary h-9 px-3 text-sm flex items-center gap-1.5"
              onClick={() => window.print()}
            >
              <Printer size={14} />
              Print
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="space-y-4">
          {/* Contact */}
          <div className="pm-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Phone size={14} className="text-muted-foreground" />
              Contact
            </h3>
            <div className="space-y-2.5 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                <p className="font-medium text-foreground">{patient.phone || ''}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                <p className="font-medium text-foreground break-all">{patient.email || ''}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Address</p>
                <p className="text-foreground/80 leading-relaxed">{patient.address || ''}</p>
              </div>
            </div>
          </div>

          {/* Emergency contact */}
          <div className="pm-card p-4 bg-destructive/5 border-destructive/10">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle size={14} className="text-destructive" />
              Emergency Contact
            </h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground">{patient.emergencyContactName || ''}</p>
              <p className="text-muted-foreground font-mono">{patient.emergencyContactPhone || ''}</p>
            </div>
          </div>

          {/* Allergies */}
          <div className="pm-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <X size={14} className="text-red-500" />
                Allergies
              </h3>
              <RoleProtected allowedRoles={['DOCTOR', 'NURSE']}>
                <button
                  className="h-7 px-2 text-xs btn-secondary flex items-center gap-1"
                  onClick={() => setAllergyModal(true)}
                >
                  <Plus size={11} /> Add
                </button>
              </RoleProtected>
            </div>
            {patient.allergies?.length > 0 ? (
              <div className="space-y-2">
                {patient.allergies.map((a, idx) => (
                  <div key={idx} className="p-2.5 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800/30 text-sm">
                    <p className="font-medium text-foreground">{a.allergen}</p>
                    <p className="text-xs text-red-600 dark:text-red-400">{a.severity}</p>
                    {a.reaction && <p className="text-xs text-muted-foreground mt-0.5">{a.reaction}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-2 text-center">No known allergies</p>
            )}
          </div>
        </div>

        {/* Right: history */}
        <div className="lg:col-span-2">
          <div className="pm-card overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <FileText size={15} className="text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Consultation History</h3>
              <span className="ml-auto text-xs text-muted-foreground">{history.length} visits</span>
            </div>

            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Activity size={28} className="text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No consultation history yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {history.map(visit => (
                  <div key={visit.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">Dr. {visit.doctorName || '-'}</span>
                          <Badge status="COMPLETED" />
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock size={11} />
                          {visit.startedAt?.split('T')[0]}
                        </p>
                        {visit.diagnosis && (
                          <p className="text-sm text-foreground/80 mt-1">{visit.diagnosis}</p>
                        )}
                        {visit.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{visit.notes}</p>
                        )}
                      </div>
                      {visit.vitals && (
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                          {visit.vitals.bloodPressure && <span>BP {visit.vitals.bloodPressure}</span>}
                          {visit.vitals.temperature && <span>{visit.vitals.temperature}C</span>}
                          {visit.vitals.weight && <span>{visit.vitals.weight}kg</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Allergy modal */}
      <Modal isOpen={allergyModal} onClose={() => setAllergyModal(false)} title="Add Allergy">
        <form
          onSubmit={handleSubmit((d) =>
            allergyMutation.mutate({
              allergen: d.allergen.trim(),
              severity: d.severity,
              reaction: d.reaction?.trim() || '',
            })
          )}
          className="space-y-4"
        >
          <div>
            <label className="form-label">Allergen *</label>
            <input
              className="form-input mt-1"
              placeholder="e.g. Penicillin, Peanuts"
              {...register('allergen', {
                required: 'Allergen is required',
                validate: (value) => value.trim().length > 0 || 'Allergen is required',
                maxLength: { value: 120, message: 'Allergen must be 120 characters or less' },
              })}
            />
            {errors.allergen && <p className="mt-1 text-xs text-destructive">{errors.allergen.message}</p>}
          </div>
          <div>
            <label className="form-label">Severity *</label>
            <select className="form-input mt-1" {...register('severity', { required: 'Severity is required' })}>
              <option value="">Select severity</option>
              <option value="MILD">Mild</option>
              <option value="MODERATE">Moderate</option>
              <option value="SEVERE">Severe</option>
              <option value="LIFE_THREATENING">Life-threatening</option>
            </select>
            {errors.severity && <p className="mt-1 text-xs text-destructive">{errors.severity.message}</p>}
          </div>
          <div>
            <label className="form-label">Reaction (optional)</label>
            <input
              className="form-input mt-1"
              placeholder="Describe the reaction"
              {...register('reaction', {
                maxLength: { value: 240, message: 'Reaction must be 240 characters or less' },
              })}
            />
            {errors.reaction && <p className="mt-1 text-xs text-destructive">{errors.reaction.message}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1 h-10 text-sm" onClick={() => setAllergyModal(false)}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-danger flex-1 h-10 text-sm disabled:opacity-40"
              disabled={allergyMutation.isPending}
            >
              {allergyMutation.isPending ? 'Adding' : 'Add Allergy'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
