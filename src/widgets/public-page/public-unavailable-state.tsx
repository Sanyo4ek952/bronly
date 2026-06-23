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
    <section className="br-public-unavailable br-request-success br-card br-card--raised">
      <span className="br-request-success__eyebrow">Публичная страница</span>
      <h1>{title}</h1>
      <p>{description}</p>
      <div className="br-request-success__actions">
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
      <main className="br-auth-page br-auth-page--public">
        <div className="br-public-flow-shell">
          <div className="br-public-flow-shell__header">
            <PublicBrandSlot href={homeHref} />
          </div>
          {content}
        </div>
      </main>
    );
  }

  return (
    <main className="br-page">
      <div className="br-container">
        <div className="br-public-unavailable-shell">{content}</div>
      </div>
    </main>
  );
}
