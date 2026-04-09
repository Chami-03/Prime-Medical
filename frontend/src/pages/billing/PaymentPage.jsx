import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { ArrowLeft, CreditCard, Banknote, Smartphone, Receipt, User } from 'lucide-react'
import { billingApi } from '../../api/billingApi'
import Badge from '../../components/common/Badge'
import { getLatestPayment, printBillReceipt } from '../../utils/receiptPrinter'

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash', icon: Banknote },
  { value: 'CARD', label: 'Card', icon: CreditCard },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: Smartphone },
]

const toMoney = (value) => Number(value ?? 0)
const roundMoney = (value) => Math.round((toMoney(value) + Number.EPSILON) * 100) / 100
const formatMoney = (value) =>
  roundMoney(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const isPayableStatus = (status) => status !== 'PAID' && status !== 'REFUNDED'
const unwrapBill = (payload) => payload?.data?.data || payload?.data || payload || null

export default function PaymentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)
  const billId = Number(id)
  const hasValidBillId = Number.isInteger(billId) && billId > 0

  const { data: billRes, isLoading, isError, error } = useQuery({
    queryKey: ['bill', billId],
    queryFn: () => billingApi.getById(billId),
    enabled: hasValidBillId,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { paymentMethod: 'CASH', notes: '', paymentReference: '', amount: 0 },
  })

  useEffect(() => {
    const billData = unwrapBill(billRes)
    if (billData) {
      reset({ paymentMethod: 'CASH', notes: '', paymentReference: '', amount: billData.netAmount })
    }
  }, [billRes, reset])

  const payMutation = useMutation({
    mutationFn: (data) => billingApi.processPayment(billId, { ...data, amount: roundMoney(data.amount) }),
    onSuccess: (response) => {
      const updatedBill = unwrapBill(response)
      queryClient.setQueryData(['bill', billId], response)
      queryClient.invalidateQueries({ queryKey: ['bill'] })
      queryClient.invalidateQueries({ queryKey: ['patient-bills'] })
      queryClient.invalidateQueries({ queryKey: ['patient-bills-profile'] })
      queryClient.invalidateQueries({ queryKey: ['my-patient-profile-billing'] })
      setShowPaymentSuccess(true)
      const updatedPaidTotal = (Array.isArray(updatedBill?.payments) ? updatedBill.payments : [])
        .reduce((sum, payment) => sum + toMoney(payment?.amount), 0)
      const updatedBalance = Math.max(roundMoney(updatedBill?.netAmount) - roundMoney(updatedPaidTotal), 0)
      toast.success(updatedBalance <= 0 ? 'Payment completed successfully' : 'Payment recorded successfully')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Payment failed'),
  })

  const bill = unwrapBill(billRes)
  const lineItems = Array.isArray(bill?.lineItems) ? bill.lineItems : []
  const paidTotal = (Array.isArray(bill?.payments) ? bill.payments : [])
    .reduce((sum, payment) => sum + toMoney(payment?.amount), 0)
  const netAmount = roundMoney(bill?.netAmount)
  const balanceDue = Math.max(roundMoney(netAmount - paidTotal), 0)
  const isBillPayable = isPayableStatus(bill?.status)
  const selectedMethod = watch('paymentMethod')

  useEffect(() => {
    if (!bill) return
    setValue('amount', balanceDue)
  }, [bill, balanceDue, setValue])

  if (!hasValidBillId) return (
    <div className="pm-card p-6 text-center space-y-3">
      <p className="text-sm font-medium text-foreground">Invalid invoice link</p>
      <p className="text-xs text-muted-foreground">This payment URL does not contain a valid bill ID.</p>
      <div>
        <button className="btn-secondary h-9 px-4 text-sm" onClick={() => navigate('/billing')}>
          Back to Billing
        </button>
      </div>
    </div>
  )

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  )

  if (isError && !bill) return (
    <div className="pm-card p-6 text-center space-y-3">
      <p className="text-sm font-medium text-foreground">Unable to load invoice</p>
      <p className="text-xs text-muted-foreground">{error?.response?.data?.message || error?.message || 'Please try again.'}</p>
      <div>
        <button className="btn-secondary h-9 px-4 text-sm" onClick={() => navigate('/billing')}>
          Back to Billing
        </button>
      </div>
    </div>
  )

  if (!bill) return (
    <div className="pm-card p-6 text-center space-y-3">
      <p className="text-sm font-medium text-foreground">Invoice not found</p>
      <p className="text-xs text-muted-foreground">The selected invoice is unavailable.</p>
      <div>
        <button className="btn-secondary h-9 px-4 text-sm" onClick={() => navigate('/billing')}>
          Back to Billing
        </button>
      </div>
    </div>
  )

  const handlePrintReceipt = () => {
    const latestPayment = getLatestPayment(bill)
    const result = printBillReceipt(bill, latestPayment)
    if (!result.ok) {
      toast.error(result.reason || 'Unable to print receipt')
    }
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          onClick={() => navigate('/billing')}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Process Payment</h2>
          <p className="text-sm text-muted-foreground">Invoice #{bill?.invoiceNumber}</p>
        </div>
        <Badge status={bill?.status} />
      </div>

      {showPaymentSuccess && (
        <div className="pm-card p-4 border border-emerald-200 bg-emerald-50/60 dark:bg-emerald-900/10 dark:border-emerald-800/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                {balanceDue <= 0 ? 'Payment complete' : 'Payment updated'}
              </p>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">
                {balanceDue <= 0
                  ? `Receipt is ready for Invoice #${bill?.invoiceNumber}`
                  : `Remaining balance: LKR ${formatMoney(balanceDue)}`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="btn-secondary h-9 px-3 text-sm flex items-center gap-1.5"
                onClick={handlePrintReceipt}
              >
                <Receipt size={14} />
                Print Receipt
              </button>
              {!!bill?.patientId && (
                <button
                  type="button"
                  className="btn-primary h-9 px-3 text-sm flex items-center gap-1.5"
                  onClick={() => navigate(`/patients/${bill.patientId}`)}
                >
                  <User size={14} />
                  Open Patient Profile
                </button>
              )}
              <button
                type="button"
                className="btn-secondary h-9 px-3 text-sm"
                onClick={() => navigate('/billing')}
              >
                Back to Billing
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Invoice summary */}
        <div className="pm-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Invoice Summary</h3>
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Patient</span>
              <span className="font-medium text-foreground">{bill?.patientName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date</span>
              <span className="text-foreground">
                {bill?.createdAt && new Date(bill.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
            {lineItems.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground truncate mr-2">{item.description}</span>
                <span className="text-foreground font-medium flex-shrink-0">
                  LKR {formatMoney(item.totalPrice)}
                </span>
              </div>
            ))}
            <div className="pt-1 border-t border-border/60 flex justify-between text-sm">
              <span className="text-muted-foreground">Paid So Far</span>
              <span className="text-foreground">LKR {formatMoney(paidTotal)}</span>
            </div>
            <div className="pt-2 border-t border-border flex justify-between text-base font-semibold">
              <span className="text-foreground">Total</span>
              <span className="text-foreground">
                LKR {formatMoney(netAmount)}
              </span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span className="text-foreground">Balance Due</span>
              <span className="text-primary">
                LKR {formatMoney(balanceDue)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment form */}
        <div className="pm-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Payment Details</h3>
          <form
            onSubmit={handleSubmit((d) => {
              if (!isBillPayable) {
                toast.error('This invoice is not payable in its current status')
                return
              }
              const amountToPay = Math.min(roundMoney(d.amount), balanceDue)
              payMutation.mutate({ ...d, amount: amountToPay })
            })}
            className="space-y-4"
          >
            {/* Payment method selector */}
            <div>
              <label className="form-label">Payment Method</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    className={`flex flex-col items-center gap-1 py-3 rounded-lg border text-xs font-medium transition-colors ${
                      selectedMethod === value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-muted/50 text-muted-foreground hover:border-border/80'
                    }`}
                    onClick={() => setValue('paymentMethod', value)}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
              <input type="hidden" {...register('paymentMethod')} />
            </div>

            <div>
              <label className="form-label">Amount (LKR)</label>
              <input
                type="number"
                step="0.01"
                className={`form-input mt-1 ${errors.amount ? 'border-destructive' : ''}`}
                {...register('amount', { required: true, min: 0.01 })}
                readOnly
              />
              <p className="text-xs text-muted-foreground mt-1">Auto-calculated from doctor fee + channeling fee + medicines.</p>
            </div>

            {(selectedMethod === 'CARD' || selectedMethod === 'BANK_TRANSFER') && (
              <div>
                <label className="form-label">Reference #</label>
                <input className="form-input mt-1" placeholder="Transaction or ref number" {...register('paymentReference')} />
              </div>
            )}

            <div>
              <label className="form-label">Notes (optional)</label>
              <textarea
                rows={2}
                className="form-input mt-1 resize-none"
                placeholder="Any additional notes"
                {...register('notes')}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                className="btn-secondary flex-1 h-10 text-sm"
                onClick={() => navigate('/billing')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1 h-10 text-sm flex items-center justify-center gap-1.5 disabled:opacity-40"
                disabled={!isBillPayable || payMutation.isPending || balanceDue <= 0}
              >
                <CreditCard size={14} />
                {payMutation.isPending ? 'Processing' : 'Confirm Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
