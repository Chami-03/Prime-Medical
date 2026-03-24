import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { queueApi } from '../../api/queueApi'
import Modal from '../../components/common/Modal'

function VField({ label, children }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  )
}

export default function VitalsModal({ isOpen, onClose, queueEntry }) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    getValues,
    formState: { errors },
  } = useForm()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (isOpen && queueEntry) {
      reset({
        bloodPressureSystolic: '', bloodPressureDiastolic: '',
        heartRate: '', temperature: '', weight: '', height: '',
        oxygenSaturation: '', respiratoryRate: '', painScale: 0, symptoms: '',
      })
    }
  }, [isOpen, queueEntry, reset])

  const vitalsMutation = useMutation({
    mutationFn: (data) => queueApi.recordVitals(queueEntry.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-queue'] })
      toast.success('Vitals saved — patient ready')
      onClose()
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to save vitals')
    },
  })

  const weight = watch('weight')
  const height = watch('height')
  const bmi = weight && height ? (parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2)).toFixed(1) : null
  const bmiCategory = !bmi ? null : bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'
  const bmiColor = !bmiCategory ? 'text-muted-foreground border-border'
    : bmiCategory === 'Normal' ? 'text-emerald-600 border-emerald-500/40 bg-emerald-500/5'
    : bmiCategory === 'Underweight' ? 'text-amber-600 border-amber-500/40 bg-amber-500/5'
    : 'text-destructive border-destructive/40 bg-destructive/5'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Enter Vitals — ${queueEntry?.patientName || ''}`}>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        {/* Vitals form */}
        <form
          id="vitals-form"
          className="md:col-span-3 space-y-3"
          onSubmit={handleSubmit((d) => {
            const normalizeOptionalNumber = (value) => {
              if (value === '' || value == null || Number.isNaN(value)) return null
              return Number(value)
            }

            vitalsMutation.mutate({
              bloodPressureSystolic: Number(d.bloodPressureSystolic),
              bloodPressureDiastolic: Number(d.bloodPressureDiastolic),
              heartRate: Number(d.heartRate),
              temperature: Number(d.temperature),
              respiratoryRate: normalizeOptionalNumber(d.respiratoryRate),
              oxygenSaturation: normalizeOptionalNumber(d.oxygenSaturation),
              weight: normalizeOptionalNumber(d.weight),
              height: normalizeOptionalNumber(d.height),
              painScale: normalizeOptionalNumber(d.painScale) ?? 0,
              symptoms: d.symptoms?.trim() || '',
            })
          })}
        >
          <div className="grid grid-cols-2 gap-3">
            <VField label="Systolic BP (mmHg)">
              <input
                type="number"
                className="form-input"
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
            </VField>
            <VField label="Diastolic BP (mmHg)">
              <input
                type="number"
                className="form-input"
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
            </VField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <VField label="Heart Rate (bpm)">
              <input
                type="number"
                className="form-input"
                placeholder="72"
                {...register('heartRate', {
                  required: 'Heart rate is required',
                  valueAsNumber: true,
                  min: { value: 30, message: 'Minimum is 30' },
                  max: { value: 220, message: 'Maximum is 220' },
                })}
              />
              {errors.heartRate && <p className="mt-1 text-xs text-destructive">{errors.heartRate.message}</p>}
            </VField>
            <VField label="Temperature (°C)">
              <input
                type="number"
                step="0.1"
                className="form-input"
                placeholder="37.0"
                {...register('temperature', {
                  required: 'Temperature is required',
                  valueAsNumber: true,
                  min: { value: 30, message: 'Minimum is 30.0' },
                  max: { value: 45, message: 'Maximum is 45.0' },
                })}
              />
              {errors.temperature && <p className="mt-1 text-xs text-destructive">{errors.temperature.message}</p>}
            </VField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <VField label="Respiratory Rate">
              <input
                type="number"
                className="form-input"
                placeholder="16"
                {...register('respiratoryRate', {
                  setValueAs: (v) => (v === '' ? null : Number(v)),
                  min: { value: 5, message: 'Minimum is 5' },
                  max: { value: 80, message: 'Maximum is 80' },
                })}
              />
              {errors.respiratoryRate && <p className="mt-1 text-xs text-destructive">{errors.respiratoryRate.message}</p>}
            </VField>
            <VField label="O₂ Saturation (%)">
              <input
                type="number"
                className="form-input"
                placeholder="98"
                {...register('oxygenSaturation', {
                  setValueAs: (v) => (v === '' ? null : Number(v)),
                  min: { value: 50, message: 'Minimum is 50' },
                  max: { value: 100, message: 'Maximum is 100' },
                })}
              />
              {errors.oxygenSaturation && <p className="mt-1 text-xs text-destructive">{errors.oxygenSaturation.message}</p>}
            </VField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <VField label="Weight (kg)">
              <input
                type="number"
                step="0.1"
                className="form-input"
                placeholder="70"
                {...register('weight', {
                  setValueAs: (v) => (v === '' ? null : Number(v)),
                  min: { value: 1, message: 'Minimum is 1.0' },
                  max: { value: 500, message: 'Maximum is 500.0' },
                })}
              />
              {errors.weight && <p className="mt-1 text-xs text-destructive">{errors.weight.message}</p>}
            </VField>
            <VField label="Height (cm)">
              <input
                type="number"
                step="0.1"
                className="form-input"
                placeholder="170"
                {...register('height', {
                  setValueAs: (v) => (v === '' ? null : Number(v)),
                  min: { value: 30, message: 'Minimum is 30.0' },
                  max: { value: 300, message: 'Maximum is 300.0' },
                })}
              />
              {errors.height && <p className="mt-1 text-xs text-destructive">{errors.height.message}</p>}
            </VField>
          </div>
          <VField label="Pain Scale (0–10)">
              <input
                type="range"
                min="0"
                max="10"
                className="w-full accent-primary mt-2"
                {...register('painScale', {
                  setValueAs: (v) => (v === '' ? 0 : Number(v)),
                  min: { value: 0, message: 'Minimum is 0' },
                  max: { value: 10, message: 'Maximum is 10' },
                })}
              />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0 None</span><span>5 Moderate</span><span>10 Severe</span>
            </div>
          </VField>
          <VField label="Nurse Observations">
            <textarea rows={2} className="form-input resize-none" placeholder="Any symptoms or observations…" {...register('symptoms')} />
          </VField>
        </form>

        {/* BMI display */}
        <div className="md:col-span-2 flex flex-col items-center justify-center gap-3 p-5 bg-muted/30 rounded-xl border border-border">
          <p className="text-xs text-muted-foreground font-medium">BMI</p>
          <div className={`w-28 h-28 rounded-full flex flex-col items-center justify-center border-2 ${bmiColor}`}>
            <span className="text-3xl font-bold">{bmi || '—'}</span>
          </div>
          {bmiCategory && (
            <span className={`text-xs font-semibold ${bmiColor.split(' ')[0]}`}>{bmiCategory}</span>
          )}
          {!bmi && <p className="text-xs text-muted-foreground text-center">Enter weight & height to calculate BMI</p>}
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex gap-3 mt-4 pt-4 border-t border-border">
        <button type="button" className="btn-secondary flex-1 h-10 text-sm" onClick={onClose}>Cancel</button>
        <button
          form="vitals-form"
          type="submit"
          className="btn-primary flex-1 h-10 text-sm disabled:opacity-40 flex items-center justify-center"
          disabled={vitalsMutation.isPending}
        >
          {vitalsMutation.isPending ? 'Saving…' : 'Save Vitals'}
        </button>
      </div>
    </Modal>
  )
}
