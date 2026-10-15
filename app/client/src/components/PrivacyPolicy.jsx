"use client"

import { ArrowLeftIcon } from "@phosphor-icons/react"
import { Link } from "react-router-dom"

const LAST_UPDATED = "June 8, 2026"
const CONTACT_EMAIL = "pampasstudiodev@gmail.com"

function Section({ title, children }) {
  return (
    <section className="grid gap-3 py-8 first:pt-0 md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] md:gap-10">
      <h2 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="max-w-[65ch] space-y-3 text-[15px] leading-relaxed text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground [&_a]:text-accent [&_a]:underline-offset-4 [&_a:hover]:underline">
        {children}
      </div>
    </section>
  )
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 px-4 py-10 sm:px-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16 lg:py-16">

        {/* Header column */}
        <aside className="flex flex-col gap-8 lg:sticky lg:top-16 lg:h-fit">
          <Link to="/" className="inline-flex w-fit items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeftIcon className="size-4" />
            Back to MYNAB
          </Link>
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Legal</p>
            <h1 className="text-4xl font-semibold leading-none tracking-tighter md:text-5xl">Privacy Policy</h1>
            <p className="figure text-xs text-muted-foreground">Last updated {LAST_UPDATED}</p>
          </div>
          <p className="max-w-[40ch] text-sm leading-relaxed text-muted-foreground">
            Questions about your data go to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent underline-offset-4 hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        </aside>

        {/* Content */}
        <div className="divide-y divide-border/70 rounded-[1.75rem] border border-border/70 bg-card px-6 py-8 shadow-[var(--shadow-diffuse)] md:px-10 md:py-10">

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
            <p><strong>Account information.</strong> When you sign in with Google we receive your name, email address, and Google account ID. We do not receive your Google password.</p>
            <p><strong>Financial data.</strong> When you import a bank statement we store the raw file and the transactions extracted from it (description, amount, date, currency, category). When you add a transaction manually we store the same fields. We also store computed summaries (monthly income, expenses, balances by currency).</p>
            <p><strong>Usage data.</strong> We do not collect analytics, crash reports, advertising identifiers, or device information beyond what is necessary to authenticate your session (a short-lived JWT and an httpOnly refresh token cookie).</p>
          </Section>

          <Section title="3. How We Use Your Information">
            <p>We use the information we collect solely to provide the MYNAB budgeting service:</p>
            <ul className="ml-1 list-disc space-y-1.5 pl-4 marker:text-border">
              <li>Authenticate your account via Google OAuth</li>
              <li>Store and display your transactions and financial summaries</li>
              <li>Auto-categorize imported transactions using pattern matching</li>
              <li>Allow you to filter, search, and delete your financial data</li>
            </ul>
            <p>We do not use your data for advertising, profiling, or any purpose other than operating the service for you personally.</p>
          </Section>

          <Section title="4. Data Sharing">
            <p>We do not sell, rent, or share your personal information with third parties, except:</p>
            <ul className="ml-1 list-disc space-y-1.5 pl-4 marker:text-border">
              <li><strong>Infrastructure.</strong> Your data is stored on servers provided by Railway (railway.app) and a managed PostgreSQL database. Railway processes data on our behalf and is bound by their own security and data protection commitments.</li>
              <li><strong>Legal requirements.</strong> We may disclose information if required by law or to protect the rights and safety of users.</li>
            </ul>
          </Section>

          <Section title="5. Data Storage and Security">
            <p>All communication between your device and MYNAB servers is encrypted in transit using HTTPS (TLS). Authentication uses short-lived JWT tokens and an httpOnly refresh token cookie to limit exposure.</p>
            <p>Your financial data (transactions, bank statement files) is stored in a PostgreSQL database hosted on Railway's infrastructure. We apply reasonable technical safeguards; however, no system is 100% secure and we cannot guarantee absolute security.</p>
          </Section>

          <Section title="6. Data Retention and Deletion">
            <p>Your data is retained for as long as you have an account. You can delete your data at any time:</p>
            <ul className="ml-1 list-disc space-y-1.5 pl-4 marker:text-border">
              <li><strong>Bank statement files.</strong> Delete individual imported files from the Bank Statements tab. Deleting a file also removes all transactions associated with it.</li>
              <li><strong>Individual transactions.</strong> Delete any transaction from the Activity tab.</li>
              <li><strong>Full account deletion.</strong> To permanently delete your account and all associated data, email us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with the subject "Delete my account". We will process your request within 30 days.</li>
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
              <a href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
            </p>
          </Section>
        </div>

        <p className="text-xs text-muted-foreground lg:col-start-2">
          © {new Date().getFullYear()} Pampas Studio. All rights reserved.
        </p>
      </div>
    </div>
  )
}
