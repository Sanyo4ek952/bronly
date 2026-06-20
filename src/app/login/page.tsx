import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signInAction } from "@/app/auth/actions";
import { getCurrentAuthProfile, getPostLoginRedirect } from "@/shared/api/supabase";
import { createSeoMetadata } from "@/shared/lib/seo";
import { BrandLogo, SubmitButton } from "@/shared/ui";

export const metadata: Metadata = createSeoMetadata({
  title: "Р’С…РѕРґ",
  description: "РЎС‚СЂР°РЅРёС†Р° РІС…РѕРґР° РІ Bronly.",
  path: "/login",
  index: false,
});

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function buildRegisterHref(invite: string, next: string) {
  const params = new URLSearchParams();

  if (invite) {
    params.set("invite", invite);
    params.set("role", "owner");
  }

  if (next) {
    params.set("next", next);
  }

  const query = params.toString();
  return query ? `/register?${query}` : "/register";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const profile = await getCurrentAuthProfile();

  if (profile) {
    redirect(getPostLoginRedirect(profile.roles));
  }

  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof params.error === "string" ? params.error : "";
  const success = typeof params.success === "string" ? params.success : "";
  const info = typeof params.info === "string" ? params.info : "";
  const emailHint = typeof params.email === "string" ? params.email : "";
  const next = typeof params.next === "string" ? params.next : "";
  const invite = typeof params.invite === "string" ? params.invite : "";

  return (
    <main className="br-auth-page">
      <section className="br-auth-shell br-card">
        <BrandLogo className="br-auth-shell__logo" />
        <div className="br-auth-shell__grid">
          <div className="br-auth-shell__intro">
            <span className="br-chip">Р’С…РѕРґ РІР»Р°РґРµР»СЊС†Р° РёР»Рё Р°РіРµРЅС‚Р°</span>
            <h1 className="br-auth-shell__title">Р’С…РѕРґ РІ Р°РєРєР°СѓРЅС‚</h1>
            <p className="br-auth-shell__text">
              Р’РµСЂРЅРёС‚РµСЃСЊ РІ РєР°Р±РёРЅРµС‚, С‡С‚РѕР±С‹ СѓРїСЂР°РІР»СЏС‚СЊ РѕР±СЉРµРєС‚Р°РјРё, РєР°Р»РµРЅРґР°СЂРµРј Р·Р°РЅСЏС‚РѕСЃС‚Рё Рё Р·Р°СЏРІРєР°РјРё.
            </p>
          </div>

          <div className="br-auth-panel">
            {error === "profile" ? (
              <p className="br-card" style={{ marginBottom: 16 }}>
                Р’С…РѕРґ РІС‹РїРѕР»РЅРµРЅ, РЅРѕ РїСЂРѕС„РёР»СЊ РІ Bronly РЅРµ СЃРѕР·РґР°РЅ. РџРѕРїСЂРѕР±СѓР№С‚Рµ РІРѕР№С‚Рё РµС‰Рµ СЂР°Р· РёР»Рё РѕР±СЂР°С‚РёС‚РµСЃСЊ РІ
                РїРѕРґРґРµСЂР¶РєСѓ.
              </p>
            ) : null}
            {error === "session" ? (
              <p className="br-card" style={{ marginBottom: 16 }}>
                Р’С…РѕРґ РїСЂРѕС€РµР», РЅРѕ СЃРµСЃСЃРёСЏ РЅРµ СЃРѕС…СЂР°РЅРёР»Р°СЃСЊ. РћС‚РєР»СЋС‡РёС‚Рµ Р±Р»РѕРєРёСЂРѕРІРєСѓ cookies РґР»СЏ localhost Рё
                РїРѕРїСЂРѕР±СѓР№С‚Рµ СЃРЅРѕРІР°.
              </p>
            ) : null}
            {error === "email-not-confirmed" ? (
              <p className="br-card" style={{ marginBottom: 16 }}>
                Email Р ВµРЎвЂ°Р Вµ Р Р…Р Вµ Р С—Р С•Р Т‘РЎвЂљР Р†Р ВµРЎР‚Р В¶Р Т‘Р ВµР Р…. Р вЂ”Р В°Р Р†Р ВµРЎР‚РЎв‚¬Р С‘РЎвЂљР Вµ Р С—Р С•Р Т‘РЎвЂљР Р†Р ВµРЎР‚Р В¶Р Т‘Р ВµР Р…Р С‘Р Вµ Р С‘Р В· Р С—Р С‘РЎРѓРЎРЉР СР В° Р С‘Р В»Р С‘ Р Р†Р С•РЎРѓРЎРѓРЎвЂљР В°Р Р…Р С•Р Р†Р С‘РЎвЂљР Вµ Р Т‘Р С•РЎРѓРЎвЂљРЎС“Р С— РЎвЂЎР ВµРЎР‚Р ВµР В· Р’В«Р вЂ”Р В°Р В±РЎвЂ№Р В»Р С‘ Р С—Р В°РЎР‚Р С•Р В»РЎРЉ?Р’В».
              </p>
            ) : null}
            {error && error !== "profile" && error !== "session" && error !== "email-not-confirmed" ? (
              <p className="br-card" style={{ marginBottom: 16 }}>
                РќРµ СѓРґР°Р»РѕСЃСЊ РІРѕР№С‚Рё. РџСЂРѕРІРµСЂСЊС‚Рµ email Рё РїР°СЂРѕР»СЊ.
              </p>
            ) : null}
            {success === "check-email" ? (
              <p className="br-card" style={{ marginBottom: 16 }}>
                РђРєРєР°СѓРЅС‚ СЃРѕР·РґР°РЅ. Р•СЃР»Рё РІ РїСЂРѕРµРєС‚Рµ РІРєР»СЋС‡РµРЅРѕ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ email, Р·Р°РІРµСЂС€РёС‚Рµ РµРіРѕ Рё Р·Р°С‚РµРј
                РІРѕР№РґРёС‚Рµ.
              </p>
            ) : null}
            {info === "already-confirmed" ? (
              <p className="br-card" style={{ marginBottom: 16 }}>
                Р­С‚РѕС‚ email СѓР¶Рµ РїРѕРґС‚РІРµСЂР¶РґРµРЅ. Р’РѕР№РґРёС‚Рµ СЃ РїР°СЂРѕР»РµРј РёР»Рё РІРѕСЃСЃС‚Р°РЅРѕРІРёС‚Рµ РµРіРѕ С‡РµСЂРµР· В«Р—Р°Р±С‹Р»Рё РїР°СЂРѕР»СЊ?В».
              </p>
            ) : null}

            <form className="br-auth-form" action={signInAction}>
              <input type="hidden" name="next" value={next} />

              <div className="br-auth-form__field">
                <label className="br-label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="br-field"
                  placeholder="name@example.com"
                  defaultValue={emailHint}
                  required
                />
              </div>
              <div className="br-auth-form__field">
                <label className="br-label" htmlFor="password">
                  РџР°СЂРѕР»СЊ
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="br-field"
                  placeholder="Р’РІРµРґРёС‚Рµ РїР°СЂРѕР»СЊ"
                  required
                />
              </div>
              <Link href="/forgot-password" className="br-auth-form__forgot">
                Р—Р°Р±С‹Р»Рё РїР°СЂРѕР»СЊ?
              </Link>
              <SubmitButton fullWidth pendingLabel="Вход">Р’РѕР№С‚Рё</SubmitButton>
            </form>

            <p className="br-auth-bottom">
              РќРµС‚ Р°РєРєР°СѓРЅС‚Р°? <Link href={buildRegisterHref(invite, next)}>РЎРѕР·РґР°С‚СЊ Р°РєРєР°СѓРЅС‚</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
