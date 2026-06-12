"use client";

import { Check, ChevronDown, ChevronUp, HousePlus, ListChecks, Plus, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { OwnerDashboardSummary } from "@/entities/property";
import { AppIcon } from "@/shared/ui";

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
        <section className="br-dashboard-inline-empty">
          {emptyStates.map((state) => {
            const Icon = emptyStateIcons[state.iconId];

            return (
              <article key={state.id} className="br-empty-card br-card">
                <div className="br-empty-card__art" aria-hidden="true">
                  <AppIcon icon={Icon} />
                </div>
                <strong>{state.title}</strong>
                <p>{state.text}</p>
                <Link href={state.href} className="br-button br-button--primary br-button--full">
                  {state.action}
                </Link>
              </article>
            );
          })}
        </section>
      ) : null}

      <button
        ref={launcherRef}
        type="button"
        className="br-floating-onboarding-launcher"
        aria-expanded={isOpen}
        aria-controls={dialogId}
        onClick={() => {
          setExpandedStepId(defaultExpandedStepId);
          setIsOpen(true);
        }}
      >
        <AppIcon icon={ListChecks} aria-hidden="true" />
        <span>Чеклист запуска</span>
      </button>

      {isOpen ? (
        <div className="br-floating-onboarding-backdrop" role="presentation" onClick={() => setIsOpen(false)}>
          <section
            id={dialogId}
            className="br-floating-onboarding br-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${dialogId}-title`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="br-floating-onboarding__handle" aria-hidden="true" />

            <div className="br-floating-onboarding__header">
              <div>
                <h2 id={`${dialogId}-title`}>Онбординг владельца</h2>
                <p>{completedStepsCount} / {onboarding.steps.length} завершено</p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className="br-icon-button br-floating-onboarding__close"
                aria-label="Закрыть чеклист запуска"
                onClick={() => setIsOpen(false)}
              >
                <AppIcon icon={X} aria-hidden="true" />
              </button>
            </div>

            <div className="br-floating-onboarding__progress">
              <span className="br-stepper-chip">{onboarding.activeStepLabel}</span>
            </div>

            <div className="br-floating-onboarding__list">
              {onboarding.steps.map((step, index) => {
                const isExpanded = expandedStepId === step.id;

                return (
                  <article
                    key={step.id}
                    className={`br-floating-onboarding-step br-floating-onboarding-step--${step.state}${
                      isExpanded ? " br-floating-onboarding-step--expanded" : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="br-floating-onboarding-step__trigger"
                      aria-expanded={isExpanded}
                      onClick={() => toggleStep(step.id)}
                    >
                      <span className="br-floating-onboarding-step__summary">
                        <span className="br-floating-onboarding-step__icon" aria-hidden="true">
                          {step.state === "done" ? <AppIcon icon={Check} /> : <span>{index + 1}</span>}
                        </span>
                        <span className="br-floating-onboarding-step__copy">
                          <strong>{step.title}</strong>
                          <span>{step.status}</span>
                        </span>
                      </span>
                      <AppIcon icon={isExpanded ? ChevronUp : ChevronDown} aria-hidden="true" />
                    </button>

                    {isExpanded ? (
                      <div className="br-floating-onboarding-step__body">
                        <p>{step.text}</p>
                        <Link href={step.href} className="br-button br-button--secondary br-button--full br-button--sm">
                          {step.ctaLabel}
                        </Link>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>

            <div className="br-floating-onboarding__footer">
              <button
                type="button"
                className="br-floating-onboarding__reset"
                onClick={() => setExpandedStepId(defaultExpandedStepId)}
              >
                <AppIcon icon={RotateCcw} aria-hidden="true" />
                <span>Показать активный шаг</span>
              </button>
              <p>{isCompleted ? "Витрина готова: можно принимать заявки." : "Продолжайте шаги, чтобы подготовить витрину к новым заявкам."}</p>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
