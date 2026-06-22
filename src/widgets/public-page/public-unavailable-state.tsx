import { ButtonLink } from "@/shared/ui";

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
    <section className="br-request-success br-card" style={inAuthLayout ? undefined : { margin: "48px auto" }}>
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
    return <main className="br-auth-page">{content}</main>;
  }

  return (
    <main className="br-page">
      <div className="br-container">{content}</div>
    </main>
  );
}
