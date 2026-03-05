export default function Input({
  label,
  error,
  type = 'text',
  placeholder,
  register,
  required = false,
  className = '',
  helpText,
  icon: Icon,
  ...rest
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        )}
        <input
          type={type}
          placeholder={placeholder}
          className={`form-input ${Icon ? 'pl-9' : ''} ${error ? 'border-destructive focus:ring-destructive/20' : ''} ${rest.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          {...(register || {})}
          {...rest}
        />
      </div>
      {helpText && !error && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
