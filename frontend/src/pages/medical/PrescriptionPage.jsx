import { useEffect, useMemo, useState } from 'react'
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
  const [medicineSearch, setMedicineSearch] = useState('')
  const [customMedicineName, setCustomMedicineName] = useState('')
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

  const resolvedConsultationId = consultationId || prescriptionRes?.data?.consultationId || ''

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

  const {
    register,
    control,
    handleSubmit,
    formState: { isSubmitting },
    reset,
    setValue,
  } = useForm({
    defaultValues: {
      consultationId: resolvedConsultationId,
      items: [
        {
          inventoryItemId: '',
          drugName: '',
          dosage: '',
          frequency: '1-0-1',
          durationDays: 5,
          quantity: 10,
          instructions: '',
        },
      ],
      notes: '',
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const findItemIndexByInventoryId = (inventoryItemId) =>
    fields.findIndex((item) => String(item?.inventoryItemId || '') === String(inventoryItemId))

  const toggleInventoryMedicine = (drug, checked) => {
    const existingIndex = findItemIndexByInventoryId(drug.id)
    if (checked && existingIndex === -1) {
      append({
        inventoryItemId: String(drug.id),
        drugName: drug.drugName || '',
        dosage: '',
        frequency: '1-0-1',
        durationDays: 5,
        quantity: 1,
        instructions: '',
      })
      return
    }

    if (!checked && existingIndex !== -1) {
      remove(existingIndex)
    }
  }

  const addManualCustomMedicine = () => {
    const name = customMedicineName.trim()
    if (!name) {
      toast.error('Enter medicine name to add custom medicine')
      return
    }

    append({
      inventoryItemId: '',
      drugName: name,
      dosage: '',
      frequency: '1-0-1',
      durationDays: 5,
      quantity: 1,
      instructions: '',
    })
    setCustomMedicineName('')
  }

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

  const filteredDrugs = useMemo(() => {
    const keyword = medicineSearch.trim().toLowerCase()
    if (!keyword) return drugs

    return drugs.filter((drug) => {
      const drugName = String(drug?.drugName || '').toLowerCase()
      const genericName = String(drug?.genericName || '').toLowerCase()
      return drugName.includes(keyword) || genericName.includes(keyword)
    })
  }, [drugs, medicineSearch])

  const customItems = fields
    .map((field, index) => ({ ...field, index }))
    .filter((item) => !item.inventoryItemId)

  const toPayload = (form) => ({
    consultationId: Number(form.consultationId || resolvedConsultationId),
    notes: form.notes,
    items: (form.items || []).map((item) => {
      const parsedInvId = Number(item.inventoryItemId)
      const invId = Number.isFinite(parsedInvId) && parsedInvId > 0 ? parsedInvId : null
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
      const invId = Number(item.inventoryItemId)
      const hasInventory = Number.isFinite(invId) && invId > 0
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
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register('consultationId', { required: true })} />

        <div className="pm-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Add Medicines from Inventory</p>
            <div className="flex items-center gap-2 w-full max-w-lg">
              <input
                type="text"
                className="form-input h-8 w-full text-xs"
                placeholder="Medicine Search"
                value={medicineSearch}
                onChange={(e) => setMedicineSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="pm-table min-w-[980px]">
              <thead>
                <tr>
                  <th className="w-12">Add</th>
                  <th>Medicine</th>
                  <th className="w-28">Available</th>
                  <th className="w-28">Dosage</th>
                  <th className="w-24">Frequency</th>
                  <th className="w-28">Duration (days)</th>
                  <th className="w-24">Qty</th>
                  <th>Instructions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrugs.map((drug) => {
                  const itemIndex = findItemIndexByInventoryId(drug.id)
                  const selected = itemIndex !== -1

                  return (
                    <tr key={drug.id} className={selected ? 'bg-primary/5' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => toggleInventoryMedicine(drug, e.target.checked)}
                          className="w-4 h-4 accent-primary"
                        />
                      </td>
                      <td>
                        <div>
                          <p className="text-sm font-medium text-foreground">{drug.drugName}</p>
                          {drug.genericName && <p className="text-xs text-muted-foreground">{drug.genericName}</p>}
                        </div>
                      </td>
                      <td className="text-sm text-muted-foreground">{drug.quantity ?? 0}</td>
                      <td>
                        {selected ? (
                          <input
                            className="form-input h-8 text-xs"
                            placeholder="500mg"
                            {...register(`items.${itemIndex}.dosage`, { required: true })}
                          />
                        ) : (
                          <input className="form-input h-8 text-xs" placeholder="500mg" disabled />
                        )}
                      </td>
                      <td>
                        {selected ? (
                          <input
                            className="form-input h-8 text-xs font-mono"
                            placeholder="1-0-1"
                            {...register(`items.${itemIndex}.frequency`, { required: true })}
                          />
                        ) : (
                          <input className="form-input h-8 text-xs font-mono" placeholder="1-0-1" disabled />
                        )}
                      </td>
                      <td>
                        {selected ? (
                          <input
                            type="number"
                            min="1"
                            className="form-input h-8 text-xs"
                            {...register(`items.${itemIndex}.durationDays`, { required: true })}
                          />
                        ) : (
                          <input type="number" min="1" className="form-input h-8 text-xs" disabled />
                        )}
                      </td>
                      <td>
                        {selected ? (
                          <input
                            type="number"
                            min="1"
                            className="form-input h-8 text-xs"
                            {...register(`items.${itemIndex}.quantity`, { required: true })}
                          />
                        ) : (
                          <input type="number" min="1" className="form-input h-8 text-xs" disabled />
                        )}
                      </td>
                      <td>
                        {selected ? (
                          <input
                            className="form-input h-8 text-xs"
                            placeholder="After food"
                            {...register(`items.${itemIndex}.instructions`)}
                          />
                        ) : (
                          <input className="form-input h-8 text-xs" placeholder="After food" disabled />
                        )}
                      </td>
                    </tr>
                  )
                })}
                {filteredDrugs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-sm text-muted-foreground">
                      No medicines found for this search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pm-card p-4">
          <p className="text-sm font-semibold text-foreground">Custom Medicines (Not in Pharmacy Inventory)</p>
          <p className="text-xs text-muted-foreground mt-1">Enter medicine name and add it as a custom prescription item.</p>
          <RoleProtected allowedRoles={['DOCTOR']}>
            <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-center">
              <input
                type="text"
                className="form-input h-9 flex-1"
                placeholder="Medicine Name"
                value={customMedicineName}
                onChange={(e) => setCustomMedicineName(e.target.value)}
              />
              <button
                type="button"
                className="btn-secondary h-9 px-3 text-sm flex items-center justify-center gap-1.5"
                onClick={addManualCustomMedicine}
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </RoleProtected>
        </div>

        <div className="pm-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Custom Medicines</p>
            <p className="text-xs text-muted-foreground">Medicines not available in pharmacy inventory</p>
          </div>
          <div className="overflow-x-auto">
            <table className="pm-table min-w-[980px]">
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th className="w-28">Dosage</th>
                  <th className="w-24">Frequency</th>
                  <th className="w-28">Duration (days)</th>
                  <th className="w-24">Qty</th>
                  <th>Instructions</th>
                  <th className="w-16">Remove</th>
                </tr>
              </thead>
              <tbody>
                {customItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <input
                        className="form-input h-9 text-sm"
                        placeholder="Type medicine name"
                        {...register(`items.${item.index}.drugName`)}
                      />
                    </td>
                    <td>
                      <input
                        className="form-input h-9 text-sm"
                        placeholder="500mg"
                        {...register(`items.${item.index}.dosage`, { required: true })}
                      />
                    </td>
                    <td>
                      <input
                        className="form-input h-9 text-sm font-mono"
                        placeholder="1-0-1"
                        {...register(`items.${item.index}.frequency`, { required: true })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        className="form-input h-9 text-sm"
                        {...register(`items.${item.index}.durationDays`, { required: true })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        className="form-input h-9 text-sm"
                        {...register(`items.${item.index}.quantity`, { required: true })}
                      />
                    </td>
                    <td>
                      <input
                        className="form-input h-9 text-sm"
                        placeholder="e.g. Take after food"
                        {...register(`items.${item.index}.instructions`)}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => remove(item.index)}
                        className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center text-destructive hover:bg-destructive hover:text-white transition-colors border border-destructive/20"
                        title="Remove custom medicine"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
                {customItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                      No custom medicines added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

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
