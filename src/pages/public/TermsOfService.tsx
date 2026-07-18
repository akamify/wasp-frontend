import { FileText, ExternalLink, ShieldCheck, MessageSquareText, Wallet, Ban, Scale, Bot } from "lucide-react";
import { PublicShell } from "@pages/public/PublicShell";
import { Seo } from "@shared/components/Seo";
import { BRAND_NAME } from "@shared/config/brand";

const effectiveDate = "July 4, 2026";

const officialLinks = [
  {
    label: "WhatsApp Business Terms of Service",
    href: "https://www.whatsapp.com/legal/business-terms/",
  },
  {
    label: "WhatsApp Commerce Policy",
    href: "https://whatsappbusiness.com/policy/",
  },
];

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance and Scope",
    icon: FileText,
    paragraphs: [
      `${BRAND_NAME} is a business messaging and automation platform that helps approved businesses manage WhatsApp conversations, approved message templates, broadcasts, contact lists, automation flows, team inbox activity, analytics, APIs, and related workspace tools.`,
      `By creating an account, accessing the platform, connecting a WhatsApp Business account, uploading contacts, sending campaigns, creating automations, or using any related feature, you agree to these Terms of Service.`,
      `${BRAND_NAME} is provided only for lawful business and commercial use. It is not intended for personal messaging, emergency communications, or any use that violates platform rules, consumer protection laws, privacy laws, telecom rules, or Meta and WhatsApp requirements.`,
    ],
    bullets: [
      "You must be at least the legal age of majority in your jurisdiction and authorized to act for your business.",
      "You must provide accurate business, billing, and account information and keep it updated.",
      "If you do not agree to these terms, you must stop using the platform.",
    ],
  },
  {
    id: "accounts",
    title: "2. Accounts, Workspaces, and Authorized Users",
    icon: ShieldCheck,
    paragraphs: [
      `Your account may include one or more workspaces, administrator accounts, employees, agents, or team members. You are responsible for all actions taken through your workspace, credentials, API keys, connected phone numbers, and integrations.`,
    ],
    bullets: [
      "Keep login credentials, API credentials, tokens, and connected devices secure.",
      "Allow access only to authorized personnel acting on behalf of your business.",
      "Promptly disable access for users who no longer need workspace access.",
      "You remain responsible for employee, contractor, and agency actions performed through your account.",
    ],
  },
  {
    id: "meta-compliance",
    title: "3. Meta and WhatsApp Compliance",
    icon: MessageSquareText,
    paragraphs: [
      `Your use of ${BRAND_NAME} must remain compliant with all applicable Meta, WhatsApp, and partner platform terms, policies, documentation, and approval requirements. Our platform does not replace those rules, and your business remains solely responsible for compliance.`,
      `You must follow all current WhatsApp Business Platform rules, including rules on business eligibility, display names, approved use cases, template usage, consent, commerce restrictions, message quality, customer support practices, and user opt-out handling.`,
    ],
    bullets: [
      "You must obtain valid, informed, and lawful opt-in before sending WhatsApp messages where consent is required.",
      "You must keep records showing when, how, and for what purpose consent was collected.",
      "You must honor unsubscribe, stop, block, and opt-out requests without delay.",
      "You must use only approved message templates where WhatsApp requires template-based messaging.",
      "You must not misrepresent your business identity, impersonate another brand, or use misleading display names or profile information.",
      "Meta or WhatsApp may reject templates, limit quality, restrict delivery, or suspend access at their sole discretion.",
    ],
  },
  {
    id: "contacts-and-content",
    title: "4. Contacts, Content, Templates, and Automations",
    icon: Bot,
    paragraphs: [
      `You are solely responsible for all contacts, imports, CSV files, API-synced data, templates, campaign copy, chatbot flows, automation rules, media, attachments, variables, and customer communications sent or stored through ${BRAND_NAME}.`,
      `If you use automation, bots, AI-assisted responses, routing, fallback messages, or campaign scheduling, you are responsible for reviewing output and ensuring that your workflows remain accurate, lawful, and appropriate for the intended audience.`,
    ],
    bullets: [
      "Only upload or sync contact data that you are legally permitted to use.",
      "Do not send deceptive, defamatory, infringing, abusive, or unlawful content.",
      "Do not create automations that hide your identity or deceive recipients about human involvement.",
      "You are responsible for validating message variables, destinations, segmentation, and campaign logic before launch.",
      `${BRAND_NAME} may provide tooling for templates, broadcasts, inbox workflows, CRM-style contact handling, or AI assistance, but your business remains the publisher and sender of message content.`,
    ],
  },
  {
    id: "prohibited-use",
    title: "5. Prohibited and Restricted Use",
    icon: Ban,
    paragraphs: [
      `You may not use ${BRAND_NAME} for any activity that violates law, infringes rights, harms recipients, abuses communication channels, or conflicts with Meta and WhatsApp platform policies.`,
      `Without limiting the above, the platform may not be used for spam, unlawful surveillance, unauthorized scraping, phishing, deceptive lead generation, or any restricted vertical that is blocked or limited by WhatsApp policies unless your business independently satisfies all official conditions and approvals.`,
    ],
    bullets: [
      "Illegal products or services.",
      "Fraud, scams, misleading promotions, impersonation, or identity abuse.",
      "Adult products or services, gambling, multi-level marketing, or exploitative offers where prohibited.",
      "Unapproved promotions involving alcohol, tobacco, drugs, weapons, medical claims, or other regulated sectors restricted by WhatsApp policy or local law.",
      "Bulk messaging without consent, purchased lists, harvested numbers, or repeated messaging after opt-out.",
      "Any use intended to bypass Meta review, conversation rules, quality systems, template approval, rate limits, or enforcement systems.",
    ],
  },
  {
    id: "billing",
    title: "6. Subscription, Wallet, and Charges",
    icon: Wallet,
    paragraphs: [
      `${BRAND_NAME} may offer subscription plans, wallet or credit recharges, feature-based access, message-related charges, and other usage-based fees. Unless stated otherwise in writing, fees are due in advance or at the time of purchase.`,
      `WhatsApp or Meta conversation, template, utility, authentication, marketing, or other third-party charges are separate from your software subscription unless expressly included. Delivery, approval, or platform availability is not guaranteed by payment alone.`,
    ],
    bullets: [
      "You authorize us to charge applicable subscription, top-up, or usage fees using your selected payment method.",
      "Failed or late payment may result in paused features, suspended sending, restricted workspace access, or account suspension.",
      "You are responsible for taxes, duties, and government charges unless the law requires otherwise.",
      "Unless required by law or expressly stated in writing, paid fees are non-refundable after purchase or consumption.",
    ],
  },
  {
    id: "availability",
    title: "7. Availability, Integrations, and Third-Party Dependency",
    icon: ExternalLink,
    paragraphs: [
      `${BRAND_NAME} depends on third-party systems, including Meta and WhatsApp infrastructure, payment providers, cloud services, telecom networks, browser environments, and external APIs. Some features may be delayed, rejected, rate-limited, changed, or unavailable because of those dependencies.`,
      `We do not guarantee that any specific template will be approved, any message will be delivered, any campaign will achieve a target result, or any Meta account, business verification, display name, webhook, embedded signup, or commerce flow will remain continuously available.`,
    ],
    bullets: [
      "We may add, change, limit, or discontinue features for security, legal, technical, or commercial reasons.",
      "Temporary downtime, maintenance windows, and emergency restrictions may occur.",
      "You are responsible for maintaining backup processes for critical customer operations.",
    ],
  },
  {
    id: "privacy-security",
    title: "8. Privacy, Security, and Data Responsibility",
    icon: ShieldCheck,
    paragraphs: [
      `Your business is responsible for giving required notices to customers, maintaining a valid privacy policy, and obtaining all permissions needed to collect, upload, store, process, or message customer data using ${BRAND_NAME}.`,
      `You remain responsible for your own lawful basis for processing personal data and for responding to customer rights requests, opt-outs, deletions, and regulatory obligations applicable to your business.`,
    ],
    bullets: [
      "Implement reasonable administrative, technical, and organizational safeguards.",
      "Do not upload highly sensitive data unless you have independently confirmed that the workflow is lawful and appropriate for your regulatory obligations.",
      "Notify us promptly if you discover unauthorized account access or a security incident affecting your workspace.",
    ],
  },
  {
    id: "suspension",
    title: "9. Suspension and Termination",
    icon: Ban,
    paragraphs: [
      `We may investigate misuse and may suspend, limit, or terminate access to ${BRAND_NAME} if we reasonably believe your account, content, campaigns, or connected integrations create legal, security, policy, payment, abuse, or reputational risk.`,
      `We may also act if Meta, WhatsApp, a payment provider, or another critical partner rejects, limits, or disables your connected services.`,
    ],
    bullets: [
      "Suspension may affect sending, inbox access, automations, billing features, APIs, employees, or all workspace functions.",
      "Termination does not erase fees already due or liability for prior misuse.",
    ],
  },
  {
    id: "ip",
    title: "10. Intellectual Property and Platform Restrictions",
    icon: Scale,
    paragraphs: [
      `The platform, software, design, branding, and underlying systems of ${BRAND_NAME} remain our property or the property of our licensors. We grant you a limited, revocable, non-exclusive, non-transferable right to use the platform during your valid subscription or authorized access period.`,
    ],
    bullets: [
      "You may not resell, sublicense, reverse engineer, copy, scrape, or create competing services from the platform except where law clearly permits.",
      "You retain ownership of your business content, but you grant us the rights reasonably required to host, process, transmit, display, back up, and secure that content in order to provide the service.",
    ],
  },
  {
    id: "disclaimers",
    title: "11. Disclaimers and Limitation of Responsibility",
    icon: Scale,
    paragraphs: [
      `${BRAND_NAME} is provided on an as-available basis to the maximum extent permitted by law. We do not guarantee uninterrupted operation, specific campaign outcomes, customer conversion, template approval, message delivery, or uninterrupted third-party availability.`,
      `We are not responsible for losses caused by customer list quality, missing opt-in, policy violations, template rejection, payment failure, Meta enforcement, telecom disruption, human error in campaign setup, or business decisions made from analytics, AI output, or automation behavior.`,
    ],
  },
  {
    id: "contact",
    title: "12. Contact and Updates",
    icon: FileText,
    paragraphs: [
      `We may update these Terms from time to time. Continued use of ${BRAND_NAME} after an update becomes effective means you accept the revised Terms.`,
      "For legal or compliance questions, contact the business support details listed on our website or Help Center.",
    ],
  },
];

