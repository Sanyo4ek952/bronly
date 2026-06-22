import Link from "next/link";
import type { ReactNode } from "react";

import { Panel } from "@/shared/ui";

type PublicRequestPageFrameProps = {
  title: string;
  description: string;
  closeHref: string;
  closeLabel?: string;
  warningText?: string | null;
  notice?: ReactNode;
  children: ReactNode;
};

export function PublicRequestPageFrame({
  title,
  description,
  closeHref,
  closeLabel = "Закрыть",
  warningText,
  notice,
  children,
}: PublicRequestPageFrameProps) {
  return (
    <main className="br-auth-page">
      <Panel className="br-request-modal" as="section">
        <div className="br-request-modal__header">
          <div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <Link href={closeHref} className="br-request-modal__close" aria-label={closeLabel}>
            x
          </Link>
        </div>

        {warningText ? <p className="br-inline-notice">{warningText}</p> : null}
        {notice}
        {children}
      </Panel>
    </main>
  );
}
