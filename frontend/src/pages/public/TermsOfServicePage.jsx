import { Link } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={15} />
            Back to Home
          </Link>
        </div>

        <div className="pm-card p-6 md:p-8">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={18} className="text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Terms of Service</h1>
          </div>
          <p className="text-sm text-muted-foreground">Effective date: March 17, 2026</p>

          <div className="mt-6 space-y-6 text-sm leading-relaxed text-muted-foreground">
            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
              <p>
                By accessing or using Prime Medical, you agree to these Terms of Service. If you do not agree,
                discontinue use of the platform.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">2. Intended Use</h2>
              <p>
                Prime Medical is intended for authorized healthcare organizations and approved users to support
                operational, administrative, and clinical workflows.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">3. User Responsibilities</h2>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Use only authorized accounts and keep credentials confidential.</li>
                <li>Enter accurate and lawful data while using the platform.</li>
                <li>Comply with healthcare, privacy, and workplace policies applicable to your organization.</li>
                <li>Immediately report suspected unauthorized access or security incidents.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">4. Availability and Changes</h2>
              <p>
                We may update, improve, or maintain the platform to preserve performance and security. Temporary
                downtime may occur during maintenance or technical events.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">5. Data and Compliance</h2>
              <p>
                Organizations using Prime Medical remain responsible for lawful handling of medical information,
                retention policy decisions, and compliance with local regulations.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">6. Prohibited Activities</h2>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Attempting to bypass authentication or permission controls.</li>
                <li>Using the platform for unlawful, harmful, or fraudulent activities.</li>
                <li>Reverse engineering or interfering with service stability.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">7. Limitation</h2>
              <p>
                Prime Medical is provided as an operational software service. Clinical decision-making, diagnosis,
                and treatment responsibility remains with licensed medical professionals.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">8. Contact</h2>
              <p>
                For terms-related questions, contact: support.primemedical@gmail.com
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
