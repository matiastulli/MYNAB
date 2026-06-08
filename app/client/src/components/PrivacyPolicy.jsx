"use client"

import { DollarSignIcon } from "lucide-react"
import { Link } from "react-router-dom"

const LAST_UPDATED = "June 8, 2026"
const CONTACT_EMAIL = "pampasstudiodev@gmail.com"

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">{title}</h2>
      <div className="text-sm text-[hsl(var(--muted-foreground))] space-y-2 leading-relaxed">
        {children}
      </div>
    </section>
  )
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background))] via-[hsl(var(--background))] to-[hsl(var(--muted))]">
      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="mb-10 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors text-sm">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[hsl(var(--accent)/0.2)] to-[hsl(var(--accent)/0.1)] flex items-center justify-center">
              <DollarSignIcon className="h-4 w-4 text-[hsl(var(--accent))]" />
            </div>
            <span className="font-bold tracking-wider">MYNAB</span>
          </Link>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-2">Privacy Policy</h1>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Last updated: {LAST_UPDATED}</p>
        </div>

        {/* Content card */}
        <div className="bg-[var(--glass-bg-heavy)] backdrop-blur-xl border border-[var(--glass-border)] rounded-[var(--glass-radius)] shadow-[var(--glass-shadow)] p-6 md:p-8 space-y-8">

          <Section title="1. Introduction">
            <p>
              MYNAB ("Maybe You Need A Budget") is a personal budgeting application operated by Pampas Studio
              ("we", "us", or "our"). This Privacy Policy explains what information we collect when you use MYNAB,
              how we use it, and the choices you have.
            </p>
            <p>
              By using MYNAB you agree to the collection and use of information described in this policy.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <p><strong className="text-[hsl(var(--foreground))]">Account information.</strong> When you sign in with Google we receive your name, email address, and Google account ID. We do not receive your Google password.</p>
            <p><strong className="text-[hsl(var(--foreground))]">Financial data.</strong> When you import a bank statement we store the raw file and the transactions extracted from it (description, amount, date, currency, category). When you add a transaction manually we store the same fields. We also store computed summaries (monthly income, expenses, balances by currency).</p>
            <p><strong className="text-[hsl(var(--foreground))]">Usage data.</strong> We do not collect analytics, crash reports, advertising identifiers, or device information beyond what is necessary to authenticate your session (a short-lived JWT and an httpOnly refresh token cookie).</p>
          </Section>

          <Section title="3. How We Use Your Information">
            <p>We use the information we collect solely to provide the MYNAB budgeting service:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Authenticate your account via Google OAuth</li>
              <li>Store and display your transactions and financial summaries</li>
              <li>Auto-categorize imported transactions using pattern matching</li>
              <li>Allow you to filter, search, and delete your financial data</li>
            </ul>
            <p>We do not use your data for advertising, profiling, or any purpose other than operating the service for you personally.</p>
          </Section>

          <Section title="4. Data Sharing">
            <p>We do not sell, rent, or share your personal information with third parties, except:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong className="text-[hsl(var(--foreground))]">Infrastructure.</strong> Your data is stored on servers provided by Railway (railway.app) and a managed PostgreSQL database. Railway processes data on our behalf and is bound by their own security and data protection commitments.</li>
              <li><strong className="text-[hsl(var(--foreground))]">Legal requirements.</strong> We may disclose information if required by law or to protect the rights and safety of users.</li>
            </ul>
          </Section>

          <Section title="5. Data Storage and Security">
            <p>All communication between your device and MYNAB servers is encrypted in transit using HTTPS (TLS). Authentication uses short-lived JWT tokens and an httpOnly refresh token cookie to limit exposure.</p>
            <p>Your financial data (transactions, bank statement files) is stored in a PostgreSQL database hosted on Railway's infrastructure. We apply reasonable technical safeguards; however, no system is 100% secure and we cannot guarantee absolute security.</p>
          </Section>

          <Section title="6. Data Retention and Deletion">
            <p>Your data is retained for as long as you have an account. You can delete your data at any time:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong className="text-[hsl(var(--foreground))]">Bank statement files.</strong> Delete individual imported files from the Bank Statements tab. Deleting a file also removes all transactions associated with it.</li>
              <li><strong className="text-[hsl(var(--foreground))]">Individual transactions.</strong> Delete any transaction from the Activity tab.</li>
              <li><strong className="text-[hsl(var(--foreground))]">Full account deletion.</strong> To permanently delete your account and all associated data, email us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-[hsl(var(--accent))] hover:underline">{CONTACT_EMAIL}</a> with the subject "Delete my account". We will process your request within 30 days.</li>
            </ul>
          </Section>

          <Section title="7. Children's Privacy">
            <p>MYNAB is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us and we will delete it promptly.</p>
          </Section>

          <Section title="8. Your Rights">
            <p>Depending on your location you may have the right to access, correct, or delete the personal information we hold about you, or to object to or restrict certain processing. To exercise any of these rights, contact us at the address below.</p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. When we do we will update the "Last updated" date at the top. Continued use of MYNAB after changes are posted constitutes your acceptance of the revised policy.</p>
          </Section>

          <Section title="10. Contact">
            <p>
              Questions or requests regarding this Privacy Policy can be sent to:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[hsl(var(--accent))] hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </Section>
        </div>

        <p className="text-center text-xs text-[hsl(var(--muted-foreground))] mt-8">
          © {new Date().getFullYear()} MYNAB. All rights reserved.
        </p>
      </div>
    </div>
  )
}
