import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { updatePasswordAction } from "@/app/auth/actions";
import { getCurrentAuthProfile } from "@/shared/api/supabase";
import { createSeoMetadata } from "@/shared/lib/seo";
import { BrandLogo, SubmitButton } from "@/shared/ui";

type ResetPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = createSeoMetadata({
  title: "РќРѕРІС‹Р№ РїР°СЂРѕР»СЊ",
  description: "РЎС‚СЂР°РЅРёС†Р° РѕР±РЅРѕРІР»РµРЅРёСЏ РїР°СЂРѕР»СЏ РІ Bronly.",
  path: "/reset-password",
  index: false,
});

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof params.error === "string" ? params.error : "";

  return (
    <main className="br-auth-page">
      <section className="br-auth-shell br-card">
        <BrandLogo className="br-auth-shell__logo" />
        <div className="br-auth-shell__grid">
          <div className="br-auth-shell__intro">
            <span className="br-chip">РѕР±РЅРѕРІР»РµРЅРёРµ РїР°СЂРѕР»СЏ</span>
            <h1 className="br-auth-shell__title">РќРѕРІС‹Р№ РїР°СЂРѕР»СЊ</h1>
            <p className="br-auth-shell__text">
              Р—Р°РґР°Р№С‚Рµ РЅРѕРІС‹Р№ РїР°СЂРѕР»СЊ РґР»СЏ Р°РєРєР°СѓРЅС‚Р° Bronly.
            </p>
          </div>

          <div className="br-auth-panel">
            {error ? (
              <p className="br-card" style={{ marginBottom: 16 }}>
                РќРµ СѓРґР°Р»РѕСЃСЊ РѕР±РЅРѕРІРёС‚СЊ РїР°СЂРѕР»СЊ. РЈР±РµРґРёС‚РµСЃСЊ, С‡С‚Рѕ РїР°СЂРѕР»Рё СЃРѕРІРїР°РґР°СЋС‚ Рё СЃРѕРґРµСЂР¶Р°С‚ РјРёРЅРёРјСѓРј 8 СЃРёРјРІРѕР»РѕРІ.
              </p>
            ) : null}

            <form className="br-auth-form" action={updatePasswordAction}>
              <div className="br-auth-form__field">
                <label className="br-label" htmlFor="password">
                  РќРѕРІС‹Р№ РїР°СЂРѕР»СЊ
                </label>
                <input id="password" name="password" type="password" className="br-field" placeholder="РњРёРЅРёРјСѓРј 8 СЃРёРјРІРѕР»РѕРІ" required />
              </div>
              <div className="br-auth-form__field">
                <label className="br-label" htmlFor="confirm-password">
                  РџРѕРІС‚РѕСЂРёС‚Рµ РїР°СЂРѕР»СЊ
                </label>
                <input id="confirm-password" name="confirmPassword" type="password" className="br-field" placeholder="РџРѕРІС‚РѕСЂРёС‚Рµ РїР°СЂРѕР»СЊ" required />
              </div>
              <SubmitButton fullWidth pendingLabel="Сохранение">РЎРѕС…СЂР°РЅРёС‚СЊ РїР°СЂРѕР»СЊ</SubmitButton>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
