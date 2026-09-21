"use client";

import { useId, useRef, useState, type ReactNode, type FormEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFormStatus } from "react-dom";

import { cn } from "@/shared/lib/cn";
import { AppIcon, Button, ButtonLink, Panel, SubmitButton } from "@/shared/ui";

type Step = { title: string; description: string; content: ReactNode };

function StepNavigation({ steps, current, onChange, id }: {
  steps: Step[]; current: number; onChange: (step: number) => void; id: string;
}) {
  const { pending } = useFormStatus();
  return (
    <nav aria-label="Этапы заполнения" className="min-w-0 md:sticky md:top-5 md:self-start">
      <div className="grid gap-2">
        <p className="px-3 pt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">Добавление жилья</p>
        <ol className="m-0 flex list-none gap-1 overflow-x-auto p-0 md:grid">
          {steps.map((step, index) => (
            <li key={step.title} className="shrink-0 md:shrink">
              <button type="button" disabled={pending} onClick={() => onChange(index)} aria-current={current === index ? "step" : undefined}
                aria-controls={`${id}-${index}`}
                className={cn("flex min-h-12 w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-3 text-left text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)]", current === index ? "bg-[var(--color-primary-pale)] text-[var(--accent-strong)]" : "text-[var(--text-muted)] hover:bg-[var(--surface-muted)]")}>
                <span className={cn("grid size-7 shrink-0 place-items-center rounded-full border text-xs", current === index ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--border)]")} aria-hidden="true">{index + 1}</span>
                {step.title}
              </button>
            </li>
          ))}
        </ol>
      </div>
      <p className="hidden px-4 pt-4 text-xs leading-relaxed text-[var(--text-muted)] md:block">Заполняйте по порядку. К предыдущим этапам можно вернуться.</p>
    </nav>
  );
}

export function PropertySetupFlow({ steps, initialStep = 0 }: { steps: Step[]; initialStep?: number }) {
  const [current, setCurrent] = useState(initialStep);
  const [previousSteps, setPreviousSteps] = useState(steps);
  const id = useId();
  // A repeated server action can redirect to the same URL. New server content
  // must still select the result step, even when the success query is unchanged.
  if (steps !== previousSteps) {
    setPreviousSteps(steps);
    setCurrent(initialStep);
  }
  return (
    <div className="grid min-w-0 gap-5 md:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)]">
      <StepNavigation steps={steps} current={current} onChange={setCurrent} id={id} />
      <div className="min-w-0">
        {steps.map((step, index) => (
          <section key={step.title} id={`${id}-${index}`} hidden={current !== index} aria-label={step.title}>
            <div className="grid gap-5">
              <header className="grid gap-1.5">
                <p className="text-xs font-semibold text-[var(--accent-strong)]">Этап {index + 1} из {steps.length}</p>
                <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">{step.title}</h2>
                <p className="text-sm leading-relaxed text-[var(--text-muted)]">{step.description}</p>
              </header>
              {step.content}
              {index === 1 ? <Button onClick={() => setCurrent(index + 1)} className="justify-self-end">Перейти к номерам <AppIcon icon={ChevronRight} className="ml-2 size-4" /></Button> : null}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function WizardFooter({ current, count, back, next, cancelHref, submitLabel, disabled }: {
  current: number; count: number; back: () => void; next: () => void; cancelHref: string; submitLabel: string; disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <footer className="mt-6 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
      {current ? <Button variant="secondary" onClick={back} disabled={pending}><AppIcon icon={ChevronLeft} className="mr-1 size-4" />Назад</Button> : <ButtonLink href={cancelHref} variant="secondary">Отмена</ButtonLink>}
      {current === count - 1 ? <SubmitButton disabled={disabled} pendingLabel="Создаём…">{submitLabel}</SubmitButton> : <Button onClick={next} disabled={pending}>Продолжить<AppIcon icon={ChevronRight} className="ml-2 size-4" /></Button>}
    </footer>
  );
}

export function CreationWizard({ steps, action, hiddenFields, cancelHref, submitLabel, disabled }: {
  steps: Step[]; action: (data: FormData) => Promise<void>; hiddenFields?: ReactNode; cancelHref: string; submitLabel: string; disabled?: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const id = useId();

  function showStep(index: number) {
    setCurrent(index);
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  function validateStep(index: number) {
    const section = formRef.current?.querySelector(`[data-step="${index}"]`);
    const fields = section?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea");
    for (const field of fields ?? []) {
      if (!field.checkValidity()) {
        showStep(index);
        requestAnimationFrame(() => field.reportValidity());
        return false;
      }
    }
    return true;
  }

  function navigate(index: number) {
    if (index > current) {
      for (let step = 0; step < index; step++) if (!validateStep(step)) return;
    }
    showStep(index);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    if (current < steps.length - 1) {
      event.preventDefault();
      navigate(current + 1);
      return;
    }
    for (let step = 0; step < steps.length; step++) {
      if (!validateStep(step)) { event.preventDefault(); return; }
    }
    if (disabled) event.preventDefault();
  }

  return (
    <form ref={formRef} action={action} onSubmit={submit} noValidate className="grid min-w-0 gap-5 md:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)]">
      {hiddenFields}
      <StepNavigation steps={steps} current={current} onChange={navigate} id={id} />
      <Panel padding="md" className="min-w-0 max-[720px]:p-4">
        <header className="mb-6 grid gap-2">
          <p className="text-xs font-semibold text-[var(--accent-strong)]" aria-live="polite">Шаг {current + 1} из {steps.length}</p>
          <div className="flex gap-1.5" aria-hidden="true">{steps.map((step, index) => <span key={step.title} className={cn("h-1 flex-1 rounded-full", index <= current ? "bg-[var(--accent)]" : "bg-[var(--border)]")} />)}</div>
          <h2 ref={headingRef} tabIndex={-1} className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text)] outline-none">{steps[current].title}</h2>
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">{steps[current].description}</p>
        </header>
        {steps.map((step, index) => <div key={step.title} id={`${id}-${index}`} data-step={index} hidden={current !== index}>{step.content}</div>)}
        <WizardFooter current={current} count={steps.length} back={() => navigate(current - 1)} next={() => navigate(current + 1)} cancelHref={cancelHref} submitLabel={submitLabel} disabled={disabled} />
      </Panel>
    </form>
  );
}
