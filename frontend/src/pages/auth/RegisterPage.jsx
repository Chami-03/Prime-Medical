import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Mail, Lock, User, Phone, Loader2 } from 'lucide-react'
import { authApi } from '../../api/authApi'
import { useAuth } from '../../context/AuthContext'
import AuthShell from './AuthShell'

export default function RegisterPage() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm()
    const pwd = watch('password')

    const onSubmit = async (data) => {
        try {
            const { confirmPassword, ...rest } = data;
            const payload = { ...rest, role: 'PATIENT' }
            await authApi.register(payload)
            try {
                await login(data.email, data.password)
                toast.success('Registration successful! Welcome to your dashboard.')
                navigate('/dashboard', { replace: true })
            } catch {
                toast.success('Registration successful! Please sign in.')
                navigate('/login', { replace: true })
            }
        } catch (error) {
            console.error(error)
            toast.error(error?.response?.data?.message || 'Registration failed. Try again.')
        }
    }

    return (
        <AuthShell
            activeTab="register"
            title="Create patient account"
            subtitle="Use your own email and password to access appointments and records."
            rightTitle="Digital-first patient experience"
            rightDescription="Self-registration, secure sign-in, and modern care journeys built for 2026 healthcare standards."
            footer={
                <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary font-medium hover:underline underline-offset-4">
                        Sign in
                    </Link>
                </p>
            }
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Personal Details</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="form-label" htmlFor="firstName">First name</label>
                                <div className="relative mt-1.5">
                                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                    <input id="firstName" type="text" className={`form-input pl-9 ${errors.firstName ? 'border-destructive focus:ring-destructive/20' : ''}`} {...register('firstName', { required: 'First name is required' })} />
                                </div>
                                {errors.firstName && <p className="mt-1 text-xs text-destructive">{errors.firstName.message}</p>}
                            </div>

                            <div>
                                <label className="form-label" htmlFor="lastName">Last name</label>
                                <div className="relative mt-1.5">
                                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                    <input id="lastName" type="text" className={`form-input pl-9 ${errors.lastName ? 'border-destructive focus:ring-destructive/20' : ''}`} {...register('lastName', { required: 'Last name is required' })} />
                                </div>
                                {errors.lastName && <p className="mt-1 text-xs text-destructive">{errors.lastName.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="form-label" htmlFor="email">Email address</label>
                                <div className="relative mt-1.5">
                                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                    <input id="email" type="email" className={`form-input pl-9 ${errors.email ? 'border-destructive focus:ring-destructive/20' : ''}`} {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' } })} />
                                </div>
                                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
                            </div>

                            <div>
                                <label className="form-label" htmlFor="phone">Phone number</label>
                                <div className="relative mt-1.5">
                                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                    <input id="phone" type="tel" className={`form-input pl-9 ${errors.phone ? 'border-destructive focus:ring-destructive/20' : ''}`} {...register('phone', { required: 'Phone is required' })} />
                                </div>
                                {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}
                            </div>
                        </div>

                        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold pt-1">Credentials</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="form-label" htmlFor="nicNumber">NIC / National ID</label>
                                <input id="nicNumber" type="text" className="form-input mt-1.5" placeholder="Optional" {...register('nicNumber')} />
                            </div>

                            <div>
                                <label className="form-label" htmlFor="address">Address</label>
                                <input id="address" type="text" className="form-input mt-1.5" placeholder="Optional" {...register('address')} />
                            </div>
                        </div>

                        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold pt-1">Emergency & Preferences</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="form-label" htmlFor="dateOfBirth">Date of birth</label>
                                <input id="dateOfBirth" type="date" className={`form-input mt-1.5 ${errors.dateOfBirth ? 'border-destructive focus:ring-destructive/20' : ''}`} {...register('dateOfBirth', { required: 'Date of birth is required' })} />
                                {errors.dateOfBirth && <p className="mt-1 text-xs text-destructive">{errors.dateOfBirth.message}</p>}
                            </div>

                            <div>
                                <label className="form-label" htmlFor="gender">Gender</label>
                                <select id="gender" className={`form-input mt-1.5 ${errors.gender ? 'border-destructive focus:ring-destructive/20' : ''}`} {...register('gender', { required: 'Gender is required' })}>
                                    <option value="">Select Gender</option>
                                    <option value="MALE">Male</option>
                                    <option value="FEMALE">Female</option>
                                    <option value="OTHER">Other</option>
                                </select>
                                {errors.gender && <p className="mt-1 text-xs text-destructive">{errors.gender.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="form-label" htmlFor="password">Password</label>
                                <div className="relative mt-1.5">
                                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                    <input id="password" type="password" className={`form-input pl-9 ${errors.password ? 'border-destructive focus:ring-destructive/20' : ''}`} {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Minimum 8 characters' } })} />
                                </div>
                                {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
                            </div>

                            <div>
                                <label className="form-label" htmlFor="confirmPassword">Confirm password</label>
                                <div className="relative mt-1.5">
                                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                    <input id="confirmPassword" type="password" className={`form-input pl-9 ${errors.confirmPassword ? 'border-destructive focus:ring-destructive/20' : ''}`} {...register('confirmPassword', { required: 'Confirm password is required', validate: (value) => value === pwd || 'Passwords do not match' })} />
                                </div>
                                {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="form-label" htmlFor="emergencyContactName">Emergency contact name</label>
                                <input id="emergencyContactName" type="text" className="form-input mt-1.5" placeholder="Optional" {...register('emergencyContactName')} />
                            </div>

                            <div>
                                <label className="form-label" htmlFor="emergencyContactPhone">Emergency contact phone</label>
                                <input id="emergencyContactPhone" type="text" className="form-input mt-1.5" placeholder="Optional" {...register('emergencyContactPhone')} />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 py-1">
                            <label className="flex items-center gap-2 text-sm text-muted-foreground select-none">
                                <input type="checkbox" className="rounded border-border w-4 h-4 accent-primary" {...register('emailNotifications')} defaultChecked />
                                Email notifications
                            </label>
                            <label className="flex items-center gap-2 text-sm text-muted-foreground select-none">
                                <input type="checkbox" className="rounded border-border w-4 h-4 accent-primary" {...register('smsNotifications')} />
                                SMS notifications
                            </label>
                        </div>

                        <button type="submit" disabled={isSubmitting} className="btn-primary w-full h-10 mt-2 flex items-center justify-center gap-2">
                            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                            {isSubmitting ? 'Creating account…' : 'Create account'}
                        </button>

                        <p className="text-xs text-muted-foreground text-center pt-1">
                            Your information is used only for secure healthcare service management.
                        </p>
            </form>
        </AuthShell>
    )
}
