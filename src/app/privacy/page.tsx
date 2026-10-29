export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="bg-white border border-ink-100 rounded-3xl p-8 sm:p-10 shadow-sm space-y-6 text-sm text-ink-700 leading-relaxed">
        <div>
          <div className="text-xs font-bold uppercase text-brand-600 mb-1">Legal &amp; Policies</div>
          <h1 className="text-3xl font-extrabold text-ink-900">Privacy Policy</h1>
          <p className="text-xs text-ink-400 mt-1">Last updated: October 2026</p>
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-ink-900">1. Information We Collect</h2>
          <p>
            When you purchase a gift card, create an account, or contact support, we collect your name, email address,
            billing address, and any recipient details or custom card photos you choose to provide. Payment card numbers
            are handled directly by Stripe and are never stored on our servers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-ink-900">2. How We Use Your Information</h2>
          <p>
            We use your information exclusively to process and fulfill your gift card orders, send transactional order
            confirmations and recipient gift notifications via Zoho Mail SMTP, provide order lookup and balance support,
            and prevent fraudulent transactions.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-ink-900">3. Third-Party Service Providers</h2>
          <p>
            We share only the minimum necessary data with trusted infrastructure providers: Stripe (payment processing
            and invoicing), Giftbit (digital gift card issuance), Vercel Blob (custom card face photo storage), and
            Zoho Mail (transactional email delivery).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-ink-900">4. Contact Us</h2>
          <p>
            For privacy questions or data deletion requests, contact us at{" "}
            <span className="font-semibold text-ink-900">support@buygiftcards.online</span>.
          </p>
        </section>
      </div>
    </div>
  );
}
