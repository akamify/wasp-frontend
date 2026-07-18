import { Cookie, Database, ExternalLink, FileText, Globe, Lock, Mail, MessageSquareText, ShieldCheck, Users } from "lucide-react";
import { PublicShell } from "@pages/public/PublicShell";
import { Seo } from "@shared/components/Seo";
import { BRAND_NAME } from "@shared/config/brand";

const effectiveDate = "July 4, 2026";

const officialLinks = [
  {
    label: "WATI Privacy Policy",
    href: "https://www.wati.io/privacy-policy/",
  },
  {
    label: "WhatsApp Privacy Policy",
    href: "https://www.whatsapp.com/legal/privacy-policy",
  },
  {
    label: "WhatsApp Business Terms of Service",
    href: "https://www.whatsapp.com/legal/business-terms/",
  },
];

const sections = [
  {
    id: "overview",
    title: "1. Overview",
    icon: FileText,
    paragraphs: [
      `${BRAND_NAME} provides business messaging software for WhatsApp operations, including workspace management, team inbox access, contact management, template management, campaign sending, automation flows, support workflows, analytics, billing, and related integrations.`,
      `This Privacy Policy explains how we collect, use, store, disclose, and protect personal data when you visit our website, create an account, use the platform, contact support, apply for a role, or otherwise interact with ${BRAND_NAME}.`,
      `This policy is intended to describe our own data practices. It does not replace the privacy obligations that apply directly to your business under WhatsApp, Meta, payment providers, or applicable law.`,
    ],
  },
  {
    id: "roles",
    title: "2. Our Role in Processing Data",
    icon: Users,
    paragraphs: [
      `For website visitors, account owners, billing contacts, support requestors, and job applicants, ${BRAND_NAME} generally acts as the business deciding how that data is used for our own operations.`,
      `For customer and messaging data that a workspace uploads, syncs, stores, or sends through the platform, ${BRAND_NAME} generally acts as a service provider or processor on behalf of the workspace or business customer that controls that data and gives us instructions through platform use.`,
      `If you are an end customer messaging a business through WhatsApp, that business is usually the primary party responsible for its own notice, consent, messaging, and data handling practices.`,
    ],
  },
  {
    id: "collection",
    title: "3. Information We Collect",
    icon: Database,
    paragraphs: [
      `The information we collect depends on how you use ${BRAND_NAME}. We collect only the categories of information reasonably needed to operate, secure, bill, support, and improve the platform.`,
    ],
    bullets: [
      "Account and profile data, such as name, email address, phone number, password-related data, role, workspace membership, and authentication status.",
      "Business and workspace data, such as workspace name, connected WhatsApp details, business profile details, settings, employees, permissions, and configuration choices.",
      "Messaging and CRM data, such as contacts, tags, attributes, conversation content, message status data, campaign recipients, template data, replies, assignments, and workflow activity when provided by the workspace.",
      "Support and communications data, such as Help Center tickets, feedback submissions, email correspondence, troubleshooting details, and communications with our team.",
      "Career application data, such as applicant name, WhatsApp number, email, organization, role details, compensation-related fields, notice period, preferred work mode, and resume files when submitted.",
      "Billing and subscription data, such as plan selection, invoices, renewal status, payment verification results, and transaction references received from payment partners.",
      "Technical and usage data, such as IP address, browser type, device information, request metadata, crash or error details, page path, timestamps, and security logs.",
    ],
  },
  {
    id: "use",
    title: "4. How We Use Information",
    icon: MessageSquareText,
    paragraphs: [
      `We use personal data to provide the platform, maintain security, process requests, manage subscriptions, respond to support issues, communicate with users, and improve service quality.`,
    ],
    bullets: [
      "To create and administer accounts, workspaces, permissions, and employee access.",
      "To deliver WhatsApp-related features such as contact tools, conversations, templates, campaigns, automation, reporting, and connected APIs.",
      "To process billing, renewals, invoices, payment confirmations, and fraud or abuse checks.",
      "To respond to support tickets, platform questions, feedback, and operational issues.",
      "To review and process career applications and related communications.",
      "To monitor performance, detect abuse, investigate incidents, enforce terms, and protect the platform, users, and recipients.",
      "To send important service communications, such as policy changes, security alerts, billing notices, and account-related operational messages.",
    ],
  },
  {
    id: "legal-basis",
    title: "5. Why Processing May Occur",
    icon: ScaleIcon,
    paragraphs: [
      `Depending on the context and applicable law, we may process personal data because it is necessary to provide requested services, perform a contract, pursue legitimate operational and security interests, comply with legal obligations, respond to your requests, or rely on consent where consent is required.`,
      `Workspace customers are separately responsible for determining their own lawful basis for uploading contacts, storing conversation data, or sending messages to recipients through the platform.`,
    ],
  },
  {
    id: "sharing",
    title: "6. How Information Is Shared",
    icon: Globe,
    paragraphs: [
      `We do not sell personal information in the ordinary meaning of selling customer data for money. We may disclose information to service providers, infrastructure partners, and integrated platforms where this is necessary to operate the service or comply with law.`,
    ],
    bullets: [
      "With Meta, WhatsApp, and related platform partners when you use WhatsApp Business Platform features, templates, messaging, verification, or connected integrations.",
      "With payment processors and financial service providers for subscription, wallet, invoice, renewal, and payment verification workflows.",
      "With hosting, storage, security, email, upload, and infrastructure vendors that help us operate the platform.",
      "With authorized workspace users, admins, employees, contractors, or agents who are permitted to access workspace data.",
      "With law enforcement, regulators, courts, or advisors where disclosure is legally required or reasonably necessary to protect rights, safety, systems, or legal compliance.",
      "As part of a merger, acquisition, financing, restructuring, or asset transfer, subject to appropriate confidentiality handling.",
    ],
  },
  {
    id: "whatsapp-business-data",
    title: "7. WhatsApp and Business Communication Data",
    icon: MessageSquareText,
    paragraphs: [
      `If a workspace uses ${BRAND_NAME} to communicate with customers over WhatsApp, the workspace may store or process conversation content, delivery events, template data, contact identifiers, and related metadata through the platform.`,
      `Businesses using ${BRAND_NAME} may also work with third-party providers, including Meta and WhatsApp infrastructure, to send, receive, store, route, or manage communications. Recipients should review the privacy policy of the business they are contacting if they want to understand how that business handles their information.`,
      `We do not control how each workspace customer collects consent, drafts customer notices, or uses recipient data. Those responsibilities remain with the business using the platform.`,
    ],
  },
  {
    id: "cookies",
    title: "8. Cookies, Local Storage, and Similar Technologies",
    icon: Cookie,
    paragraphs: [
      `${BRAND_NAME} uses browser storage and similar technologies to support login state, workspace state, interface preferences, session continuity, and security-related behavior. For example, the web app may store authentication tokens, workspace identifiers, and UI preferences in browser storage.`,
      `We may also use cookies or similar technologies for core website functionality, fraud prevention, diagnostics, and basic service measurement. If you disable certain storage or browser features, parts of the service may not function correctly.`,
    ],
  },
  {
    id: "retention",
    title: "9. Data Retention",
    icon: Database,
    paragraphs: [
      `We keep personal data only for as long as reasonably necessary for the purposes described in this policy, including account administration, service delivery, auditability, dispute handling, fraud prevention, legal compliance, and backup continuity.`,
      `Retention periods may vary depending on the type of data, the workspace configuration, legal requirements, system backups, support history, unresolved disputes, billing records, or security needs.`,
      `When we no longer need data, we may delete it, anonymize it, aggregate it, or retain it only where law or legitimate operational requirements require further storage.`,
    ],
  },
  {
    id: "security",
    title: "10. Security",
    icon: Lock,
    paragraphs: [
      `We use reasonable technical and organizational measures designed to protect information against unauthorized access, misuse, alteration, disclosure, or destruction. However, no method of transmission or storage can be guaranteed to be perfectly secure.`,
      `Workspace customers are also responsible for their own access controls, employee management, device security, password hygiene, consent records, and safe use of uploaded or synced customer data.`,
    ],
  },
  {
    id: "transfers",
    title: "11. International Transfers",
    icon: Globe,
    paragraphs: [
      `Our service providers, infrastructure, and integrated platforms may operate in multiple countries. As a result, personal data may be processed or stored in jurisdictions outside the country where it was originally collected, subject to applicable legal safeguards where required.`,
    ],
  },
  {
    id: "rights",
    title: "12. Your Rights and Choices",
    icon: ShieldCheck,
    paragraphs: [
      `Depending on where you live and the role in which data is processed, you may have rights such as access, correction, deletion, restriction, objection, portability, or withdrawal of consent where consent is the basis for processing.`,
      `If you are an end customer whose data was uploaded by a business using ${BRAND_NAME}, we may need to direct your request to that business because it usually controls the underlying customer relationship and messaging purpose.`,
    ],
    bullets: [
      "You may update some account information from within the platform.",
      "You may contact us for privacy-related requests using the support or contact details published on our website.",
      "You may opt out of non-essential promotional communications where applicable, while still receiving important service messages.",
    ],
  },
  {
    id: "children",
    title: "13. Children’s Privacy",
    icon: Users,
    paragraphs: [
      `${BRAND_NAME} is intended for business and professional use and is not designed for children. We do not knowingly build the service for use by minors in a business admin capacity. If we learn that information was collected inappropriately, we may take steps to remove it as required.`,
    ],
  },
  {
    id: "changes-contact",
    title: "14. Policy Updates and Contact",
    icon: Mail,
    paragraphs: [
      `We may update this Privacy Policy from time to time to reflect product changes, legal requirements, security updates, or operational improvements. The updated version becomes effective when published unless a different date is stated.`,
      `If you have questions about this Privacy Policy, you can contact us through the support or contact details made available on our website or Help Center.`,
    ],
  },
];

