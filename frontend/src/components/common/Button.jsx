import { Loader2 } from 'lucide-react'

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  size = 'md',
  className = '',
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 disabled:pointer-events-none'

  const variants = {
    primary:   'btn-primary',
    secondary: 'btn-secondary',
    outline:   'btn-outline',
    ghost:     'btn-ghost',
    danger:    'btn-danger',
    success:   'bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg',
  }

  const sizes = {
    xs: 'h-7 px-2.5 text-xs rounded-md',
    sm: 'h-8 px-3 text-sm rounded-lg',
    md: 'h-9 px-4 text-sm rounded-lg',
    lg: 'h-10 px-5 text-sm rounded-lg',
    xl: 'h-11 px-6 text-base rounded-xl',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  )
}
