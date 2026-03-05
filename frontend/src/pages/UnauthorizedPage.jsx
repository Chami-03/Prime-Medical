import { Link } from 'react-router-dom'
import { ShieldAlert, ChevronLeft } from 'lucide-react'
import Button from '../components/common/Button'

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-md w-full text-center space-y-10 animate-in fade-in zoom-in-95 duration-700 relative z-10">
                <div className="flex justify-center">
                    <div className="w-24 h-24 bg-destructive/10 text-destructive rounded-[2.5rem] flex items-center justify-center border-2 border-destructive/20 shadow-2xl shadow-destructive/10 animate-bounce-subtle">
                        <ShieldAlert size={48} strokeWidth={2.5} />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-3 text-destructive font-black text-[10px] uppercase tracking-[0.4em]">
                        <span className="w-8 h-px bg-destructive/30" />
                        Access Denied
                        <span className="w-8 h-px bg-destructive/30" />
                    </div>
                    <h1 className="text-5xl font-black text-foreground tracking-tightest uppercase">
                        Access <span className="text-destructive italic">Denied</span>
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm leading-relaxed px-4">
                        You don't have permission to access this page. If you believe this is a system error, please contact the Administrator.
                    </p>
                </div>

                <div className="pt-4">
                    <Link to="/dashboard">
                        <Button variant="outline" size="lg" className="rounded-2xl font-black uppercase tracking-[0.2em] px-8 pl-6 gap-3">
                            <ChevronLeft size={18} strokeWidth={3} />
                            Return to Dashboard
                        </Button>
                    </Link>
                </div>

                <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.3em] font-mono">
                    ERROR_CODE: 403_CLEARANCE_INSUFFICIENT
                </p>
            </div>
        </div>
    )
}
