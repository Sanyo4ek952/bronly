import Link from "next/link";
import { redirect } from "next/navigation";

import { updateProfileAction } from "@/app/auth/actions";
import { getCurrentAuthProfile } from "@/shared/api/supabase";

type AgentSettingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AgentSettingsPage({ searchParams }: AgentSettingsPageProps) {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  const fallbackParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(fallbackParams));
  const error = typeof params.error === "string" ? params.error : "";
  const success = typeof params.success === "string" ? params.success : "";

  return (
    <section className="br-requests-layout">
      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>Профиль агента</h2>
            <p>Контакты, которые видит гость по агентской ссылке.</p>
          </div>
        </div>
        {error ? <p className="br-card" style={{ marginBottom: 16 }}>Не удалось сохранить изменения.</p> : null}
        {success === "saved" ? <p className="br-card" style={{ marginBottom: 16 }}>Профиль обновлен.</p> : null}
        <form action={updateProfileAction}>
          <input type="hidden" name="role" value="agent" />
          <div className="br-settings-grid">
            <div className="br-form-field">
              <label className="br-label" htmlFor="display-name">Имя</label>
              <input id="display-name" name="displayName" className="br-field" defaultValue={profile.displayName} />
            </div>
            <div className="br-form-field">
              <label className="br-label" htmlFor="phone">Телефон</label>
              <input id="phone" name="phone" className="br-field" defaultValue={profile.phone} />
            </div>
            <div className="br-form-field">
              <label className="br-label" htmlFor="email">Email</label>
              <input id="email" className="br-field" defaultValue={profile.email} disabled />
            </div>
            <div className="br-form-field">
              <label className="br-label" htmlFor="slug">Slug агента</label>
              <input id="slug" name="slug" className="br-field" defaultValue={profile.slug} />
            </div>
            <div className="br-form-field">
              <label className="br-label" htmlFor="telegram">Telegram</label>
              <input id="telegram" name="telegram" className="br-field" defaultValue={profile.telegram} />
            </div>
          </div>
          <div className="br-active-step__actions">
            <Link href="/forgot-password" className="br-button br-button--secondary">Изменить пароль</Link>
            <button className="br-button br-button--primary" type="submit">Сохранить</button>
          </div>
        </form>
      </section>
    </section>
  );
}
