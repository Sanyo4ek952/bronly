import type { Metadata } from "next";
import Link from "next/link";

import { forgotPasswordAction } from "@/app/auth/actions";
import { createSeoMetadata } from "@/shared/lib/seo";
import { BrandLogo, SubmitButton } from "@/shared/ui";

type ForgotPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = createSeoMetadata({
  title: "Р’РѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёРµ РґРѕСЃС‚СѓРїР°",
  description: "РЎС‚СЂР°РЅРёС†Р° РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёСЏ РїР°СЂРѕР»СЏ РІ Bronly.",
  path: "/forgot-password",
  index: false,
});

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof params.error === "string" ? params.error : "";
  const success = typeof params.success === "string" ? params.success : "";

  return (
    <main className="br-auth-page">
      <section className="br-auth-shell br-card">
        <BrandLogo className="br-auth-shell__logo" />
        <div className="br-auth-shell__grid">
          <div className="br-auth-shell__intro">
            <span className="br-chip">РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёРµ РґРѕСЃС‚СѓРїР°</span>
            <h1 className="br-auth-shell__title">РЎР±СЂРѕСЃ РїР°СЂРѕР»СЏ</h1>
            <p className="br-auth-shell__text">
              РћС‚РїСЂР°РІРёРј СЃСЃС‹Р»РєСѓ РґР»СЏ СЃРјРµРЅС‹ РїР°СЂРѕР»СЏ РЅР° РІР°С€ email.
            </p>
          </div>

          <div className="br-auth-panel">
            {error ? (
              <p className="br-card" style={{ marginBottom: 16 }}>
                РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РїСЂР°РІРёС‚СЊ РїРёСЃСЊРјРѕ. РџРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰Рµ СЂР°Р·.
              </p>
            ) : null}
            {success === "sent" ? (
              <p className="br-card" style={{ marginBottom: 16 }}>
                РџРёСЃСЊРјРѕ РѕС‚РїСЂР°РІР»РµРЅРѕ. РџСЂРѕРІРµСЂСЊС‚Рµ РїРѕС‡С‚Сѓ Рё РїРµСЂРµР№РґРёС‚Рµ РїРѕ СЃСЃС‹Р»РєРµ.
              </p>
            ) : null}

            <form className="br-auth-form" action={forgotPasswordAction}>
              <div className="br-auth-form__field">
                <label className="br-label" htmlFor="email">
                  Email
                </label>
                <input id="email" name="email" type="email" className="br-field" placeholder="name@example.com" required />
              </div>
              <SubmitButton fullWidth pendingLabel="Отправка">РћС‚РїСЂР°РІРёС‚СЊ СЃСЃС‹Р»РєСѓ</SubmitButton>
            </form>

            <p className="br-auth-bottom">
              Р’СЃРїРѕРјРЅРёР»Рё РїР°СЂРѕР»СЊ? <Link href="/login">Р’РµСЂРЅСѓС‚СЊСЃСЏ РєРѕ РІС…РѕРґСѓ</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
