import { DatabaseZap, ExternalLink, FileText, Mail, ShieldCheck, Trash2 } from "lucide-react";
import { PublicShell } from "@pages/public/PublicShell";
import { Seo } from "@shared/components/Seo";
import { BRAND_NAME } from "@shared/config/brand";

const sections = [
  {
    id: "overview",
    title: "1. Overview",
    icon: FileText,
    paragraphs: [
      `${BRAND_NAME} supports deletion requests for personal data that we control directly, subject to identity verification, legal obligations, security needs, billing recordkeeping, and backup or dispute-handling requirements.`,
      `This page explains how account owners, workspace users, applicants, support requestors, and end customers can request deletion or removal of data related to our platform.`,
    ],
  },
  {
    id: "who-should-contact-whom",
    title: "2. Who Should Contact Whom",
    icon: ShieldCheck,
    paragraphs: [
      `If you are an account owner, workspace admin, employee, support requestor, or job applicant interacting directly with ${BRAND_NAME}, you may contact us for deletion requests related to the data we control for our own operations.`,
      `If you are an end customer whose phone number, messages, or contact information was uploaded or used by a business that uses ${BRAND_NAME}, you should first contact that business directly. In most cases, that business is the primary controller of its customer relationship and messaging data.`,
    ],
  },
  {
    id: "what-can-be-requested",
    title: "3. What You Can Request",
    icon: Trash2,
    paragraphs: [
      `Depending on your relationship with the platform and applicable law, you may request deletion or removal of data such as account profile details, support ticket information, job application records, or other directly submitted information.`,
      `Workspace customers may also request deletion of their own workspace content or ask for workspace closure, subject to verification and any outstanding legal, security, or billing obligations.`,
    ],
    bullets: [
      "Account and profile data submitted directly to the platform.",
      "Support ticket submissions and related communications where retention is no longer required.",
      "Career application records and uploaded resume files where retention is no longer required.",
      "Workspace-level deletion or closure requests from authorized workspace owners or admins.",
    ],
  },
  {
    id: "how-to-request",
    title: "4. How to Submit a Deletion Request",
    icon: Mail,
    paragraphs: [
      `Please submit your deletion request through our Help Center or business support contact details listed on the website. Include enough information for us to identify the account, workspace, or record involved.`,
      `To protect security and prevent unauthorized deletion, we may request verification details before processing the request.`,
    ],
    bullets: [
      "Your full name and the email address or phone number associated with the request.",
      "The workspace name or business name, if applicable.",
      "A clear description of the data you want deleted.",
      "Any relevant identifiers, such as ticket number or application email, if available.",
    ],
  },
  {
    id: "limits",
    title: "5. Important Limitations",
    icon: DatabaseZap,
    paragraphs: [
      `We may not be able to delete certain records immediately or completely if retention is required for security, fraud prevention, tax compliance, payment records, dispute resolution, legal obligations, or system integrity.`,
      `Some information may also remain temporarily in protected backups or logs until normal deletion cycles complete.`,
      `If data was shared with or processed through third-party systems such as Meta, WhatsApp, payment providers, or cloud providers, those parties may apply their own retention and deletion rules.`,
    ],
  },
  {
    id: "meta-note",
    title: "6. Meta and WhatsApp-Related Data",
    icon: ExternalLink,
    paragraphs: [
      `If your information was processed as part of WhatsApp business messaging, template delivery, embedded business setup, or Meta-connected services, the relevant business using ${BRAND_NAME} may need to coordinate with Meta, WhatsApp, or its own systems to complete the request fully.`,
      `Deletion from ${BRAND_NAME} does not automatically mean deletion from every third-party platform involved in a business messaging workflow.`,
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

export default function DataDeletionPage() {
  return (
    <PublicShell>
      <Seo
        title={`Data Deletion | ${BRAND_NAME}`}
        description={`${BRAND_NAME} data deletion instructions for account holders, workspace users, applicants, support requestors, and end customers.`}
        canonical={window.location.href}
      />

      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/70 to-cyan-50/60 p-6 shadow-[0_18px_60px_rgba(16,185,129,0.10)] sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">
            <Trash2 className="h-3.5 w-3.5" />
            Data Deletion
          </div>

          <h1 className="mt-5 max-w-4xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            How to request deletion of personal data connected to {BRAND_NAME}.
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            This page explains who should contact us directly, who should contact the business using
            our platform, what information may be deleted, and what limits may apply.
          </p>
        </section>

        <section className="rounded-3xl border border-amber-200 bg-amber-50/90 p-6 shadow-sm">
          <h2 className="text-lg font-black text-amber-950">Quick direction</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-amber-900">
            <li className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
              <span>If you are a platform account holder or applicant, contact {BRAND_NAME} support.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
              <span>If you are a customer of a business using the platform, contact that business first.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
              <span>Deletion may be limited by legal retention, payment records, security logs, and backup cycles.</span>
            </li>
          </ul>
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