function SectionCard({
  id,
  title,
  icon: Icon,
  paragraphs,
  bullets,
}: {
  id: string;
  title: string;
  icon: typeof FileText;
  paragraphs: string[];
  bullets?: string[];
}) {
  return (
    <section id={id} className="scroll-mt-28 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur-xl sm:p-7">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-black tracking-tight text-slate-950">{title}</h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          {bullets?.length ? (
            <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default function TermsOfServicePage() {
  return (
    <PublicShell>
      <Seo
        title={`Terms of Service | ${BRAND_NAME}`}
        description={`${BRAND_NAME} Terms of Service for WhatsApp messaging, automation, templates, campaigns, billing, and platform compliance.`}
        canonical={window.location.href}
      />

      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/70 to-cyan-50/60 p-6 shadow-[0_18px_60px_rgba(16,185,129,0.10)] sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">
            <FileText className="h-3.5 w-3.5" />
            Terms of Service
          </div>

          <h1 className="mt-5 max-w-4xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Terms for WhatsApp messaging, automation, customer communication, and platform use.
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            These Terms are written for the actual features of {BRAND_NAME}, including WhatsApp
            campaigns, template messaging, contact uploads, automation flows, team inbox use,
            analytics, workspace access, and related integrations.
          </p>

          <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
            <span className="rounded-2xl border border-slate-200 bg-white px-4 py-2">
              Effective date: {effectiveDate}
            </span>
            <span className="rounded-2xl border border-slate-200 bg-white px-4 py-2">
              Business use only
            </span>
            <span className="rounded-2xl border border-slate-200 bg-white px-4 py-2">
              Meta and WhatsApp compliance required
            </span>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-1">

          <div className="rounded-3xl border border-amber-200 bg-amber-50/90 p-6 shadow-sm">
            <h2 className="text-lg font-black text-amber-950">Approval-sensitive reminders</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-amber-900">
              <li className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                <span>Do not message users without valid consent where consent is required.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                <span>Do not use misleading templates, fake urgency, or hidden marketing.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                <span>Do not promote products or services restricted by WhatsApp policy unless independently approved and lawful.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                <span>Your business, not the software, is responsible for list quality, opt-in records, and recipient rights.</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/88 p-6 shadow-sm backdrop-blur-xl">
          <h2 className="text-lg font-black text-slate-950">Contents</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-slate-950"
              >
                {section.title}
              </a>
            ))}
          </div>
        </section>

        <div className="space-y-5">
          {sections.map((section) => (
            <SectionCard key={section.id} {...section} />
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
