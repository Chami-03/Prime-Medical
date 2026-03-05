import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { ArrowLeft, CreditCard, Banknote, Smartphone } from 'lucide-react'
import { billingApi } from '../../api/billingApi'
import Badge from '../../components/common/Badge'

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash', icon: Banknote },
  { value: 'CARD', label: 'Card', icon: CreditCard },
  { value: 'MOBILE', label: 'Mobile Pay', icon: Smartphone },
]

export default function PaymentPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: billRes, isLoading } = useQuery({
    queryKey: ['bill', id],
    queryFn: () => billingApi.getById(id),
  })

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { paymentMethod: 'CASH', notes: '', paymentReference: '', amount: 0 },
  })

  useEffect(() => {
    if (billRes?.data) {
      reset({ paymentMethod: 'CASH', notes: '', paymentReference: '', amount: billRes.data.netAmount })
    }
  }, [billRes, reset])

  const payMutation = useMutation({
    mutationFn: (data) => billingApi.processPayment(id, { ...data, amount: Number(data.amount) }),
    onSuccess: () => { toast.success('Payment processed successfully'); navigate('/billing') },
    onError: (err) => toast.error(err.response?.data?.message || 'Payment failed'),
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  )

  const bill = billRes?.data
  const selectedMethod = watch('paymentMethod')

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
            {bill?.items?.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground truncate mr-2">{item.description}</span>
                <span className="text-foreground font-medium flex-shrink-0">
                  {item.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
            <div className="pt-2 border-t border-border flex justify-between text-base font-semibold">
              <span className="text-foreground">Total</span>
              <span className="text-foreground">
                LKR {bill?.netAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Payment form */}
        <div className="pm-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Payment Details</h3>
          <form onSubmit={handleSubmit((d) => payMutation.mutate(d))} className="space-y-4">
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
              />
            </div>

            {(selectedMethod === 'CARD' || selectedMethod === 'MOBILE') && (
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
                disabled={bill?.status === 'PAID' || payMutation.isPending}
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
