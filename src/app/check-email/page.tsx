import Link from "next/link";

import { resendConfirmationEmailAction } from "@/app/auth/actions";
import { getAuthUserEmailStatus } from "@/shared/api/supabase";
import { BrandLogo } from "@/shared/ui";

type CheckEmailPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function buildLoginHref(email: string, invite: string) {
  const params = new URLSearchParams({
    info: "already-confirmed",
    email,
  });

  if (invite) {
    params.set("invite", invite);
    params.set("next", `/invite/${invite}`);
  }

  return `/login?${params.toString()}`;
}

export default async function CheckEmailPage({ searchParams }: CheckEmailPageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const email = typeof params.email === "string" ? params.email : "";
  const role = typeof params.role === "string" ? params.role : "owner";
  const invite = typeof params.invite === "string" ? params.invite : "";
  const error = typeof params.error === "string" ? params.error : "";
  const success = typeof params.success === "string" ? params.success : "";
  const roleLabel = role === "agent" ? "Р°РіРµРЅС‚Р°" : "РІР»Р°РґРµР»СЊС†Р°";
  const emailStatus = email ? await getAuthUserEmailStatus(email) : "not_found";

  if (emailStatus === "confirmed") {
    const loginHref = buildLoginHref(email, invite);

    return (
      <main className="br-auth-page">
        <section className="br-auth-shell br-card">
          <BrandLogo className="br-auth-shell__logo" />
          <div className="br-auth-shell__grid">
            <div className="br-auth-shell__intro">
              <span className="br-chip">email СѓР¶Рµ РїРѕРґС‚РІРµСЂР¶РґРµРЅ</span>
              <h1 className="br-auth-shell__title">РњРѕР¶РЅРѕ РІРѕР№С‚Рё</h1>
              <p className="br-auth-shell__text">
                РђРєРєР°СѓРЅС‚ {email} СѓР¶Рµ Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°РЅ Рё РїРѕРґС‚РІРµСЂР¶РґРµРЅ РІ Supabase. РќРѕРІРѕРµ РїРёСЃСЊРјРѕ РґР»СЏ СЌС‚РѕРіРѕ email РЅРµ
                РѕС‚РїСЂР°РІР»СЏРµС‚СЃСЏ вЂ” РІРѕР№РґРёС‚Рµ СЃ РїР°СЂРѕР»РµРј РёР»Рё РІРѕСЃСЃС‚Р°РЅРѕРІРёС‚Рµ РґРѕСЃС‚СѓРї.
              </p>
            </div>

            <div className="br-auth-panel">
              <div className="br-auth-form">
                <Link href={loginHref} className="br-button br-button--primary br-button--full">
                  Р’РѕР№С‚Рё РІ Р°РєРєР°СѓРЅС‚
                </Link>
                <Link href="/forgot-password" className="br-button br-button--secondary br-button--full">
                  Р—Р°Р±С‹Р»Рё РїР°СЂРѕР»СЊ?
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="br-auth-page">
      <section className="br-auth-shell br-card">
        <BrandLogo className="br-auth-shell__logo" />
        <div className="br-auth-shell__grid">
          <div className="br-auth-shell__intro">
            <span className="br-chip">РїРѕРґС‚РІРµСЂРґРёС‚Рµ email</span>
            <h1 className="br-auth-shell__title">РџРѕС‡С‚Рё РіРѕС‚РѕРІРѕ</h1>
            <p className="br-auth-shell__text">
              РњС‹ СЃРѕР·РґР°Р»Рё Р°РєРєР°СѓРЅС‚ {roleLabel}. РџРѕРґС‚РІРµСЂРґРёС‚Рµ email{email ? ` ${email}` : ""}, С‡С‚РѕР±С‹ Р·Р°РІРµСЂС€РёС‚СЊ РІС…РѕРґ РІ
              Bronly.
            </p>
          </div>

          <div className="br-auth-panel">
            {error === "resend" ? (
              <p className="br-card" style={{ marginBottom: 16 }}>
                РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РїСЂР°РІРёС‚СЊ РїРёСЃСЊРјРѕ РїРѕРІС‚РѕСЂРЅРѕ. РџРѕРїСЂРѕР±СѓР№С‚Рµ РїРѕР·Р¶Рµ РёР»Рё РїСЂРѕРІРµСЂСЊС‚Рµ РЅР°СЃС‚СЂРѕР№РєРё SMTP РІ Supabase.
              </p>
            ) : null}
            {success === "sent" ? (
              <p className="br-card" style={{ marginBottom: 16 }}>
                Р—Р°РїСЂРѕСЃ РѕС‚РїСЂР°РІР»РµРЅ. РџСЂРѕРІРµСЂСЊС‚Рµ РІС…РѕРґСЏС‰РёРµ Рё РїР°РїРєСѓ В«РЎРїР°РјВ» (РѕС‚РїСЂР°РІРёС‚РµР»СЊ вЂ” Supabase Auth).
              </p>
            ) : null}

            <div className="br-auth-form">
              <div className="br-auth-form__field">
                <strong>1. РћС‚РєСЂРѕР№С‚Рµ РїРёСЃСЊРјРѕ РѕС‚ Supabase (С‚РµРјР° РІСЂРѕРґРµ В«Confirm your signupВ»).</strong>
              </div>
              <div className="br-auth-form__field">
                <strong>2. РџРµСЂРµР№РґРёС‚Рµ РїРѕ СЃСЃС‹Р»РєРµ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ.</strong>
              </div>
              <div className="br-auth-form__field">
                <strong>3. РџРѕСЃР»Рµ СЌС‚РѕРіРѕ РІРѕР№РґРёС‚Рµ РІ РєР°Р±РёРЅРµС‚ Bronly.</strong>
              </div>

              {email ? (
                <form className="br-auth-form" action={resendConfirmationEmailAction}>
                  <input type="hidden" name="email" value={email} />
                  <input type="hidden" name="role" value={role} />
                  <input type="hidden" name="invite" value={invite} />
                  <button type="submit" className="br-button br-button--secondary br-button--full">
                    РћС‚РїСЂР°РІРёС‚СЊ РїРёСЃСЊРјРѕ РµС‰Рµ СЂР°Р·
                  </button>
                </form>
              ) : null}

              <Link
                href={invite ? `/login?${new URLSearchParams({ invite, next: `/invite/${invite}` }).toString()}` : "/login"}
                className="br-button br-button--primary br-button--full"
              >
                РџРµСЂРµР№С‚Рё РєРѕ РІС…РѕРґСѓ
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
