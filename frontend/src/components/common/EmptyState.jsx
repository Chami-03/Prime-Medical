import { SearchX } from 'lucide-react'
import Button from './Button'

export default function EmptyState({
    icon: Icon = SearchX,
    title = 'No results found',
    description = 'Try adjusting your search or filters to find what you looking for.',
    actionLabel,
    onAction,
    className = ''
}) {
    return (
        <div className={`flex flex-col items-center justify-center text-center p-16 bg-muted/30 rounded-[3rem] border-2 border-dashed border-border transition-all duration-700 group/empty ${className}`}>
            <div className="w-24 h-24 rounded-[2rem] bg-card shadow-2xl flex items-center justify-center text-muted-foreground mb-8 border border-border group-hover/empty:scale-110 group-hover/empty:rotate-6 transition-all duration-700 overflow-hidden relative">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/empty:opacity-100 transition-opacity" />
                <Icon size={40} strokeWidth={1.5} className="relative z-10 group-hover/empty:text-primary transition-colors" />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-3 tracking-tightest uppercase">{title}</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-10 font-bold leading-relaxed uppercase tracking-widest opacity-60">
                {description}
            </p>
            {actionLabel && onAction && (
                <Button variant="primary" onClick={onAction} size="lg" className="px-10 rounded-2xl shadow-xl active:scale-95">
                    {actionLabel}
                </Button>
            )}
        </div>
    )
}
