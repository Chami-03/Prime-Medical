import { Link } from 'react-router-dom'
import { ShieldCheck, Sparkles, Stethoscope } from 'lucide-react'
import ThemeToggle from '../../components/common/ThemeToggle'

export default function AuthShell({
  activeTab,
  title,
  subtitle,
  children,
  rightTitle,
  rightDescription,
  footer,
}) {
  const isLogin = activeTab === 'login'
  const logoSrc = '/PrimeMedical.png'

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden overflow-y-auto">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-[30rem] h-[30rem] rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/4 w-[26rem] h-[26rem] rounded-full bg-violet-500/20 blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen flex items-start lg:items-center justify-center px-4 py-8 lg:py-10">
        <div className="w-full max-w-6xl rounded-3xl border border-border/60 bg-card/55 backdrop-blur-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-5">
          <aside className="hidden lg:flex lg:col-span-2 bg-primary text-primary-foreground p-10 flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 opacity-15"
              style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '30px 30px' }} />

            <div className="relative z-10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 overflow-hidden">
                <img src={logoSrc} alt="Prime Medical" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-semibold tracking-tight">Prime Medical</p>
                <p className="text-xs text-primary-foreground/75">Smart Care Platform • 2026</p>
              </div>
            </div>

            <div className="relative z-10 space-y-4">
              <h2 className="text-4xl font-bold leading-tight">{rightTitle}</h2>
              <p className="text-primary-foreground/80 leading-relaxed">{rightDescription}</p>

              <div className="grid grid-cols-1 gap-3 pt-2">
                <div className="rounded-xl border border-white/25 bg-white/10 backdrop-blur-xl px-4 py-3 flex items-center gap-3">
                  <ShieldCheck size={16} />
                  <span className="text-sm">Secure authentication + encrypted sessions</span>
                </div>
                <div className="rounded-xl border border-white/25 bg-white/10 backdrop-blur-xl px-4 py-3 flex items-center gap-3">
                  <Sparkles size={16} />
                  <span className="text-sm">Modern 2026 portal experience</span>
                </div>
                <div className="rounded-xl border border-white/25 bg-white/10 backdrop-blur-xl px-4 py-3 flex items-center gap-3">
                  <Stethoscope size={16} />
                  <span className="text-sm">Patient-first clinical workflows</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 text-xs text-primary-foreground/70">
              HIPAA-aware • FHIR-ready • Zero-paper operations
            </div>
          </aside>

          <main className="col-span-1 lg:col-span-3 p-6 md:p-10 xl:p-12">
            <div className="w-full max-w-2xl mx-auto">
              <div className="lg:hidden flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground overflow-hidden">
                  <img src={logoSrc} alt="Prime Medical" className="w-full h-full object-cover" />
                </div>
                <div className="text-sm font-semibold">Prime Medical</div>
              </div>

              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="inline-flex rounded-2xl border border-border/70 bg-card/70 backdrop-blur-xl p-1.5 shadow-soft">
                  <Link
                    to="/login"
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      isLogin
                        ? 'bg-background text-foreground shadow-sm border border-border/70'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      !isLogin
                        ? 'bg-background text-foreground shadow-sm border border-border/70'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Register
                  </Link>
                </div>

                <ThemeToggle />
              </div>

              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{title}</h1>
              <p className="mt-2 text-muted-foreground">{subtitle}</p>

              <div className="mt-8 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xl p-5 md:p-6 shadow-soft">
                {children}
              </div>

              {footer ? <div className="mt-6">{footer}</div> : null}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
