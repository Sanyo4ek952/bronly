import Link from "next/link";

import { Button, Input } from "@/shared/ui";

import { getCollectionFeedbackMessage } from "./collection-feedback";

type CollectionAction = (formData: FormData) => Promise<void>;

type CollectionCreateSectionProps = {
  title: string;
  description: string;
  fieldPlaceholder: string;
  backHref: string;
  pageNav?: React.ReactNode;
  action: CollectionAction;
  success?: string;
  error?: string;
};

export function CollectionCreateSection({
  title,
  description,
  fieldPlaceholder,
  backHref,
  pageNav = null,
  action,
  success = "",
  error = "",
}: CollectionCreateSectionProps) {
  const message = getCollectionFeedbackMessage(success, error);

  return (
    <section className="br-owner-stack">
      {pageNav}

      <section className="br-dashboard-block br-card">
        <div className="br-dashboard-block__header">
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </div>

        {message ? <div className="br-inline-notice">{message}</div> : null}

        <form action={action} className="br-owner-editor br-owner-editor--muted">
          <div className="br-owner-editor__header">
            <div>
              <strong>РќРѕРІР°СЏ РєРѕР»Р»РµРєС†РёСЏ</strong>
              <p>РќР°Р·РІР°РЅРёРµ РјРѕР¶РЅРѕ СЃСЂР°Р·Сѓ Р·Р°РґР°С‚СЊ РїРѕРґ РєРѕРЅРєСЂРµС‚РЅРѕРіРѕ РіРѕСЃС‚СЏ.</p>
            </div>
            <Link href={backHref} className="br-button br-button--secondary">
              Рљ СЃРїРёСЃРєСѓ РєРѕР»Р»РµРєС†РёР№
            </Link>
          </div>
          <div className="br-form-grid br-form-grid--single-action">
            <Input id="collection-title" name="title" label="РќР°Р·РІР°РЅРёРµ РєРѕР»Р»РµРєС†РёРё" placeholder={fieldPlaceholder} />
            <div className="br-owner-actions br-owner-actions--end">
              <Button type="submit">РЎРѕР·РґР°С‚СЊ РєРѕР»Р»РµРєС†РёСЋ</Button>
            </div>
          </div>
        </form>
      </section>
    </section>
  );
}
