import { useEffect, useMemo, useState } from "react";
import { API } from "@api/api";
import { PublicShell } from "@pages/public/PublicShell";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import { Button } from "@components/ui/Button";
import { Alert } from "@components/ui/Alert";
import { useToast } from "@shared/providers/ToastContext";

export default function CareersPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState<any>(null);
  const [uploadPct, setUploadPct] = useState(0);

  const [resume, setResume] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [email, setEmail] = useState("");
  const [organisationName, setOrganisationName] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [applyingRole, setApplyingRole] = useState("");
  const [department, setDepartment] = useState("");
  const [yearsExpIndustry, setYearsExpIndustry] = useState("");
  const [yearsCurrentJob, setYearsCurrentJob] = useState("");
  const [currentSalary, setCurrentSalary] = useState("");
  const [expectedSalary, setExpectedSalary] = useState("");
  const [noticePeriod, setNoticePeriod] = useState("");
  const [modeOfWork, setModeOfWork] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    API.public
      .page("careers")
      .then((r: any) => {
        if (!mounted) return;
        setPage(r.page);
      })
      .catch((e: any) => {
        if (!mounted) return;
        setError(e?.userMessage || e?.response?.data?.message || e?.message || "Failed to load careers page.");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const departments = Array.isArray(page?.data?.departments) ? page.data.departments : [];
  const noticePeriods = Array.isArray(page?.data?.noticePeriods) ? page.data.noticePeriods : [];
  const modesOfWork = Array.isArray(page?.data?.modesOfWork) ? page.data.modesOfWork : [];

  const canSubmit = useMemo(() => {
    return (
      !!resume &&
      name.trim().length >= 2 &&
      whatsappPhone.trim().length >= 6 &&
      email.trim().length >= 5 &&
      organisationName.trim().length >= 2 &&
      currentRole.trim().length >= 2 &&
      applyingRole.trim().length >= 2 &&
      department.trim().length >= 1 &&
      yearsExpIndustry.trim() !== "" &&
      yearsCurrentJob.trim() !== "" &&
      currentSalary.trim().length >= 1 &&
      expectedSalary.trim().length >= 1 &&
      noticePeriod.trim().length >= 1 &&
      modeOfWork.trim().length >= 1
    );
  }, [
    resume,
    name,
    whatsappPhone,
    email,
    organisationName,
    currentRole,
    applyingRole,
    department,
    yearsExpIndustry,
    yearsCurrentJob,
    currentSalary,
    expectedSalary,
    noticePeriod,
    modeOfWork,
  ]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting || !resume) return;
    setSubmitting(true);
    setError("");
    setUploadPct(0);
    try {
      await API.public.applyCareer(
        {
          name,
          whatsappPhone,
          email,
          organisationName,
          currentRole,
          applyingRole,
          department,
          yearsExpIndustry,
          yearsCurrentJob,
          currentSalary,
          expectedSalary,
          noticePeriod,
          modeOfWork,
        },
        resume,
        (pct: number) => setUploadPct(pct)
      );
      toast("Application submitted successfully.", "success");
      setResume(null);
      setName("");
      setWhatsappPhone("");
      setEmail("");
      setOrganisationName("");
      setCurrentRole("");
      setApplyingRole("");
      setDepartment("");
      setYearsExpIndustry("");
      setYearsCurrentJob("");
      setCurrentSalary("");
      setExpectedSalary("");
      setNoticePeriod("");
      setModeOfWork("");
      setUploadPct(0);
    } catch (err: any) {
      setError(err?.userMessage || err?.response?.data?.message || err?.message || "Failed to submit application.");
      toast("Failed to submit application.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PublicShell>
      {error ? <Alert>{error}</Alert> : null}
      <div className="mx-25 p-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">{page?.data?.hero?.title || "Apply at AiWizChat"}</h1>
        {page?.data?.introMarkdown ? (
          <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-ink-900/60">{page.data.introMarkdown}</p>
        ) : null}

        {loading ? (
          <div className="mt-6 text-sm font-semibold text-ink-900/60">Loading…</div>
        ) : (
          <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-4">
            <Input label="Name*" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />

            <label className="block">
              <div className="mb-1 text-xs font-semibold text-ink-800/80">Upload your resume*</div>
              <div className="flex items-center justify-between gap-3 rounded-[5px] bg-white px-3 py-2.5 text-sm text-ink-900 ring-1 ring-ink-900/12">
                <span className="min-w-0 truncate text-ink-900/70">{resume ? resume.name : "No file chosen"}</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => setResume(e.target.files?.[0] || null)}
                  className="text-xs"
                  required
                />
              </div>
              <div className="mt-1 text-[11px] font-semibold text-ink-900/45">PDF, DOC, or DOCX</div>
            </label>

            <Input
              label="Your WhatsApp Phone Number*"
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
              placeholder="Your WhatsApp Phone Number"
              required
              type="number"
            />
            <Input label="Your Email Id*" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your Email Id" required />
            <Input
              label="Your Current / Past Organisation Name*"
              value={organisationName}
              onChange={(e) => setOrganisationName(e.target.value)}
              placeholder="Your Current / Past Organisation Name"
              required
              type="email"
            />
            <Input label="Your Current Role*" value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} placeholder="Your Current Role" required />
            <Input
              label="Role You are applying for*"
              value={applyingRole}
              onChange={(e) => setApplyingRole(e.target.value)}
              placeholder="Role You are applying for"
              required
            />

            <Select label="Department*" value={department} onChange={(e) => setDepartment(e.target.value)} required>
              <option value="">{departments.length ? "Select department" : "Enter in Admin → Pages → careers"}</option>
              {departments.map((d: string) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>

            <Input
              label="Years of Experience in the industry*"
              value={yearsExpIndustry}
              onChange={(e) => setYearsExpIndustry(e.target.value)}
              placeholder="Years of Experience in the industry"
              inputMode="numeric"
              required
              type="number"
            />
            <Input
              label="Years in your current / latest job (Current job tenure)*"
              value={yearsCurrentJob}
              onChange={(e) => setYearsCurrentJob(e.target.value)}
              placeholder="Years in your current / latest job"
              inputMode="numeric"
              required
              type="number"
            />
            <Input label="Your Current Salary*" value={currentSalary} onChange={(e) => setCurrentSalary(e.target.value)} placeholder="Your Current Salary" required type="number" />
            <Input
              label="Your Expected Salary*"
              value={expectedSalary}
              onChange={(e) => setExpectedSalary(e.target.value)}
              placeholder="Your Expected Salary"
              required
              type="number"
            />

            <Select label="Your Notice Period*" value={noticePeriod} onChange={(e) => setNoticePeriod(e.target.value)} required>
              <option value="">{noticePeriods.length ? "Select Your Notice Period" : "Configure in Admin → Pages → careers"}</option>
              {noticePeriods.map((n: string) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>

            <Select label="Your current mode of work*" value={modeOfWork} onChange={(e) => setModeOfWork(e.target.value)} required>
              <option value="">{modesOfWork.length ? "Select Your current mode of work" : "Configure in Admin → Pages → careers"}</option>
              {modesOfWork.map((m: string) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>

            <div className="md:col-span-2 flex items-center justify-between gap-3">
              <div className="text-xs font-semibold text-ink-900/50">{submitting && uploadPct ? `Uploading… ${uploadPct}%` : " "}</div>
              <Button disabled={!canSubmit || submitting} className="h-11 rounded-2xl px-6 font-bold">
                {submitting ? "Submitting…" : "Submit"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </PublicShell>
  );
}
