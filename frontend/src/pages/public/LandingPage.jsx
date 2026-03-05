import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Menu,
  X,
  ShieldCheck,
  CalendarCheck2,
  FileText,
  Wallet,
  Boxes,
  LineChart,
  CircleHelp,
  Users,
  Lock,
  Sparkles,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import ThemeToggle from '../../components/common/ThemeToggle'

function Reveal({ children, delay = 0 }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      {children}
    </div>
  )
}

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Secure patient data management',
    description: 'Healthcare-grade protections to keep records safe, organized, and confidential.',
  },
  {
    icon: CalendarCheck2,
    title: 'Efficient appointment coordination',
    description: 'Simplifies scheduling workflows for smoother patient and provider experiences.',
  },
  {
    icon: FileText,
    title: 'Digital medical records',
    description: 'Move from paper-heavy workflows to centralized digital documentation.',
  },
  {
    icon: Wallet,
    title: 'Smart billing and payments',
    description: 'Supports transparent billing operations with cleaner financial tracking.',
  },
  {
    icon: Boxes,
    title: 'Inventory tracking for pharmacies',
    description: 'Improves visibility of stock flow and medicine availability.',
  },
  {
    icon: LineChart,
    title: 'Analytics and reporting support',
    description: 'Gives teams clearer insights for better operational decisions.',
  },
]

