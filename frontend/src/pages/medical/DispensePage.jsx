import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { prescriptionApi } from '../../api/prescriptionApi'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import { Stethoscope, Pill, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function DispensePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [allergyOverrideModal, setAllergyOverrideModal] = useState(false)
  const [allergyError, setAllergyError] = useState(null)

  const { data: prescriptionRes, isLoading } = useQuery({
    queryKey: ['prescription', id],
    queryFn: () => prescriptionApi.getById(id),
  })

  const { data: allergyRes } = useQuery({
    queryKey: ['prescription-allergy', id],
    queryFn: () => prescriptionApi.checkAllergies(id),
    enabled: !!id && !!prescriptionRes?.data,
  })
  const allergies = allergyRes?.data || []

  const dispenseMutation = useMutation({
    mutationFn: (override) => prescriptionApi.dispense(id, override),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescription', id] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-all'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-activity'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-report'] })
      toast.success('Prescription dispensed and inventory updated')
      setAllergyOverrideModal(false)
      setAllergyError(null)
      navigate('/dashboard')
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Dispensing failed'
      if (msg.includes('ALLERGY_CONFLICT')) {
        setAllergyError(msg.replace('ALLERGY_CONFLICT:', ''))
        setAllergyOverrideModal(true)
      } else {
        toast.error(msg)
      }
    },
  })

  const handleDispense = () => dispenseMutation.mutate(false)
  const handleOverrideDispense = () => dispenseMutation.mutate(true)

  if (isLoading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  )

  const prescription = prescriptionRes?.data
  const allItems = Array.isArray(prescription?.items) ? prescription.items : []
  const dispensableItems = allItems.filter((item) => !!item?.inventoryItemId)
  const customItems = allItems.filter((item) => !item?.inventoryItemId)

  return (
    <div className="space-y-5 pb-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Dispense Prescription</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Order #{id?.slice(-8).toUpperCase()}</p>
        </div>
        <Badge status={prescription?.status} />
      </div>

      {/* Allergy banner */}
      {allergies.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3 text-sm text-amber-700">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Patient Allergy Alert</p>
            <p className="text-xs mt-0.5">{allergies.map((a) => `${a.drugName} (${a.allergen}${a.reaction ? `: ${a.reaction}` : ''})`).join(', ')}</p>
          </div>
        </div>
      )}

      {/* Patient + Doctor cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="pm-card p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-lg font-bold text-primary shrink-0">
            {prescription?.patientName?.charAt(0)}
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Patient</p>
            <p className="font-semibold text-foreground text-sm">{prescription?.patientName}</p>
            <p className="text-xs font-mono text-primary">{prescription?.patientNumber}</p>
          </div>
        </div>
        <div className="pm-card p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0">
            <Stethoscope size={18} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Prescribing Doctor</p>
            <p className="font-semibold text-foreground text-sm">Dr. {prescription?.doctorName || '-'}</p>
            <p className="text-xs text-muted-foreground">{prescription?.prescribedAt ? new Date(prescription.prescribedAt).toLocaleDateString() : ''}</p>
          </div>
        </div>
      </div>

      {/* Medications table */}
      <div className="pm-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
          <Pill size={14} className="text-primary" />
          <span className="text-sm font-semibold text-foreground">Inventory Medicines to Dispense</span>
        </div>
        <table className="pm-table">
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Dosage</th>
              <th>Frequency</th>
              <th>Duration</th>
              <th className="text-right">Qty</th>
            </tr>
          </thead>
          <tbody>
            {dispensableItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                  No inventory-linked medicines to dispense.
                </td>
              </tr>
            ) : dispensableItems.map((item, idx) => (
              <tr key={idx}>
                <td>
                  <p className="font-medium text-foreground">{item.drugName}</p>
                  {item.instructions && <p className="text-xs text-muted-foreground italic mt-0.5">{item.instructions}</p>}
                </td>
                <td><code className="text-xs bg-muted px-2 py-0.5 rounded border border-border">{item.dosage}</code></td>
                <td><span className="badge-blue">{item.frequency}</span></td>
                <td className="text-muted-foreground text-xs">{item.durationDays} day(s)</td>
                <td className="text-right font-bold text-foreground">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {customItems.length > 0 && (
        <div className="pm-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-amber-500/10">
            <AlertTriangle size={14} className="text-amber-600" />
            <span className="text-sm font-semibold text-foreground">Custom Medicines (No Inventory Dispense)</span>
          </div>
          <table className="pm-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Duration</th>
                <th className="text-right">Qty</th>
              </tr>
            </thead>
            <tbody>
              {customItems.map((item, idx) => (
                <tr key={`custom-${idx}`}>
                  <td>
                    <p className="font-medium text-foreground">{item.drugName}</p>
                    {item.instructions && <p className="text-xs text-muted-foreground italic mt-0.5">{item.instructions}</p>}
                  </td>
                  <td><code className="text-xs bg-muted px-2 py-0.5 rounded border border-border">{item.dosage}</code></td>
                  <td><span className="badge-blue">{item.frequency}</span></td>
                  <td className="text-muted-foreground text-xs">{item.durationDays} day(s)</td>
                  <td className="text-right font-bold text-foreground">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Doctor notes */}
      {prescription?.notes && (
        <div className="pm-card p-4 bg-amber-500/10 border-amber-500/20">
          <p className="text-[10px] text-amber-600 uppercase tracking-widest font-semibold mb-2">Doctor's Notes</p>
          <p className="text-sm text-foreground italic">"{prescription.notes}"</p>
        </div>
      )}

      {/* Actions */}
      <div className="pm-card p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          {prescription?.status === 'DISPENSED' ? (
            <><CheckCircle2 size={16} className="text-emerald-500" /><span className="text-emerald-600 font-medium">Medicine Dispensed</span></>
          ) : customItems.length > 0 ? (
            <><AlertTriangle size={16} className="text-amber-500" /><span className="text-muted-foreground">Custom medicines are listed separately and are not dispensed from inventory</span></>
          ) : (
            <><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-muted-foreground">Ready to dispense</span></>
          )}
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary h-9 px-4 text-sm" onClick={() => navigate(-1)}>Discard</button>
          {prescription?.status !== 'DISPENSED' && dispensableItems.length > 0 && (
            <button className="btn-primary h-9 px-5 text-sm disabled:opacity-40" disabled={dispenseMutation.isPending} onClick={handleDispense}>
              {dispenseMutation.isPending ? 'Dispensing' : 'Dispense Medicine'}
            </button>
          )}
        </div>
      </div>

      {/* Allergy Override Modal */}
      <Modal isOpen={allergyOverrideModal} onClose={() => { setAllergyOverrideModal(false); setAllergyError(null) }} title="Allergy Warning">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-700">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Patient has a known allergy to this medication</p>
              {allergyError && <p className="mt-1 text-xs">{allergyError}</p>}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Do you want to override the allergy warning and proceed with dispensing?</p>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1 h-10 text-sm" onClick={() => { setAllergyOverrideModal(false); setAllergyError(null) }}>Cancel</button>
            <button className="flex-1 h-10 text-sm font-medium rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-50" disabled={dispenseMutation.isPending} onClick={handleOverrideDispense}>
              {dispenseMutation.isPending ? 'Dispensing' : 'Override & Dispense'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}