import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { consultationApi } from '../../api/consultationApi'
import { prescriptionApi } from '../../api/prescriptionApi'
import { RoleProtected } from '../../context/AuthContext'
import Modal from '../../components/common/Modal'
import { User, Thermometer, Heart, Activity, Weight, Ruler, Wind, Stethoscope, Clock, FileText, Lock, FilePlus } from 'lucide-react'

function VitalCard({ label, value, unit, icon: Icon }) {
  return (
    <div className="bg-muted/40 rounded-xl p-3 flex flex-col gap-1 border border-border/50">
      <span className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1">
        {Icon && <Icon size={10} />} {label}
      </span>
      <span className="text-base font-bold text-primary tabular-nums">
        {value ?? <span className="text-muted-foreground/40"></span>}
        {value && <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>}
      </span>
    </div>
  )
}

function NoteField({ label, rows = 3, register: reg, placeholder }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <textarea rows={rows} className="form-input resize-none mt-1" placeholder={placeholder} {...reg} />
    </div>
  )
}

export default function ConsultationPage() {
  const { id } = useParams()
  const consultationIdNum = Number(id)
  const hasValidConsultationId = Number.isInteger(consultationIdNum) && consultationIdNum > 0
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEndModalOpen, setIsEndModalOpen] = useState(false)

  const { data: consultationRes, isLoading } = useQuery({
    queryKey: ['consultation', consultationIdNum],
    queryFn: () => consultationApi.getById(consultationIdNum),
    enabled: hasValidConsultationId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 60 * 1000,
  })
  const consultation = consultationRes?.data

  const { data: prescriptionByConsultationRes } = useQuery({
    queryKey: ['prescription-by-consultation', consultationIdNum],
    queryFn: () => prescriptionApi.getByConsultation(consultationIdNum),
    enabled: hasValidConsultationId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 60 * 1000,
  })

  const existingPrescription = prescriptionByConsultationRes?.data || null

  const { data: historyRes } = useQuery({
    queryKey: ['patient-history', consultation?.patientId],
    queryFn: () => consultationApi.getPatientHistory(consultation.patientId),
    enabled: !!consultation?.patientId,
  })
  const history = Array.isArray(historyRes) ? historyRes : historyRes?.data || []

  const { register, handleSubmit, reset, getValues } = useForm({
    defaultValues: { symptoms: '', examination: '', treatment: '', diagnosis: '', notes: '', isConfidential: false },
  })

  useEffect(() => {
    if (consultation) {
      reset({
        symptoms: consultation.symptoms || '',
        examination: consultation.examination || '',
        treatment: consultation.treatment || '',
        diagnosis: consultation.diagnosis || '',
        notes: consultation.notes || '',
        isConfidential: consultation.isConfidential || false,
      })
    }
  }, [consultation, reset])

  const notesMutation = useMutation({
    mutationFn: (data) => {
      if (!hasValidConsultationId) {
        throw new Error('Invalid consultation id')
      }
      return consultationApi.updateNotes(consultationIdNum, data)
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['consultation', consultationIdNum] }); toast.success('Consultation notes saved successfully') },
    onError: (err) => {
      if (err?.message === 'Invalid consultation id') {
        toast.error('Invalid consultation. Please open it again from Queue.')
        return
      }
      toast.error(err?.response?.data?.message || 'Failed to save consultation notes')
    },
  })

  const saveNotesAndOpenPrescription = async (targetUrl) => {
    if (!hasValidConsultationId) {
      toast.error('Invalid consultation. Please open it again from Queue.')
      return
    }
    try {
      await notesMutation.mutateAsync(getValues())
      navigate(targetUrl)
    } catch {
      // onError handler already shows toast, keep user on page.
    }
  }

  const endMutation = useMutation({
    mutationFn: () => consultationApi.end(consultationIdNum),
    onSuccess: () => { toast.success('Consultation finalized'); navigate('/queue') },
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  )

  const v = consultation?.vitalSigns

  return (
    <div className="space-y-5 pb-10">
      {/* Patient header */}
      <div className="pm-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl font-bold text-primary shrink-0">
            {consultation?.patientName?.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">{consultation?.patientName}</h2>
              <span className="badge-green text-[10px] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> In Progress
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {consultation?.patientAge}y  {consultation?.patientGender}  <span className="font-mono text-primary">#{consultation?.patientNumber}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="btn-secondary h-9 px-4 text-sm" onClick={() => navigate(`/patients/${consultation?.patientId}`)}>
            Patient Profile
          </button>
          <button className="btn-danger h-9 px-4 text-sm" onClick={() => setIsEndModalOpen(true)}>
            End Consultation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: vitals + history */}
        <aside className="lg:col-span-4 space-y-4">
          {/* Vitals */}
          <div className="pm-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Thermometer size={14} className="text-primary" /> Patient Vitals
            </h3>
            {!v ? (
              <div className="py-8 text-center border-2 border-dashed border-border rounded-xl">
                <p className="text-xs text-muted-foreground">No vitals recorded yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <VitalCard label="Blood Pressure" value={`${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`} unit="mmHg" icon={Activity} />
                <VitalCard label="Heart Rate" value={v.heartRate} unit="bpm" icon={Heart} />
                <VitalCard label="Temperature" value={v.temperature} unit="C" icon={Thermometer} />
                <VitalCard label="SpO" value={v.oxygenSaturation} unit="%" icon={Wind} />
                <VitalCard label="Weight" value={v.weight} unit="kg" icon={Weight} />
                <VitalCard label="Height" value={v.height} unit="cm" icon={Ruler} />
                {v.respiratoryRate && <VitalCard label="Resp. Rate" value={v.respiratoryRate} unit="/min" icon={Wind} />}
                {v.painScale != null && <VitalCard label="Pain Scale" value={`${v.painScale}/10`} unit="" icon={Stethoscope} />}
              </div>
            )}
          </div>

          {/* Past history */}
          {history.filter(h => h.id !== parseInt(id)).length > 0 && (
            <div className="pm-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <FileText size={14} className="text-primary" /> Past Consultations
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
                {history.filter(h => h.id !== parseInt(id)).map((rec, i) => (
                  <div key={i} className="rounded-xl border border-border bg-muted/20 p-3 text-xs">
                    <div className="flex justify-between text-muted-foreground mb-1">
                      <span className="font-medium text-primary">{new Date(rec.startedAt).toLocaleDateString()}</span>
                      <span>Dr. {rec.doctorName || '-'}</span>
                    </div>
                    <p className="text-foreground/70 italic line-clamp-2">"{rec.diagnosis || 'No diagnosis recorded'}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Right: notes form */}
        <main className="lg:col-span-8">
          <div className="pm-card p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText size={14} className="text-primary" /> Consultation Notes
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock size={12} /> <span>Session active</span>
              </div>
            </div>

            <form onSubmit={handleSubmit(d => notesMutation.mutate(d))} className="space-y-4">
              <NoteField label="Patient Symptoms" rows={3} register={register('symptoms')} placeholder="Describe symptoms and patient complaints" />
              <NoteField label="Physical Examination" rows={3} register={register('examination')} placeholder="Record physical examination findings" />

              <div>
                <label className="form-label">Diagnosis</label>
                <input className="form-input mt-1 font-semibold text-primary" placeholder="Enter final diagnosis" {...register('diagnosis')} />
              </div>

              <NoteField label="Treatment Plan" rows={3} register={register('treatment')} placeholder="Medications, procedures, and advice" />
              <NoteField label="Doctor's Notes" rows={5} register={register('notes')} placeholder="Detailed clinical notes" />

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 border-t border-border gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-destructive">
                  <input type="checkbox" className="rounded accent-destructive" {...register('isConfidential')} />
                  <Lock size={12} /> Confidential  visible to authorized staff only
                </label>

                <div className="flex gap-2">
                  <RoleProtected allowedRoles={['DOCTOR']}>
                    {existingPrescription ? (
                      <button
                        type="button"
                        className="btn-secondary h-9 px-4 text-sm flex items-center gap-1.5"
                        disabled={notesMutation.isPending}
                        onClick={() => saveNotesAndOpenPrescription(`/prescription/${existingPrescription.id}`)}
                      >
                        <FilePlus size={14} /> View/Edit Prescription
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-secondary h-9 px-4 text-sm flex items-center gap-1.5"
                        disabled={notesMutation.isPending}
                        onClick={() => saveNotesAndOpenPrescription(`/prescription/new?consultationId=${id}`)}
                      >
                        <FilePlus size={14} /> New Prescription
                      </button>
                    )}
                  </RoleProtected>
                  <RoleProtected allowedRoles={['DOCTOR', 'NURSE']}>
                    <button type="submit" className="btn-primary h-9 px-4 text-sm disabled:opacity-40" disabled={notesMutation.isPending}>
                      {notesMutation.isPending ? 'Saving' : 'Save Notes'}
                    </button>
                  </RoleProtected>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>

      {/* End consultation modal */}
      <Modal isOpen={isEndModalOpen} onClose={() => setIsEndModalOpen(false)} title="Finish Consultation">
        <div className="space-y-4">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-600">
            Finishing this consultation will permanently save all notes to the patient's medical record. Please ensure all information is correct before proceeding.
          </div>
          <ul className="space-y-2 text-sm">
            {['Calculating consultation time', 'Updating patient medical history', 'Sending billing info to accounts'].map((step, i) => (
              <li key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border text-muted-foreground">
                <span className="w-6 h-6 rounded-lg bg-card border border-border text-[10px] font-bold text-primary flex items-center justify-center shrink-0">{i + 1}</span>
                {step}
              </li>
            ))}
          </ul>
          <div className="flex gap-3 pt-2">
            <button className="btn-secondary flex-1 h-10 text-sm" onClick={() => setIsEndModalOpen(false)}>Go Back</button>
            <button className="btn-danger flex-1 h-10 text-sm disabled:opacity-40" disabled={endMutation.isPending} onClick={() => endMutation.mutate()}>
              {endMutation.isPending ? 'Ending' : 'Confirm & End'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}