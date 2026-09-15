"use client";

import { Check, ChevronDown, ChevronUp, HousePlus, ListChecks, Plus, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { OwnerDashboardSummary } from "@/entities/property";
import { cn } from "@/shared/lib/cn";
import { AppIcon, ButtonLink, Panel } from "@/shared/ui";

const emptyStateIcons = {
  "house-plus": HousePlus,
  plus: Plus,
} as const;

type EmptyState = {
  id: "no-properties" | "no-rooms";
  iconId: keyof typeof emptyStateIcons;
  title: string;
  text: string;
  action: string;
  href: string;
  secondaryAction?: string;
  secondaryHref?: string;
};

type OwnerDashboardOnboardingProps = {
  onboarding: OwnerDashboardSummary["onboarding"];
  emptyStates: EmptyState[];
};

function getDefaultExpandedStepId(onboarding: OwnerDashboardSummary["onboarding"]) {
  return onboarding.steps.find((step) => step.state === "current")?.id ?? onboarding.steps[0]?.id ?? null;
}

export function OwnerDashboardOnboarding({ onboarding, emptyStates }: OwnerDashboardOnboardingProps) {
  const dialogId = useId();
  const launcherRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const defaultExpandedStepId = useMemo(() => getDefaultExpandedStepId(onboarding), [onboarding]);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(defaultExpandedStepId);

  const completedStepsCount = useMemo(
    () => onboarding.steps.filter((step) => step.state === "done").length,
    [onboarding.steps],
  );
  const isCompleted = completedStepsCount === onboarding.steps.length;

  useEffect(() => {
    if (!isOpen) {
      if (wasOpenRef.current) {
        launcherRef.current?.focus();
      }
      wasOpenRef.current = false;
      return undefined;
    }

    wasOpenRef.current = true;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const toggleStep = (stepId: string) => {
    setExpandedStepId((current) => (current === stepId ? null : stepId));
  };

  return (
    <>
      {emptyStates.length ? (
        <section className="grid gap-4 md:grid-cols-2">
          {emptyStates.map((state) => {
            const Icon = emptyStateIcons[state.iconId];

            return (
              <Panel key={state.id} as="article" className="grid justify-items-start gap-3.5 border-0 p-5 sm:p-6" surface="subtle">
                <div className="grid size-14 place-items-center rounded-[18px] bg-[rgb(var(--color-primary-rgb)_/_0.10)] text-[var(--color-primary-hover)]" aria-hidden="true">
                  <AppIcon icon={Icon} />
                </div>
                <strong className="text-lg text-[var(--text)]">{state.title}</strong>
                <p className="text-sm leading-[1.55] text-[var(--text-muted)]">{state.text}</p>
                <div className="grid w-full gap-2 sm:grid-cols-2">
                  <ButtonLink href={state.href} fullWidth>{state.action}</ButtonLink>
                  {state.secondaryAction && state.secondaryHref ? <ButtonLink href={state.secondaryHref} variant="secondary" fullWidth>{state.secondaryAction}</ButtonLink> : null}
                </div>
              </Panel>
            );
          })}
        </section>
      ) : null}

      <button
        ref={launcherRef}
        type="button"
        className="fixed bottom-[calc(82px+var(--safe-area-bottom))] right-4 z-30 grid size-12 place-items-center rounded-full border border-[rgb(var(--color-primary-rgb)_/_0.24)] bg-[var(--accent)] text-white shadow-[var(--shadow-lg)] transition-transform duration-[180ms] hover:-translate-y-1 focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgb(var(--color-primary-rgb)_/_0.18)] min-[721px]:bottom-6 min-[721px]:right-6"
        aria-label="Чеклист запуска"
        aria-expanded={isOpen}
        aria-controls={dialogId}
        onClick={() => {
          setExpandedStepId(defaultExpandedStepId);
          setIsOpen(true);
        }}
      >
        <AppIcon icon={ListChecks} aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-40 grid items-end bg-[rgb(15_23_42_/_0.28)] p-3 backdrop-blur-sm min-[721px]:items-end min-[721px]:justify-items-end min-[721px]:p-6" role="presentation" onClick={() => setIsOpen(false)}>
          <section
            id={dialogId}
            className="grid max-h-[min(82vh,680px)] w-full max-w-[430px] gap-4 overflow-y-auto rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-lg)] max-[420px]:rounded-t-[24px] min-[721px]:p-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${dialogId}-title`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto h-1.5 w-12 rounded-full bg-[rgb(17_29_27_/_0.14)] min-[721px]:hidden" aria-hidden="true" />

            <div className="flex items-start justify-between gap-4">
              <div className="grid gap-1.5">
                <h2 id={`${dialogId}-title`} className="text-xl font-bold leading-[1.1] text-[var(--text)]">Онбординг владельца</h2>
                <p className="text-sm text-[var(--text-muted)]">{completedStepsCount} / {onboarding.steps.length} завершено</p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className="inline-grid size-10 shrink-0 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow-sm)] transition-[background-color,border-color,color,transform,box-shadow] duration-[180ms] hover:-translate-y-px hover:border-[rgb(var(--color-primary-rgb)_/_0.24)] hover:bg-[var(--color-primary-pale)] focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_rgb(var(--color-primary-rgb)_/_0.12)]"
                aria-label="Закрыть чеклист запуска"
                onClick={() => setIsOpen(false)}
              >
                <AppIcon icon={X} aria-hidden="true" />
              </button>
            </div>

            <div>
              <span className="inline-flex min-h-8 items-center rounded-full bg-[var(--color-primary-pale)] px-3 text-xs font-bold text-[var(--color-primary-hover)]">{onboarding.activeStepLabel}</span>
            </div>

            <div className="grid gap-2.5">
              {onboarding.steps.map((step, index) => {
                const isExpanded = expandedStepId === step.id;

                return (
                  <article
                    key={step.id}
                    className={cn(
                      "overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--surface-subtle)]",
                      step.state === "current" && "border-[rgb(var(--color-primary-rgb)_/_0.30)] bg-[var(--color-primary-pale)]",
                      step.state === "done" && "border-[rgb(15_159_117_/_0.18)] bg-[var(--color-success-soft)]",
                      isExpanded && "shadow-[var(--shadow-sm)]",
                    )}
                  >
                    <button
                      type="button"
                      className="flex min-h-[62px] w-full items-center justify-between gap-3 bg-transparent px-3.5 py-3 text-left text-[var(--text)]"
                      aria-expanded={isExpanded}
                      onClick={() => toggleStep(step.id)}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className={cn("grid size-8 shrink-0 place-items-center rounded-full border border-[var(--border)] bg-white text-xs font-bold", step.state === "current" && "border-[var(--accent)] text-[var(--accent-strong)]", step.state === "done" && "border-[rgb(15_159_117_/_0.20)] bg-[var(--color-success-soft)] text-[var(--color-success-ink)]")} aria-hidden="true">
                          {step.state === "done" ? <AppIcon icon={Check} /> : <span>{index + 1}</span>}
                        </span>
                        <span className="grid min-w-0 gap-1">
                          <strong className="text-sm leading-[1.25]">{step.title}</strong>
                          <span className="text-xs text-[var(--text-muted)]">{step.status}</span>
                        </span>
                      </span>
                      <AppIcon icon={isExpanded ? ChevronUp : ChevronDown} aria-hidden="true" />
                    </button>

                    {isExpanded ? (
                      <div className="grid gap-3 border-t border-[var(--border)] px-3.5 py-3">
                        <p className="text-sm leading-[1.5] text-[var(--text-muted)]">{step.text}</p>
                        <ButtonLink href={step.href} variant="secondary" fullWidth size="sm">{step.ctaLabel}</ButtonLink>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>

            <div className="grid gap-2.5 border-t border-[var(--border)] pt-4">
              <button
                type="button"
                className="inline-flex w-fit items-center gap-2 text-sm font-bold text-[var(--color-primary-hover)] underline-offset-4 hover:underline"
                onClick={() => setExpandedStepId(defaultExpandedStepId)}
              >
                <AppIcon icon={RotateCcw} aria-hidden="true" />
                <span>Показать активный шаг</span>
              </button>
              <p className="text-xs leading-[1.5] text-[var(--text-muted)]">{isCompleted ? "Витрина готова: можно принимать заявки." : "Продолжайте шаги, чтобы подготовить витрину к новым заявкам."}</p>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
