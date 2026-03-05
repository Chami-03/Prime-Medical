import { useForm } from 'react-hook-form'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import AuthShell from './AuthShell'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  const from = location.state?.from?.pathname || '/dashboard'

  const getLoginErrorMessage = (error) => {
    const data = error?.response?.data
    return (
      data?.message ||
      data?.error ||
      data?.data?.message ||
      error?.message ||
      'Invalid email or password'
    )
  }

  const onSubmit = async (data) => {
    setSubmitError('')
    try {
      await login(data.email, data.password)
      toast.success('Welcome back!')
      navigate(from, { replace: true })
    } catch (error) {
      const message = getLoginErrorMessage(error)
      setSubmitError(message)
      toast.error(message)
    }
  }

  return (
    <AuthShell
      activeTab="login"
      title="Welcome back"
      subtitle="Sign in with your account credentials to continue."
      rightTitle="Healthcare operations, unified"
      rightDescription="Appointments, patient history, billing, and inventory in one secure clinical workspace."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          New patient?{' '}
          <Link to="/register" className="text-primary font-medium hover:underline underline-offset-4">
            Create account
          </Link>
          {' '}•{' '}
          <a href="mailto:support@primemedical.com" className="text-primary font-medium hover:underline underline-offset-4">
            Contact IT Support
          </a>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="form-label" htmlFor="email">Email address</label>
              <div className="relative mt-1.5">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="you@hospital.com"
                  className={`form-input pl-9 ${(errors.email || submitError) ? 'border-destructive focus:ring-destructive/20' : ''}`}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' },
                    onChange: () => submitError && setSubmitError(''),
                  })}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="form-label" htmlFor="password">Password</label>
              <div className="relative mt-1.5">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`form-input pl-9 pr-10 ${(errors.password || submitError) ? 'border-destructive focus:ring-destructive/20' : ''}`}
                  {...register('password', {
                    required: 'Password is required',
                    onChange: () => submitError && setSubmitError(''),
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
            </div>

            {/* Remember + forgot */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground select-none">
                <input type="checkbox" className="rounded border-border w-4 h-4 accent-primary" />
                Remember me
              </label>
              <Link to="/login" className="text-sm text-primary hover:underline underline-offset-4 font-medium">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            {submitError && (
              <div className="shake-error rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {submitError}
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full h-11 mt-2 flex items-center justify-center gap-2 rounded-xl shadow-soft hover:shadow-primary"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>

            <p className="text-xs text-muted-foreground text-center pt-1">
              Secure access for authorized Prime Medical users.
            </p>
      </form>
    </AuthShell>
  )
}