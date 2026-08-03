import { useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Circle,
  Sparkles,
  Zap,
} from "lucide-react";
import { Card } from "@components/ui/Card";
import { cn } from "@shared/utils/cn";

type DashboardOnboardingStep = {
  id: string | number;
  label: string;
  href: string;
  done?: boolean;
  description?: string;
  icon?: ReactNode;
};

type DashboardOnboardingProps = {
  steps: DashboardOnboardingStep[];

  /**
   * Optional controlled state.
   * Is prop ko omit karoge to component default open rahega.
   */
  stepsExpanded?: boolean;

  /**
   * Controlled mode toggle handler.
   */
  onToggle?: () => void;

  /**
   * Uncontrolled mode initial state.
   * Default: true
   */
  defaultExpanded?: boolean;
};

export function DashboardOnboarding({
  steps,
  stepsExpanded,
  onToggle,
  defaultExpanded = true,
}: DashboardOnboardingProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

  const isControlled = typeof stepsExpanded === "boolean";
  const expanded = isControlled ? stepsExpanded : internalExpanded;

  const totalSteps = steps.length;

  const completedSteps = useMemo(
    () => steps.filter((step) => Boolean(step.done)).length,
    [steps],
  );

  const progressPercentage =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const allCompleted = totalSteps > 0 && completedSteps === totalSteps;

  const toggleExpanded = () => {
    if (isControlled) {
      onToggle?.();
      return;
    }

    setInternalExpanded((current) => !current);
  };

  return (
    <Card
      className={cn(
        "relative isolate overflow-hidden rounded-[2px]",
        "border border-slate-200/90 bg-white",
        "shadow-[0_18px_50px_-40px_rgba(15,23,42,0.55)]",
        "transition-all duration-300",
        expanded
          ? "shadow-[0_22px_60px_-42px_rgba(15,23,42,0.6)]"
          : "hover:border-slate-300",
      )}
    >
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute left-0 top-0 h-28 w-72 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.09),transparent_70%)]" />
        <div className="absolute right-0 top-0 size-40 rounded-full bg-emerald-100/30 blur-3xl" />
      </div>

      {/* Header */}
      <button
        type="button"
        onClick={toggleExpanded}
        aria-expanded={expanded}
        aria-controls="dashboard-onboarding-steps"
        className={cn(
          "group flex w-full items-center justify-between gap-4 p-4 text-left",
          "transition-colors duration-200",
          "hover:bg-slate-50/60 focus:outline-none",
          "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500",
          expanded && "border-b border-slate-100 sm:p-5",
        )}
      >
        <div className="flex min-w-0 items-center gap-3.5">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-[2px]",
              allCompleted
                ? "bg-emerald-500 text-white"
                : "bg-emerald-50 text-emerald-700",
            )}
          >
            {allCompleted ? (
              <CheckCircle2 size={20} />
            ) : (
              <Zap size={19} fill="currentColor" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-black tracking-tight text-slate-950 sm:text-base">
                Quick Setup Guide
              </h2>

              {allCompleted ? (
                <span className="inline-flex items-center gap-1 rounded-[2px] bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700">
                  <CheckCircle2 size={11} />
                  Completed
                </span>
              ) : (
                <span className="hidden items-center gap-1 rounded-[2px] bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500 sm:inline-flex">
                  <Sparkles size={11} />
                  Getting started
                </span>
              )}
            </div>

            <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
              <p className="whitespace-nowrap text-xs font-semibold text-slate-500">
                {completedSteps} of {totalSteps} completed
              </p>

              <div
                className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-slate-100 sm:block"
                role="progressbar"
                aria-label="Setup completion"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progressPercentage}
              >
                <div
                  className="h-full rounded-full bg-emerald-500 transition-[width] duration-700 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              <span className="text-[10px] font-black text-emerald-700">
                {progressPercentage}%
              </span>
            </div>
          </div>
        </div>

        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-[2px]",
            "border border-slate-200 bg-white text-slate-500 shadow-sm",
            "transition-all duration-300",
            "group-hover:border-slate-300 group-hover:text-slate-700",
          )}
        >
          <ChevronDown
            size={17}
            className={cn(
              "transition-transform duration-300",
              expanded && "rotate-180",
            )}
          />
        </span>
      </button>

      {/* Animated expandable content */}
      <div
        id="dashboard-onboarding-steps"
        aria-hidden={!expanded}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          expanded
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="p-4 sm:p-5">
            {totalSteps > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {steps.map((step, index) => (
                  <OnboardingStepCard
                    key={step.id}
                    step={step}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[2px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                <p className="text-sm font-bold text-slate-700">
                  No setup steps available
                </p>

                <p className="mt-1 text-xs font-medium text-slate-500">
                  Setup tasks will appear here when they are available.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function OnboardingStepCard({
  step,
  index,
}: {
  step: DashboardOnboardingStep;
  index: number;
}) {
  if (step.done) {
    return (
      <div
        className={cn(
          "relative flex min-h-[150px] min-w-0 flex-col justify-between",
          "rounded-[2px] border border-emerald-100 bg-emerald-50/45 p-4",
        )}
      >
        <StepCardContent step={step} index={index} />
      </div>
    );
  }

  return (
    <Link
      to={step.href}
      className={cn(
        "group relative flex min-h-[150px] min-w-0 flex-col justify-between",
        "rounded-[2px] border border-slate-200 bg-white p-4",
        "transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-emerald-300",
        "hover:shadow-[0_18px_42px_-30px_rgba(16,185,129,0.5)]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
        "active:translate-y-0",
      )}
    >
      <StepCardContent step={step} index={index} />

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
          Continue setup
        </span>

        <span className="flex size-8 items-center justify-center rounded-[2px] bg-emerald-50 text-emerald-700 transition-all duration-200 group-hover:bg-emerald-500 group-hover:text-white">
          <ArrowRight
            size={15}
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </Link>
  );
}

function StepCardContent({
  step,
  index,
}: {
  step: DashboardOnboardingStep;
  index: number;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-[2px]",
            step.done
              ? "bg-emerald-500 text-white"
              : "bg-slate-100 text-slate-500",
          )}
        >
          {step.done ? (
            <CheckCircle2 size={17} />
          ) : step.icon ? (
            step.icon
          ) : (
            <Circle size={16} />
          )}
        </div>

        <span
          className={cn(
            "text-[9px] font-black uppercase tracking-[0.17em]",
            step.done ? "text-emerald-600" : "text-slate-400",
          )}
        >
          Step {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <h3
        className={cn(
          "mt-4 text-sm font-black leading-5",
          step.done ? "text-slate-700" : "text-slate-900",
        )}
      >
        {step.label}
      </h3>

      {step.description ? (
        <p className="mt-1.5 text-xs font-medium leading-5 text-slate-500">
          {step.description}
        </p>
      ) : null}

      {step.done ? (
        <div className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
          <CheckCircle2 size={13} />
          Completed
        </div>
      ) : null}
    </div>
  );
}