function ScaleIcon(props: React.ComponentProps<typeof ShieldCheck>) {
  return <ShieldCheck {...props} />;
}

function SectionCard({
  id,
  title,
  icon: Icon,
  paragraphs,
  bullets,
}: {
  id: string;
  title: string;
  icon: React.ComponentType<React.ComponentProps<typeof FileText>>;
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

export default function PrivacyPolicyPage() {
  return (
    <PublicShell>
      <Seo
        title={`Privacy Policy | ${BRAND_NAME}`}
        description={`${BRAND_NAME} Privacy Policy covering account data, messaging data, contacts, support, billing, cookies, and platform security.`}
        canonical={window.location.href}
      />

      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/70 to-cyan-50/60 p-6 shadow-[0_18px_60px_rgba(16,185,129,0.10)] sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">
            <Lock className="h-3.5 w-3.5" />
            Privacy Policy
          </div>

          <h1 className="mt-5 max-w-4xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            How {BRAND_NAME} collects, uses, stores, and protects data across our website and WhatsApp business platform.
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            This policy is written for the actual workflows inside {BRAND_NAME}, including account
            setup, workspace access, contacts, conversations, campaigns, templates, automations,
            support tickets, career applications, billing, and browser-based usage.
          </p>

          <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
            <span className="rounded-2xl border border-slate-200 bg-white px-4 py-2">
              Effective date: {effectiveDate}
            </span>
            <span className="rounded-2xl border border-slate-200 bg-white px-4 py-2">
              Business software privacy
            </span>
            <span className="rounded-2xl border border-slate-200 bg-white px-4 py-2">
              WhatsApp and Meta integrations apply
            </span>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-1">

          <div className="rounded-3xl border border-sky-200 bg-sky-50/90 p-6 shadow-sm">
            <h2 className="text-lg font-black text-sky-950">Privacy highlights</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-sky-900">
              <li className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                <span>Workspace customers are primarily responsible for recipient consent, messaging notices, and lawful customer-data use.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                <span>We process account, support, billing, and operational data to run the service.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                <span>WhatsApp and Meta integrations may separately process information when connected features are used.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                <span>Browser storage and similar technologies are used for login state, workspace continuity, and interface preferences.</span>
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