const FAQS = [
  {
    q: 'What is Prime Medical?',
    a: 'Prime Medical is a modern digital healthcare platform designed for medical centers to manage daily operations in a secure environment.',
  },
  {
    q: 'Who can use this system?',
    a: 'Healthcare staff, clinic administrators, and authorized medical center teams can use Prime Medical based on role-based access.',
  },
  {
    q: 'Is patient data secure?',
    a: 'Yes. Prime Medical is built with secure authentication and data handling practices suitable for healthcare workflows.',
  },
  {
    q: 'Can hospitals customize the platform?',
    a: 'Yes. The platform can be configured to align with each medical center’s operational processes and structure.',
  },
  {
    q: 'How do I register?',
    a: 'Use the Register button on this page, create your account, and sign in to start using the platform.',
  },
]

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState(0)
  const logoSrc = '/PrimeMedical.png'

  const closeMobile = () => setMobileOpen(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed top-0 inset-x-0 z-50 border-b border-border/70 bg-card/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoSrc} alt="Prime Medical" className="w-11 h-11 object-contain" />
            <span className="font-semibold tracking-tight text-base">Prime Medical</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-base font-semibold text-muted-foreground">
            <a href="#home" className="hover:text-foreground transition-colors">Home</a>
            <a href="#about" className="hover:text-foreground transition-colors">About</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#faqs" className="hover:text-foreground transition-colors">FAQs</a>
            <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            <Link to="/login" className="btn-outline">Login</Link>
            <Link to="/register" className="btn-primary">Register</Link>
          </div>

          <button
            type="button"
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-border bg-card/95 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 py-3 space-y-3 text-base font-medium">
              <a href="#home" onClick={closeMobile} className="block hover:text-primary">Home</a>
              <a href="#about" onClick={closeMobile} className="block hover:text-primary">About</a>
              <a href="#features" onClick={closeMobile} className="block hover:text-primary">Features</a>
              <a href="#faqs" onClick={closeMobile} className="block hover:text-primary">FAQs</a>
              <a href="#contact" onClick={closeMobile} className="block hover:text-primary">Contact</a>
              <div className="pt-1">
                <ThemeToggle />
              </div>
              <div className="flex gap-2 pt-2">
                <Link to="/login" className="btn-outline flex-1 text-center" onClick={closeMobile}>Login</Link>
                <Link to="/register" className="btn-primary flex-1 text-center" onClick={closeMobile}>Register</Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="pt-16">
        <section id="home" className="scroll-mt-20 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-28 -left-16 w-80 h-80 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute top-1/3 right-0 w-80 h-80 rounded-full bg-cyan-500/20 blur-3xl" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 grid lg:grid-cols-2 gap-10 items-center relative z-10">
            <Reveal>
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                  Prime Medical
                </h1>

                <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                  Prime Medical is a secure digital healthcare platform that helps medical centers manage patient records,
                  appointments, consultations, prescriptions, billing, and pharmacy operations in an organized environment.
                </p>

                <p className="text-base text-muted-foreground">
                  Improve care coordination, streamline daily workflows, and deliver better healthcare experiences with one unified system.
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Link to="/register" className="btn-primary rounded-2xl px-6 py-3 shadow-soft hover:-translate-y-0.5 transition-transform">
                    Get Started
                  </Link>
                  <a href="#about" className="btn-outline rounded-2xl px-6 py-3 shadow-soft hover:-translate-y-0.5 transition-transform">
                    Learn More
                  </a>
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="rounded-3xl border border-border/60 bg-card/65 backdrop-blur-xl p-6 md:p-8 shadow-soft">
                <div className="rounded-2xl border border-border bg-background/80 p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-card border border-border p-4">
                      <p className="text-xs text-muted-foreground">Security</p>
                      <p className="text-sm font-semibold mt-1">Protected Access</p>
                    </div>
                    <div className="rounded-xl bg-card border border-border p-4">
                      <p className="text-xs text-muted-foreground">Performance</p>
                      <p className="text-sm font-semibold mt-1">Fast Workflows</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-5">
                    <p className="text-sm text-muted-foreground">Trusted by modern healthcare teams to deliver organized, connected patient services.</p>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="h-2 rounded-full bg-primary/25" />
                      <div className="h-2 rounded-full bg-primary/45" />
                      <div className="h-2 rounded-full bg-primary/70" />
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                    <ShieldCheck size={18} className="text-primary" />
                    <span className="text-sm">Built for professional medical center environments</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="about" className="scroll-mt-20 py-16 md:py-20 border-t border-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <Reveal>
              <div className="max-w-3xl mx-auto text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">About Prime Medical</h2>
                <p className="mt-3 text-muted-foreground">A digital foundation for healthcare providers to manage services more effectively.</p>
              </div>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-5">
              {[{
                icon: Users,
                text: 'Prime Medical helps healthcare teams organize patient information and care activities in one secure place.',
              }, {
                icon: Lock,
                text: 'It supports digital workflows for appointments and medical services while maintaining professional data handling standards.',
              }, {
                icon: CircleHelp,
                text: 'The platform is designed to reduce operational complexity and improve day-to-day healthcare coordination.',
              }].map((item, i) => (
                <Reveal delay={i * 90} key={item.text}>
                  <article className="h-full rounded-2xl border border-border/70 bg-card/70 backdrop-blur-xl p-6 shadow-soft hover:shadow-card-hover transition-all">
                    <item.icon size={18} className="text-primary" />
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-20 py-16 md:py-20 border-t border-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <Reveal>
              <div className="max-w-3xl mx-auto text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Key Features</h2>
                <p className="mt-3 text-muted-foreground">General platform capabilities built for modern medical operations.</p>
              </div>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((feature, i) => (
                <Reveal key={feature.title} delay={i * 60}>
                  <article className="h-full rounded-2xl border border-border/70 bg-card/70 backdrop-blur-xl p-6 shadow-soft hover:-translate-y-1 hover:shadow-card-hover transition-all">
                    <feature.icon size={18} className="text-primary" />
                    <h3 className="mt-3 text-base font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20 border-t border-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <Reveal>
              <div className="max-w-3xl mx-auto text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">How the System Works</h2>
                <p className="mt-3 text-muted-foreground">Get started in three simple steps.</p>
              </div>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-5">
              {[
                'Create an account',
                'Log into the system',
                'Manage healthcare services digitally',
              ].map((step, i) => (
                <Reveal key={step} delay={i * 90}>
                  <article className="rounded-2xl border border-border/70 bg-card/75 backdrop-blur-xl p-6 shadow-soft">
                    <div className="w-9 h-9 rounded-full bg-primary/15 text-primary font-semibold flex items-center justify-center">
                      {i + 1}
                    </div>
                    <h3 className="mt-4 text-base font-semibold">{step}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">A clear onboarding flow built for healthcare teams and clinical staff.</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="faqs" className="scroll-mt-20 py-16 md:py-20 border-t border-border/60">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <Reveal>
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Frequently Asked Questions</h2>
              </div>
            </Reveal>

            <div className="space-y-3">
              {FAQS.map((item, i) => {
                const open = openFaq === i
                return (
                  <Reveal key={item.q} delay={i * 70}>
                    <article className="rounded-2xl border border-border/70 bg-card/75 backdrop-blur-xl shadow-soft overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setOpenFaq(open ? -1 : i)}
                        className="w-full px-5 py-4 text-left flex items-center justify-between gap-3"
                      >
                        <span className="font-medium">{item.q}</span>
                        <ChevronDown
                          size={18}
                          className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {open && (
                        <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                          {item.a}
                        </div>
                      )}
                    </article>
                  </Reveal>
                )
              })}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20 border-t border-border/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <Reveal>
              <div className="rounded-3xl border border-border/70 bg-card/75 backdrop-blur-xl p-8 md:p-10 shadow-soft text-center">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Ready to modernize your medical center?</h2>
                <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
                  Start using Prime Medical to streamline healthcare operations and build a smarter patient service experience.
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link to="/register" className="btn-primary rounded-2xl px-6 py-3">
                    Register Now
                    <ArrowRight size={16} />
                  </Link>
                  <Link to="/login" className="btn-outline rounded-2xl px-6 py-3">
                    Login
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer id="contact" className="scroll-mt-20 border-t border-border/70 bg-card/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                <img src={logoSrc} alt="Prime Medical" className="w-[90%] h-[90%] object-contain" />
              </span>
              <span className="font-semibold">Prime Medical</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">A modern digital healthcare platform for secure and organized medical center operations.</p>
          </div>

          <div>
            <h3 className="font-semibold">Quick Links</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="#home" className="hover:text-foreground">Home</a></li>
              <li><a href="#about" className="hover:text-foreground">About</a></li>
              <li><a href="#features" className="hover:text-foreground">Features</a></li>
              <li><a href="#faqs" className="hover:text-foreground">FAQs</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Contact</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Email: support@primemedical.lk</li>
              <li>Phone: +94 11 234 5678</li>
              <li>Location: Colombo, Sri Lanka</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Legal</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-foreground">Terms of Service</a></li>
            </ul>
            <div className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 size={14} className="text-primary" />
              Built for professional healthcare environments
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
