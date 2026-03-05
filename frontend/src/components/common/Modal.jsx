import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const maxW = { sm: 'max-w-sm', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }[size] || 'max-w-xl'

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="absolute inset-0" onClick={onClose} />
      <div className={`modal-panel w-full ${maxW} flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
