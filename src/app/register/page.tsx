import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signUpAction } from "@/app/auth/actions";
import { getCurrentAuthProfile, getPostLoginRedirect } from "@/shared/api/supabase";
import { createSeoMetadata } from "@/shared/lib/seo";
import { BrandLogo, SubmitButton } from "@/shared/ui";

export const metadata: Metadata = createSeoMetadata({
  title: "Р РµРіРёСЃС‚СЂР°С†РёСЏ",
  description: "РЎС‚СЂР°РЅРёС†Р° СЂРµРіРёСЃС‚СЂР°С†РёРё РІ Bronly.",
  path: "/register",
  index: false,
});

type RegisterPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function buildLoginHref(invite: string, next: string) {
  const params = new URLSearchParams();

  if (invite) {
    params.set("invite", invite);
  }

  if (next) {
    params.set("next", next);
  }

  const query = params.toString();
  return query ? `/login?${query}` : "/login";
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const profile = await getCurrentAuthProfile();

  if (profile) {
    redirect(getPostLoginRedirect(profile.roles));
  }

  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof params.error === "string" ? params.error : "";
  const invite = typeof params.invite === "string" ? params.invite : "";
  const next = typeof params.next === "string" ? params.next : "";
  const requestedRole =
    typeof params.role === "string" && (params.role === "owner" || params.role === "agent")
      ? params.role
      : "owner";

  return (
    <main className="br-auth-page">
      <section className="br-auth-shell br-card">
        <BrandLogo className="br-auth-shell__logo" />
        <div className="br-auth-shell__grid">
          <div className="br-auth-shell__intro">
            <span className="br-chip">РЎС‚Р°СЂС‚ РґР»СЏ РІР»Р°РґРµР»СЊС†Р° РёР»Рё Р°РіРµРЅС‚Р°</span>
            <h1 className="br-auth-shell__title">РЎРѕР·РґР°Р№С‚Рµ Р°РєРєР°СѓРЅС‚</h1>
            <p className="br-auth-shell__text">
              Р—Р°РїСѓСЃС‚РёС‚Рµ СЃРІРѕСЋ РІРёС‚СЂРёРЅСѓ, РґРѕР±Р°РІСЊС‚Рµ РѕР±СЉРµРєС‚С‹, РЅРѕРјРµСЂР° Рё РЅР°С‡РЅРёС‚Рµ РїСЂРёРЅРёРјР°С‚СЊ Р·Р°СЏРІРєРё РїРѕ
              РїРµСЂСЃРѕРЅР°Р»СЊРЅРѕР№ СЃСЃС‹Р»РєРµ.
            </p>
          </div>

          <div className="br-auth-panel">
            {error ? (
              <p className="br-card" style={{ marginBottom: 16 }}>
                РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ Р°РєРєР°СѓРЅС‚. РџСЂРѕРІРµСЂСЊС‚Рµ РїРѕР»СЏ Рё РїРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰Рµ СЂР°Р·.
              </p>
            ) : null}

            <form className="br-auth-form" action={signUpAction}>
              <input type="hidden" name="invite" value={invite} />
              <input type="hidden" name="next" value={next} />

              <div className="br-auth-form__field">
                <label className="br-label" htmlFor="display-name">
                  РРјСЏ
                </label>
                <input
                  id="display-name"
                  name="displayName"
                  type="text"
                  className="br-field"
                  placeholder="РРІР°РЅ РРІР°РЅРѕРІ"
                  required
                />
              </div>
              <div className="br-auth-form__field">
                <label className="br-label" htmlFor="role">
                  Р РѕР»СЊ
                </label>
                <select id="role" name="role" className="br-field" defaultValue={requestedRole}>
                  <option value="owner">Р’Р»Р°РґРµР»РµС†</option>
                  <option value="agent">РђРіРµРЅС‚</option>
                </select>
              </div>
              <div className="br-auth-form__field">
                <label className="br-label" htmlFor="register-email">
                  Email
                </label>
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  className="br-field"
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div className="br-auth-form__field">
                <label className="br-label" htmlFor="phone">
                  РўРµР»РµС„РѕРЅ
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="br-field"
                  placeholder="+7 (900) 123-45-67"
                />
              </div>
              <div className="br-auth-form__field">
                <label className="br-label" htmlFor="register-password">
                  РџР°СЂРѕР»СЊ
                </label>
                <input
                  id="register-password"
                  name="password"
                  type="password"
                  className="br-field"
                  placeholder="РњРёРЅРёРјСѓРј 8 СЃРёРјРІРѕР»РѕРІ"
                  required
                />
              </div>
              <label className="br-check">
                <input name="acceptedTerms" type="checkbox" required />
                <span>
                  РЇ РїСЂРёРЅРёРјР°СЋ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєРѕРµ СЃРѕРіР»Р°С€РµРЅРёРµ Рё РїРѕР»РёС‚РёРєСѓ РєРѕРЅС„РёРґРµРЅС†РёР°Р»СЊРЅРѕСЃС‚Рё.
                </span>
              </label>
              <SubmitButton fullWidth pendingLabel="Регистрация">Р—Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°С‚СЊСЃСЏ</SubmitButton>
            </form>

            <p className="br-auth-bottom">
              РЈР¶Рµ РµСЃС‚СЊ Р°РєРєР°СѓРЅС‚? <Link href={buildLoginHref(invite, next)}>Р’РѕР№С‚Рё</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
