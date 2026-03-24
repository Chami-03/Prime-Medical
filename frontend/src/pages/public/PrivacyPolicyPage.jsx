import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export default function PrivacyPolicyPage() {
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
            <ShieldCheck size={18} className="text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Privacy Policy</h1>
          </div>
          <p className="text-sm text-muted-foreground">Last updated: March 17, 2026</p>

          <div className="mt-6 space-y-6 text-sm leading-relaxed text-muted-foreground">
            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">1. Overview</h2>
              <p>
                Prime Medical protects personal and health-related information used within the platform. This policy
                explains what we collect, how we use it, and how we keep it secure when clinics, staff, and patients
                use Prime Medical services.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">2. Data We Collect</h2>
              <p>We may process the following categories of information:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Account information such as name, email address, and role.</li>
                <li>Patient details required for appointments, records, prescriptions, and billing.</li>
                <li>Operational data such as queue status, inventory events, and system activity logs.</li>
                <li>Technical metadata including browser information and authentication session details.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">3. How Data Is Used</h2>
              <p>Information is used to operate the medical platform and support healthcare workflows, including:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Providing patient care workflows and appointment coordination.</li>
                <li>Managing prescriptions, billing operations, and clinical administration.</li>
                <li>Improving reliability, security, and auditability of the system.</li>
                <li>Complying with applicable legal and regulatory obligations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">4. Data Protection</h2>
              <p>
                Prime Medical uses access controls, role-based permissions, and secure authentication to limit
                unauthorized access. Platform owners are responsible for maintaining proper user permissions,
                password hygiene, and local organizational compliance processes.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">5. Data Sharing</h2>
              <p>
                Prime Medical does not sell patient or staff information. Data is shared only when required to deliver
                platform features, support clinic operations, or satisfy legal requirements.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">6. Data Retention</h2>
              <p>
                Data is retained according to healthcare operational needs, clinic policy, and applicable laws. Clinics
                can request export or deletion processes where permitted and operationally safe.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">7. Contact</h2>
              <p>
                For privacy-related questions, contact: support.primemedical@gmail.com
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
