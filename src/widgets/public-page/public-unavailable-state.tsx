import { ButtonLink } from "@/shared/ui";
import { PublicBrandSlot } from "@/widgets/public-page";

type PublicUnavailableStateProps = {
  title: string;
  description: string;
  homeHref?: string;
  homeLabel?: string;
  showLogin?: boolean;
  loginHref?: string;
  loginLabel?: string;
  inAuthLayout?: boolean;
};

export function PublicUnavailableState({
  title,
  description,
  homeHref = "/",
  homeLabel = "На главную",
  showLogin = false,
  loginHref = "/login",
  loginLabel = "Войти в кабинет",
  inAuthLayout = false,
}: PublicUnavailableStateProps) {
  const content = (
    <section className="grid w-full max-w-[720px] gap-4 rounded-[var(--radius-lg)] border border-[rgb(var(--color-primary-rgb)_/_0.10)] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.99),rgb(248_250_250_/_0.97))] p-6 text-center shadow-[var(--shadow-md)] max-[720px]:p-[18px]">
      <span className="mx-auto inline-flex min-h-8 items-center rounded-full bg-[rgb(var(--color-primary-rgb)_/_0.10)] px-3 text-xs font-bold text-[var(--color-primary-hover)]">Публичная страница</span>
      <h1 className="text-[clamp(1.875rem,4vw,2.625rem)] font-extrabold leading-[1.06]">{title}</h1>
      <p className="text-sm leading-relaxed text-[var(--color-muted)]">{description}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {showLogin ? (
          <ButtonLink href={loginHref} fullWidth>
            {loginLabel}
          </ButtonLink>
        ) : null}
        <ButtonLink href={homeHref} variant={showLogin ? "secondary" : "primary"} fullWidth>
          {homeLabel}
        </ButtonLink>
      </div>
    </section>
  );

  if (inAuthLayout) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--color-page)] px-[calc(16px+var(--safe-area-right))] py-[calc(28px+var(--safe-area-top))] pb-[calc(32px+var(--safe-area-bottom))]">
        <div className="grid w-full max-w-[720px] gap-4">
          <div className="flex items-center justify-between gap-[14px]">
            <PublicBrandSlot href={homeHref} />
          </div>
          {content}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-page)] pb-[var(--safe-area-bottom)]">
      <div className="mx-auto w-[calc(100%-40px)] max-w-[1440px]">
        <div className="mx-auto grid w-full max-w-[720px] gap-4 py-10">{content}</div>
      </div>
    </main>
  );
}
