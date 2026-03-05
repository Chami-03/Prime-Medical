import { useEffect } from 'react'
import { useSearchParams, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { prescriptionApi } from '../../api/prescriptionApi'
import { consultationApi } from '../../api/consultationApi'
import { inventoryApi } from '../../api/inventoryApi'
import { RoleProtected } from '../../context/AuthContext'
import { Pill, Plus, Trash2 } from 'lucide-react'

function parseDurationDays(value) {
  const text = String(value ?? '').trim()
  const num = parseInt(text, 10)
  return Number.isFinite(num) ? num : 5
}

export default function PrescriptionPage() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const { id: routeId } = useParams()
  const consultationId = searchParams.get('consultationId')
  const navigate = useNavigate()

  const routePrescriptionId = routeId ? Number(routeId) : null
  const isEditMode = Number.isInteger(routePrescriptionId) && routePrescriptionId > 0

  const { data: prescriptionRes } = useQuery({
    queryKey: ['prescription', routePrescriptionId],
    queryFn: () => prescriptionApi.getById(routePrescriptionId),
    enabled: isEditMode,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000,
  })

  const resolvedConsultationId =
    consultationId || prescriptionRes?.data?.consultationId || ''

  const { data: consultationRes } = useQuery({
    queryKey: ['consultation-mini', resolvedConsultationId],
    queryFn: () => consultationApi.getById(resolvedConsultationId),
    enabled: !!resolvedConsultationId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000,
  })

  const { data: inventoryRes } = useQuery({
    queryKey: ['inventory-simple'],
    queryFn: () => inventoryApi.getAll(),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 60 * 1000,
  })

  const { register, control, handleSubmit, formState: { isSubmitting }, reset, setValue } = useForm({
    defaultValues: {
      consultationId: resolvedConsultationId,
      items: [{ inventoryItemId: '', drugName: '', dosage: '', frequency: '1-0-1', durationDays: 5, quantity: 10, instructions: '' }],
      notes: '',
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  useEffect(() => {
    if (!isEditMode || !prescriptionRes?.data) return
    const p = prescriptionRes.data
    reset({
      consultationId: p.consultationId,
      notes: p.notes || '',
      items: (p.items || []).map((item) => ({
        inventoryItemId: item.inventoryItemId || '',
          drugName: item.drugName || '',
        dosage: item.dosage || '',
        frequency: item.frequency || '1-0-1',
        durationDays: item.durationDays || 5,
        quantity: item.quantity || 1,
        instructions: item.instructions || '',
      })),
    })
  }, [isEditMode, prescriptionRes, reset])

  useEffect(() => {
    if (!resolvedConsultationId) return
    setValue('consultationId', String(resolvedConsultationId), { shouldValidate: true })
  }, [resolvedConsultationId, setValue])

  const createMutation = useMutation({
    mutationFn: (data) => prescriptionApi.create(data),
    onSuccess: (response) => {
      if (resolvedConsultationId) {
        queryClient.invalidateQueries({ queryKey: ['consultation', resolvedConsultationId] })
        queryClient.invalidateQueries({ queryKey: ['prescription-by-consultation', resolvedConsultationId] })
        queryClient.setQueryData(['prescription-by-consultation', resolvedConsultationId], response)
      }
      toast.success('Prescription created successfully')
      navigate(`/consultation/${resolvedConsultationId}`)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create prescription'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => prescriptionApi.update(id, data),
    onSuccess: (response) => {
      const consultationToRefresh = response?.data?.consultationId || resolvedConsultationId
      if (consultationToRefresh) {
        queryClient.invalidateQueries({ queryKey: ['consultation', consultationToRefresh] })
        queryClient.invalidateQueries({ queryKey: ['prescription-by-consultation', consultationToRefresh] })
        queryClient.setQueryData(['prescription-by-consultation', consultationToRefresh], response)
      }
      toast.success('Prescription updated successfully')
      navigate(-1)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update prescription'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => prescriptionApi.remove(id),
    onSuccess: () => {
      if (resolvedConsultationId) {
        queryClient.invalidateQueries({ queryKey: ['consultation', resolvedConsultationId] })
        queryClient.setQueryData(['prescription-by-consultation', resolvedConsultationId], { data: null })
      }
      toast.success('Prescription deleted successfully')
      navigate(-1)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete prescription'),
  })

  const consultation = consultationRes?.data
  const drugs = inventoryRes?.data || []

  const toPayload = (form) => ({
    consultationId: Number(form.consultationId || resolvedConsultationId),
    notes: form.notes,
    items: (form.items || []).map((item) => {
      const invId = item.inventoryItemId ? Number(item.inventoryItemId) : null
      const inv = drugs.find((d) => d.id === invId)
      const manualDrugName = String(item.drugName || '').trim()
      return {
        inventoryItemId: invId,
        drugName: inv?.drugName || manualDrugName || 'Unknown Drug',
        dosage: String(item.dosage || '').trim(),
        frequency: String(item.frequency || '').trim(),
        durationDays: Math.max(1, parseDurationDays(item.durationDays)),
        quantity: Math.max(1, Number(item.quantity || 1)),
        instructions: String(item.instructions || '').trim(),
      }
    }),
  })

  const onSubmit = (data) => {
    const effectiveConsultationId = Number(data.consultationId || resolvedConsultationId)
    if (!Number.isFinite(effectiveConsultationId) || effectiveConsultationId <= 0) {
      toast.error('Consultation is required before saving prescription')
      return
    }

    const hasInvalidItem = (data.items || []).some((item) => {
      const hasInventory = !!item.inventoryItemId
      const hasDrugName = String(item.drugName || '').trim().length > 0
      return !hasInventory && !hasDrugName
    })
    if (hasInvalidItem) {
      toast.error('Select medicine or enter manual medicine name for each item')
      return
    }

    const payload = toPayload(data)
    payload.consultationId = effectiveConsultationId
    if (isEditMode) {
      updateMutation.mutate({ id: routePrescriptionId, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  return (
    <div className="space-y-5 pb-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Pill size={18} className="text-primary" /> {isEditMode ? 'Edit Prescription' : 'New Prescription'}
          </h2>
          {consultation && (
            <p className="text-xs text-muted-foreground mt-0.5">
              For <span className="text-primary font-medium">{consultation.patientName}</span>
            </p>
          )}
        </div>

        <RoleProtected allowedRoles={['DOCTOR']}>
          <button
            type="button"
            className="btn-secondary h-9 px-3 text-sm flex items-center gap-1.5"
            onClick={() => append({ inventoryItemId: '', drugName: '', dosage: '', frequency: '1-0-1', durationDays: 5, quantity: 10, instructions: '' })}
          >
            <Plus size={14} /> Add Medicine
          </button>
        </RoleProtected>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register('consultationId', { required: true })} />

        {fields.map((field, index) => (
          <div key={field.id} className="pm-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">Medicine {index + 1}</span>
              <button
                type="button"
                disabled={fields.length === 1}
                onClick={() => remove(index)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-destructive hover:bg-destructive hover:text-white disabled:opacity-30 transition-colors border border-destructive/20"
              >
                <Trash2 size={12} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-4">
                <label className="form-label">Select Medicine</label>
                <select className="form-input mt-1" {...register(`items.${index}.inventoryItemId`)}>
                  <option value="">Choose medication</option>
                  {drugs.map((item) => (
                    <option key={item.id} value={item.id}>{item.drugName} ({item.quantity} available)</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="form-label">Manual Medicine Name</label>
                <input className="form-input mt-1" placeholder="Type if not in inventory" {...register(`items.${index}.drugName`)} />
              </div>

              <div className="md:col-span-2">
                <label className="form-label">Dosage</label>
                <input className="form-input mt-1" placeholder="500mg" {...register(`items.${index}.dosage`, { required: true })} />
              </div>

              <div className="md:col-span-2">
                <label className="form-label">Frequency</label>
                <input className="form-input mt-1 font-mono" placeholder="1-0-1" {...register(`items.${index}.frequency`, { required: true })} />
              </div>

              <div className="md:col-span-2">
                <label className="form-label">Duration Days</label>
                <input type="number" min="1" className="form-input mt-1" {...register(`items.${index}.durationDays`, { required: true })} />
              </div>

              <div className="md:col-span-1">
                <label className="form-label">Qty</label>
                <input type="number" min="1" className="form-input mt-1 text-center" {...register(`items.${index}.quantity`, { required: true })} />
              </div>

              <div className="md:col-span-12">
                <label className="form-label">Patient Instructions</label>
                <input className="form-input mt-1" placeholder="e.g. Take after food" {...register(`items.${index}.instructions`)} />
              </div>
            </div>
          </div>
        ))}

        <div className="pm-card p-5">
          <label className="form-label">Pharmacy Notes</label>
          <textarea rows={3} className="form-input mt-1 resize-none" placeholder="Any specific instructions for the pharmacy team" {...register('notes')} />
        </div>

        <div className="flex justify-between items-center pm-card p-4 gap-3">
          <button type="button" className="btn-secondary h-9 px-4 text-sm" onClick={() => navigate(-1)}>Cancel</button>
          <div className="flex gap-2">
            {isEditMode && (
              <RoleProtected allowedRoles={['DOCTOR']}>
                <button
                  type="button"
                  className="btn-danger h-9 px-4 text-sm disabled:opacity-40"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(routePrescriptionId)}
                >
                  {deleteMutation.isPending ? 'Deleting' : 'Delete'}
                </button>
              </RoleProtected>
            )}
            <RoleProtected allowedRoles={['DOCTOR']}>
              <button
                type="submit"
                className="btn-primary h-9 px-5 text-sm disabled:opacity-40"
                disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
              >
                {isEditMode
                  ? (updateMutation.isPending ? 'Updating' : 'Update Prescription')
                  : (createMutation.isPending ? 'Saving' : 'Save Prescription')}
              </button>
            </RoleProtected>
          </div>
        </div>
      </form>
    </div>
  )
}
