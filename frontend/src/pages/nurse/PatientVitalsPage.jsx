import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { Activity, AlertTriangle, Droplets, Heart, Search, Thermometer, User, Weight, Ruler } from 'lucide-react'
import { patientApi } from '../../api/patientApi'
import { queueApi } from '../../api/queueApi'
import { consultationApi } from '../../api/consultationApi'

function CardTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Icon size={14} className="text-primary" /> {title}
      </h3>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  )
}

function formatDate(value) {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleString()
}

export default function PatientVitalsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [editingAllergyId, setEditingAllergyId] = useState(null)
  const [historyDateFrom, setHistoryDateFrom] = useState('')
  const [historyDateTo, setHistoryDateTo] = useState('')

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      bloodPressureSystolic: '',
      bloodPressureDiastolic: '',
      heartRate: '',
      temperature: '',
      height: '',
      weight: '',
      allergen: '',
      severity: 'MILD',
      reaction: '',
    },
  })

  const { data: patientsRes, isLoading: isLoadingPatients } = useQuery({
    queryKey: ['nurse-vitals-patients'],
    queryFn: () => patientApi.getAll(),
    staleTime: 60 * 1000,
  })

  const { data: queueRes, isLoading: isLoadingQueue } = useQuery({
    queryKey: ['today-queue'],
    queryFn: () => queueApi.getToday(),
    refetchInterval: 10000,
  })

  const patients = Array.isArray(patientsRes?.data) ? patientsRes.data : []
  const queueEntries = Array.isArray(queueRes?.data) ? queueRes.data : []

  const activeQueueByPatient = useMemo(() => {
    const map = new Map()
    queueEntries.forEach((entry) => {
      if (!entry?.patientId) return
      if (!['WAITING', 'VITALS_PENDING', 'READY'].includes(entry.status)) return
      const existing = map.get(entry.patientId)
      if (!existing || (entry.id || 0) > (existing.id || 0)) {
        map.set(entry.patientId, entry)
      }
    })
    return map
  }, [queueEntries])

  const filteredPatients = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return patients
    return patients.filter((patient) => {
      const name = `${patient.firstName || ''} ${patient.lastName || ''}`.toLowerCase()
      return (
        name.includes(q)
        || String(patient.patientNumber || '').toLowerCase().includes(q)
        || String(patient.nicNumber || '').toLowerCase().includes(q)
      )
    })
  }, [patients, search])

  const selectedPatient = useMemo(() => {
    const id = Number(selectedPatientId)
    if (!Number.isInteger(id) || id <= 0) return null
    return patients.find((patient) => patient.id === id) || null
  }, [selectedPatientId, patients])

  const selectedQueueEntry = useMemo(() => {
    if (!selectedPatient) return null
    return activeQueueByPatient.get(selectedPatient.id) || null
  }, [selectedPatient, activeQueueByPatient])

  const { data: historyRes, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['nurse-patient-history', selectedPatient?.id],
    queryFn: () => consultationApi.getPatientHistory(selectedPatient.id),
    enabled: !!selectedPatient?.id,
    staleTime: 60 * 1000,
  })

  const history = Array.isArray(historyRes?.data) ? historyRes.data : []

  const latestRecordedVitals = useMemo(() => {
    return history.find((record) => record?.vitalSigns) || null
  }, [history])

  const isDateRangeInvalid = historyDateFrom && historyDateTo && historyDateFrom > historyDateTo

  const filteredHistory = useMemo(() => {
    if (isDateRangeInvalid) return []

    return history.filter((record) => {
      if (!record?.startedAt) return false
      const date = new Date(record.startedAt)
      if (Number.isNaN(date.getTime())) return false

      if (historyDateFrom) {
        const from = new Date(`${historyDateFrom}T00:00:00`)
        if (date < from) return false
      }

      if (historyDateTo) {
        const to = new Date(`${historyDateTo}T23:59:59`)
        if (date > to) return false
      }

      return true
    })
  }, [history, historyDateFrom, historyDateTo, isDateRangeInvalid])

  const vitalsMutation = useMutation({
    mutationFn: (payload) => queueApi.recordVitals(selectedQueueEntry.id, payload),
    onSuccess: () => {
      toast.success('Vitals saved successfully')
      queryClient.invalidateQueries({ queryKey: ['today-queue'] })
      queryClient.invalidateQueries({ queryKey: ['nurse-patient-history', selectedPatient?.id] })
      reset({
        ...getValues(),
        bloodPressureSystolic: '',
        bloodPressureDiastolic: '',
        heartRate: '',
        temperature: '',
        height: '',
        weight: '',
      })
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to save vitals')
    },
  })

  const allergyMutation = useMutation({
    mutationFn: (payload) => patientApi.addAllergy(selectedPatient.id, payload),
    onSuccess: () => {
      toast.success('Allergy information updated')
      queryClient.invalidateQueries({ queryKey: ['nurse-vitals-patients'] })
      setEditingAllergyId(null)
      reset({
        ...getValues(),
        allergen: '',
        severity: 'MILD',
        reaction: '',
      })
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to update allergy')
    },
  })

  const editAllergyMutation = useMutation({
    mutationFn: ({ allergyId, payload }) => patientApi.updateAllergy(selectedPatient.id, allergyId, payload),
    onSuccess: () => {
      toast.success('Allergy updated successfully')
      queryClient.invalidateQueries({ queryKey: ['nurse-vitals-patients'] })
      setEditingAllergyId(null)
      reset({
        ...getValues(),
        allergen: '',
        severity: 'MILD',
        reaction: '',
      })
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to update allergy')
    },
  })

  const onSubmitVitals = (data) => {
    if (!selectedPatient) {
      toast.error('Please select a patient first')
      return
    }
    if (!selectedQueueEntry) {
      toast.error('Selected patient is not in active queue for vitals')
      return
    }

    const normalizeOptionalNumber = (value) => {
      if (value === '' || value == null || Number.isNaN(value)) return null
      return Number(value)
    }

    vitalsMutation.mutate({
      bloodPressureSystolic: Number(data.bloodPressureSystolic),
      bloodPressureDiastolic: Number(data.bloodPressureDiastolic),
      heartRate: Number(data.heartRate),
      temperature: Number(data.temperature),
      height: normalizeOptionalNumber(data.height),
      weight: normalizeOptionalNumber(data.weight),
      respiratoryRate: null,
      oxygenSaturation: null,
      painScale: 0,
      symptoms: '',
      notes: '',
    })
  }

  const onSubmitAllergy = (data) => {
    if (!selectedPatient) {
      toast.error('Please select a patient first')
      return
    }

    const payload = {
      allergen: data.allergen.trim(),
      severity: data.severity,
      reaction: data.reaction?.trim() || '',
    }

    if (editingAllergyId) {
      editAllergyMutation.mutate({ allergyId: editingAllergyId, payload })
      return
    }

    allergyMutation.mutate(payload)
  }

  const beginEditAllergy = (allergy) => {
    setEditingAllergyId(allergy.id)
    reset({
      ...getValues(),
      allergen: allergy.allergen || '',
      severity: allergy.severity || 'MILD',
      reaction: allergy.reaction || '',
    })
  }

  const cancelEditAllergy = () => {
    setEditingAllergyId(null)
    reset({
      ...getValues(),
      allergen: '',
      severity: 'MILD',
      reaction: '',
    })
  }

  const isBusy = isLoadingPatients || isLoadingQueue

  return (
    <div className="space-y-5">
      <div className="pm-card p-5">
        <h2 className="text-lg font-semibold text-foreground">Patient Vitals</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select a patient from active queue, capture vitals, update allergy information, and review history.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <aside className="xl:col-span-4 space-y-4">
          <div className="pm-card p-4">
            <CardTitle icon={User} title="Select Patient" subtitle="Select any patient. Vitals save requires active queue entry." />
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                className="form-input pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, number, NIC"
              />
            </div>

            {isBusy ? (
              <div className="py-8 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : filteredPatients.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No patients found</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
                {filteredPatients.map((patient) => {
                  const active = String(patient.id) === selectedPatientId
                  const queueEntry = activeQueueByPatient.get(patient.id)
                  return (
                    <button
                      key={patient.id}
                      type="button"
                      className={`w-full text-left rounded-lg border p-3 transition-colors ${
                        active ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-muted/30'
                      }`}
                      onClick={() => setSelectedPatientId(String(patient.id))}
                    >
                      <p className="text-sm font-semibold text-foreground">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{patient.patientNumber || '-'}</p>
                      {queueEntry ? (
                        <p className="text-[11px] text-primary mt-1">Queue #{queueEntry.queueNumber}</p>
                      ) : (
                        <p className="text-[11px] text-amber-600 mt-1">No active queue entry</p>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {selectedPatient && (
            <div className="pm-card p-4">
              <CardTitle icon={AlertTriangle} title="Allergy Information" subtitle="Add or edit allergy records" />
              <form className="space-y-3" onSubmit={handleSubmit(onSubmitAllergy)}>
                <div>
                  <label className="form-label">Allergen *</label>
                  <input
                    className="form-input mt-1"
                    placeholder="e.g. Penicillin"
                    {...register('allergen', {
                      required: 'Allergen is required',
                      validate: (value) => value.trim().length > 0 || 'Allergen is required',
                      maxLength: { value: 120, message: 'Maximum length is 120' },
                    })}
                  />
                  {errors.allergen && <p className="mt-1 text-xs text-destructive">{errors.allergen.message}</p>}
                </div>
                <div>
                  <label className="form-label">Severity *</label>
                  <select className="form-input mt-1" {...register('severity', { required: 'Severity is required' })}>
                    <option value="MILD">Mild</option>
                    <option value="MODERATE">Moderate</option>
                    <option value="SEVERE">Severe</option>
                    <option value="LIFE_THREATENING">Life Threatening</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Reaction (optional)</label>
                  <textarea
                    rows={2}
                    className="form-input mt-1 resize-none"
                    placeholder="Observed reaction"
                    {...register('reaction', {
                      maxLength: { value: 200, message: 'Maximum length is 200' },
                    })}
                  />
                  {errors.reaction && <p className="mt-1 text-xs text-destructive">{errors.reaction.message}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn-primary h-9 px-4 text-sm flex-1"
                    type="submit"
                    disabled={allergyMutation.isPending || editAllergyMutation.isPending}
                  >
                    {allergyMutation.isPending || editAllergyMutation.isPending
                      ? 'Saving'
                      : editingAllergyId
                        ? 'Save Allergy Changes'
                        : 'Add Allergy'}
                  </button>
                  {editingAllergyId && (
                    <button type="button" className="btn-secondary h-9 px-4 text-sm" onClick={cancelEditAllergy}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-xs font-medium text-foreground mb-2">Current allergies (read-only)</p>
                {selectedPatient.allergies?.length ? (
                  <div className="space-y-2 max-h-36 overflow-y-auto no-scrollbar">
                    {selectedPatient.allergies.map((allergy, index) => (
                      <div key={`${allergy.id || index}-${index}`} className="rounded-lg border border-border p-2 text-xs bg-muted/20">
                        <p className="font-medium text-foreground">{allergy.allergen}</p>
                        <p className="text-amber-600">{allergy.severity}</p>
                        {allergy.reaction && <p className="text-muted-foreground">{allergy.reaction}</p>}
                        <div className="mt-2">
                          <button
                            type="button"
                            className="btn-secondary h-7 px-2 text-[11px]"
                            onClick={() => beginEditAllergy(allergy)}
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No allergies recorded</p>
                )}
              </div>
            </div>
          )}
        </aside>

        <main className="xl:col-span-8 space-y-4">
          <div className="pm-card p-5">
            <CardTitle icon={Heart} title="Last Recorded Vitals" subtitle="Most recent vitals captured for selected patient" />
            {!selectedPatient ? (
              <p className="text-xs text-muted-foreground">Select a patient to view latest vitals.</p>
            ) : !latestRecordedVitals?.vitalSigns ? (
              <p className="text-xs text-muted-foreground">No previously recorded vitals found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs">
                  <p className="text-muted-foreground">Recorded At</p>
                  <p className="font-semibold text-foreground mt-1">{formatDate(latestRecordedVitals.startedAt)}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs">
                  <p className="text-muted-foreground">Heart Rate</p>
                  <p className="font-semibold text-foreground mt-1">{latestRecordedVitals.vitalSigns.heartRate ?? '-'} bpm</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs">
                  <p className="text-muted-foreground">Blood Pressure</p>
                  <p className="font-semibold text-foreground mt-1">
                    {latestRecordedVitals.vitalSigns.bloodPressureSystolic ?? '-'} / {latestRecordedVitals.vitalSigns.bloodPressureDiastolic ?? '-'}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs">
                  <p className="text-muted-foreground">Temperature</p>
                  <p className="font-semibold text-foreground mt-1">{latestRecordedVitals.vitalSigns.temperature ?? '-'} C</p>
                </div>
              </div>
            )}
          </div>

          <div className="pm-card p-5">
            <CardTitle icon={Activity} title="Vitals Entry" subtitle="Heart rate, blood pressure, and temperature are mandatory" />
            {!selectedPatient ? (
              <div className="text-xs text-muted-foreground py-6 text-center border border-dashed border-border rounded-lg">
                Select a patient to start entering vitals.
              </div>
            ) : !selectedQueueEntry ? (
              <div className="text-xs text-amber-600 py-6 text-center border border-dashed border-amber-500/30 rounded-lg bg-amber-500/5">
                Selected patient is not in active queue. Vitals can be saved only for active queue patients.
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmitVitals)} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Systolic BP (mmHg) *</label>
                    <input
                      type="number"
                      className="form-input mt-1"
                      placeholder="120"
                      {...register('bloodPressureSystolic', {
                        required: 'Systolic BP is required',
                        valueAsNumber: true,
                        min: { value: 70, message: 'Minimum is 70' },
                        max: { value: 250, message: 'Maximum is 250' },
                        validate: (value) => {
                          const diastolic = Number(getValues('bloodPressureDiastolic'))
                          if (Number.isFinite(diastolic) && value <= diastolic) {
                            return 'Systolic should be greater than diastolic'
                          }
                          return true
                        },
                      })}
                    />
                    {errors.bloodPressureSystolic && <p className="mt-1 text-xs text-destructive">{errors.bloodPressureSystolic.message}</p>}
                  </div>

                  <div>
                    <label className="form-label">Diastolic BP (mmHg) *</label>
                    <input
                      type="number"
                      className="form-input mt-1"
                      placeholder="80"
                      {...register('bloodPressureDiastolic', {
                        required: 'Diastolic BP is required',
                        valueAsNumber: true,
                        min: { value: 40, message: 'Minimum is 40' },
                        max: { value: 150, message: 'Maximum is 150' },
                        validate: (value) => {
                          const systolic = Number(getValues('bloodPressureSystolic'))
                          if (Number.isFinite(systolic) && value >= systolic) {
                            return 'Diastolic should be less than systolic'
                          }
                          return true
                        },
                      })}
                    />
                    {errors.bloodPressureDiastolic && <p className="mt-1 text-xs text-destructive">{errors.bloodPressureDiastolic.message}</p>}
                  </div>

                  <div>
                    <label className="form-label">Heart Rate (bpm) *</label>
                    <input
                      type="number"
                      className="form-input mt-1"
                      placeholder="72"
                      {...register('heartRate', {
                        required: 'Heart rate is required',
                        valueAsNumber: true,
                        min: { value: 30, message: 'Minimum is 30' },
                        max: { value: 220, message: 'Maximum is 220' },
                      })}
                    />
                    {errors.heartRate && <p className="mt-1 text-xs text-destructive">{errors.heartRate.message}</p>}
                  </div>

                  <div>
                    <label className="form-label">Body Temperature (C) *</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input mt-1"
                      placeholder="37.0"
                      {...register('temperature', {
                        required: 'Temperature is required',
                        valueAsNumber: true,
                        min: { value: 30, message: 'Minimum is 30.0' },
                        max: { value: 45, message: 'Maximum is 45.0' },
                      })}
                    />
                    {errors.temperature && <p className="mt-1 text-xs text-destructive">{errors.temperature.message}</p>}
                  </div>

                  <div>
                    <label className="form-label">Height (cm) optional</label>
                    <div className="relative mt-1">
                      <Ruler size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="number"
                        step="0.1"
                        className="form-input pl-9"
                        placeholder="170"
                        {...register('height', {
                          setValueAs: (value) => (value === '' ? null : Number(value)),
                          min: { value: 30, message: 'Minimum is 30.0' },
                          max: { value: 300, message: 'Maximum is 300.0' },
                        })}
                      />
                    </div>
                    {errors.height && <p className="mt-1 text-xs text-destructive">{errors.height.message}</p>}
                  </div>

                  <div>
                    <label className="form-label">Weight (kg) optional</label>
                    <div className="relative mt-1">
                      <Weight size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="number"
                        step="0.1"
                        className="form-input pl-9"
                        placeholder="70"
                        {...register('weight', {
                          setValueAs: (value) => (value === '' ? null : Number(value)),
                          min: { value: 1, message: 'Minimum is 1.0' },
                          max: { value: 500, message: 'Maximum is 500.0' },
                        })}
                      />
                    </div>
                    {errors.weight && <p className="mt-1 text-xs text-destructive">{errors.weight.message}</p>}
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex justify-end">
                  <button className="btn-primary h-9 px-4 text-sm" type="submit" disabled={vitalsMutation.isPending}>
                    {vitalsMutation.isPending ? 'Saving' : 'Save Vitals'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="pm-card p-5">
            <CardTitle icon={Thermometer} title="Patient History (Read-only)" subtitle="Latest consultations for selected patient" />

            {selectedPatient && (
              <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">From Date</label>
                  <input
                    type="date"
                    className="form-input mt-1"
                    value={historyDateFrom}
                    onChange={(e) => setHistoryDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">To Date</label>
                  <input
                    type="date"
                    className="form-input mt-1"
                    value={historyDateTo}
                    onChange={(e) => setHistoryDateTo(e.target.value)}
                  />
                </div>
                {isDateRangeInvalid && (
                  <p className="text-xs text-destructive sm:col-span-2">From date should be earlier than or equal to To date.</p>
                )}
              </div>
            )}

            {!selectedPatient ? (
              <p className="text-xs text-muted-foreground py-6 text-center border border-dashed border-border rounded-lg">
                Select a patient to view history.
              </p>
            ) : isLoadingHistory ? (
              <div className="py-8 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : filteredHistory.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center border border-dashed border-border rounded-lg">
                No consultation history available for selected date range.
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
                {filteredHistory.map((record) => (
                  <div key={record.id} className="rounded-lg border border-border p-3 bg-muted/20">
                    <div className="flex items-center justify-between gap-2 text-xs mb-1">
                      <span className="font-medium text-primary">{formatDate(record.startedAt)}</span>
                      <span className="text-muted-foreground">Dr. {record.doctorName || '-'}</span>
                    </div>
                    <p className="text-xs text-foreground/80">
                      <span className="font-semibold">Diagnosis:</span> {record.diagnosis || 'Not recorded'}
                    </p>
                    {record.notes && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{record.notes}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Heart size={11} /> HR: {record?.vitalSigns?.heartRate ?? '-'}</span>
                      <span className="inline-flex items-center gap-1"><Droplets size={11} /> BP: {record?.vitalSigns ? `${record.vitalSigns.bloodPressureSystolic || '-'} / ${record.vitalSigns.bloodPressureDiastolic || '-'}` : '-'}</span>
                      <span className="inline-flex items-center gap-1"><Thermometer size={11} /> Temp: {record?.vitalSigns?.temperature ?? '-'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
