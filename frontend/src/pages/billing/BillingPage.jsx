import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Search, User, X, FileText, CreditCard, Receipt } from 'lucide-react'
import { billingApi } from '../../api/billingApi'
import { patientApi } from '../../api/patientApi'
import { RoleProtected } from '../../context/AuthContext'
import Badge from '../../components/common/Badge'

export default function BillingPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)

  const { data: searchRes, isLoading: isSearching } = useQuery({
    queryKey: ['patient-search-billing', searchQuery],
    queryFn: () => patientApi.search(searchQuery),
    enabled: searchQuery.length > 2 && !selectedPatient,
  })

  const { data: billsRes, isLoading: isLoadingBills } = useQuery({
    queryKey: ['patient-bills', selectedPatient?.id],
    queryFn: () => billingApi.getByPatient(selectedPatient.id),
    enabled: !!selectedPatient,
  })

  const generateMutation = useMutation({
    mutationFn: (data) => billingApi.generate(data),
    onSuccess: (res) => {
      toast.success('Bill generated successfully')
      navigate(`/billing/${res.data.id}/payment`)
    },
    onError: () => toast.error('Failed to generate bill'),
  })

  const patients = searchRes?.data || []
  const bills = billsRes?.data || []

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Billing & Invoices</h2>
        <RoleProtected allowedRoles={['DOCTOR', 'RECEPTIONIST']}>
          <button
            className="btn-primary h-9 px-4 text-sm flex items-center gap-1.5 disabled:opacity-40"
            disabled={!selectedPatient || generateMutation.isPending}
            onClick={() => generateMutation.mutate({ patientId: selectedPatient?.id })}
          >
            <Receipt size={14} />
            {generateMutation.isPending ? 'Generating' : 'New Invoice'}
          </button>
        </RoleProtected>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Patient search panel */}
        <div className="space-y-3">
          <div className="pm-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Select Patient</h3>

            {!selectedPatient ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className="form-input pl-9 h-9 text-sm"
                    placeholder="Search by name, NIC or ID"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {isSearching && (
                  <p className="text-xs text-muted-foreground px-1">Searching</p>
                )}

                {patients.length > 0 && (
                  <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
                    {patients.slice(0, 6).map(p => (
                      <button
                        key={p.id}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left"
                        onClick={() => { setSelectedPatient(p); setSearchQuery('') }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold uppercase flex-shrink-0">
                          {p.firstName?.[0]}{p.lastName?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{p.firstName} {p.lastName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{p.patientNumber}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searchQuery.length > 2 && !isSearching && patients.length === 0 && (
                  <p className="text-xs text-muted-foreground px-1">No patients found</p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm uppercase flex-shrink-0">
                  {selectedPatient.firstName?.[0]}{selectedPatient.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">{selectedPatient.patientNumber}</p>
                </div>
                <button
                  className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  onClick={() => setSelectedPatient(null)}
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {selectedPatient && (
            <div className="pm-card p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Invoice Summary</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">Total bills</span>
                <span className="font-semibold text-foreground">{bills.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">Unpaid</span>
                <span className="font-semibold text-destructive">{bills.filter(b => b.status !== 'PAID').length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">Paid</span>
                <span className="font-semibold text-emerald-600">{bills.filter(b => b.status === 'PAID').length}</span>
              </div>
            </div>
          )}
        </div>

        {/* Bills table */}
        <div className="lg:col-span-2">
          <div className="pm-card overflow-hidden">
            {!selectedPatient ? (
              <div className="flex flex-col items-center justify-center py-20">
                <FileText size={32} className="text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Select a patient to view billing history</p>
              </div>
            ) : isLoadingBills ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : bills.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Receipt size={32} className="text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No invoices found for this patient</p>
              </div>
            ) : (
              <table className="pm-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th className="text-right">Amount (LKR)</th>
                    <th className="text-center">Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map(bill => (
                    <tr key={bill.id}>
                      <td className="font-mono text-xs">{bill.invoiceNumber}</td>
                      <td className="text-muted-foreground">
                        {new Date(bill.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="text-right font-semibold">
                        {bill.netAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-center">
                        <Badge status={bill.status} />
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          {bill.status !== 'PAID' ? (
                            <RoleProtected allowedRoles={['DOCTOR', 'RECEPTIONIST']}>
                              <button
                                className="btn-primary h-8 px-3 text-xs flex items-center gap-1"
                                onClick={() => navigate(`/billing/${bill.id}/payment`)}
                              >
                                <CreditCard size={12} />
                                Pay
                              </button>
                            </RoleProtected>
                          ) : (
                            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                               Paid
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
