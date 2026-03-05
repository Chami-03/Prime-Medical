import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ArrowLeft, User, Phone, Mail, MapPin, AlertTriangle, IdCard, Calendar } from 'lucide-react'
import { patientApi } from '../../api/patientApi'

const SECTION = ({ title, icon: Icon, children }) => (
  <div className="pm-card p-5 space-y-4">
    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
      <Icon size={14} className="text-muted-foreground" />
      {title}
    </h3>
    {children}
  </div>
)

const Field = ({ label, error, children }) => (
  <div>
    <label className="form-label">{label}</label>
    <div className="mt-1">{children}</div>
    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
  </div>
)

export default function PatientRegisterPage() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { gender: 'MALE', emailNotifications: true, smsNotifications: false },
  })

  const onSubmit = async (data) => {
    try {
      const res = await patientApi.register(data)
      const patientId = res?.data?.id || res?.id
      toast.success('Patient registered successfully!')
      if (patientId) navigate(`/patients/${patientId}`)
      else navigate('/patients')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Register New Patient</h2>
          <p className="text-sm text-muted-foreground">Create a new patient record</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Personal info */}
        <SECTION title="Personal Information" icon={User}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name *" error={errors.firstName?.message}>
              <input
                className={`form-input ${errors.firstName ? 'border-destructive' : ''}`}
                placeholder="John"
                {...register('firstName', { required: 'Required' })}
              />
            </Field>
            <Field label="Last Name *" error={errors.lastName?.message}>
              <input
                className={`form-input ${errors.lastName ? 'border-destructive' : ''}`}
                placeholder="Doe"
                {...register('lastName', { required: 'Required' })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Date of Birth *" error={errors.dateOfBirth?.message}>
              <input
                type="date"
                className={`form-input ${errors.dateOfBirth ? 'border-destructive' : ''}`}
                {...register('dateOfBirth', { required: 'Required' })}
              />
            </Field>
            <Field label="Gender *">
              <select className="form-input" {...register('gender', { required: true })}>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>
            <Field label="NIC Number *" error={errors.nicNumber?.message}>
              <input
                className={`form-input ${errors.nicNumber ? 'border-destructive' : ''}`}
                placeholder="200012345678"
                {...register('nicNumber', { required: 'Required' })}
              />
            </Field>
          </div>
        </SECTION>

        {/* Contact */}
        <SECTION title="Contact Details" icon={Phone}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Phone *" error={errors.phone?.message}>
              <input
                className={`form-input ${errors.phone ? 'border-destructive' : ''}`}
                placeholder="+94 77 123 4567"
                {...register('phone', { required: 'Required' })}
              />
            </Field>
            <Field label="Email">
              <input className="form-input" type="email" placeholder="patient@email.com" {...register('email')} />
            </Field>
          </div>
          <Field label="Address">
            <textarea
              rows={2}
              className="form-input resize-none"
              placeholder="Street address, city"
              {...register('address')}
            />
          </Field>
        </SECTION>

        {/* Emergency contact */}
        <SECTION title="Emergency Contact" icon={AlertTriangle}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Contact Name">
              <input className="form-input" placeholder="Jane Doe" {...register('emergencyContactName')} />
            </Field>
            <Field label="Contact Phone">
              <input className="form-input" placeholder="+94 77 765 4321" {...register('emergencyContactPhone')} />
            </Field>
          </div>
        </SECTION>

        {/* Notifications */}
        <SECTION title="Notification Preferences" icon={Mail}>
          <div className="flex flex-col sm:flex-row gap-4">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input type="checkbox" className="rounded border-border" {...register('emailNotifications')} />
              <span className="text-sm text-foreground">Email notifications</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input type="checkbox" className="rounded border-border" {...register('smsNotifications')} />
              <span className="text-sm text-foreground">SMS notifications</span>
            </label>
          </div>
        </SECTION>

        {/* Submit */}
        <div className="flex items-center gap-3 justify-end pt-2">
          <button type="button" className="btn-secondary h-10 px-5 text-sm" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary h-10 px-6 text-sm disabled:opacity-40"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Registering' : 'Register Patient'}
          </button>
        </div>
      </form>
    </div>
  )
}
