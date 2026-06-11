import Link from "next/link";

import type { AdminDashboardData } from "@/entities/admin";
import { Button, Panel } from "@/shared/ui";

import {
  extendSubscriptionAction,
  reviewReferralRewardAction,
  saveSubscriptionAction,
  toggleProfilePublicVisibilityAction,
  togglePropertyFreezeAction,
} from "@/app/admin/actions";

function formatDateLabel(value: string | null) {
  if (!value) {
    return "РќРµ Р·Р°РґР°РЅРѕ";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateInputValue(value: string | null) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

function renderPublicLinks(links: string[]) {
  return links.map((link, index) => (
    <span key={link}>
      {index > 0 ? ", " : null}
      <Link href={link}>{link}</Link>
    </span>
  ));
}

type AdminDashboardProps = {
  data: AdminDashboardData;
  message: string;
};

export function AdminDashboard({ data, message }: AdminDashboardProps) {
  const topStats = [
    ["Р’СЃРµРіРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№", String(data.userCount)],
    ["Р’Р»Р°РґРµР»СЊС†С‹", String(data.ownerCount)],
    ["РђРіРµРЅС‚С‹", String(data.agentCount)],
    ["РЎ РґРІСѓРјСЏ СЂРѕР»СЏРјРё", String(data.dualRoleCount)],
    ["РђРєС‚РёРІРЅС‹Рµ РїРѕРґРїРёСЃРєРё", String(data.activeSubscriptionCount)],
    ["РћРїР»Р°С‡РёРІР°СЋС‚ СЃРµР№С‡Р°СЃ", String(data.paidUserCount)],
    ["РЎРєРѕСЂРѕ РёСЃС‚РµРєР°СЋС‚", String(data.expiringSoonCount)],
    ["Р—Р°РјРѕСЂРѕР¶РµРЅРЅС‹Рµ РѕР±СЉРµРєС‚С‹", String(data.frozenPropertyCount)],
  ];

  const activityStats = [
    ["РћР±СЉРµРєС‚С‹", String(data.propertyCount)],
    ["РќРѕРјРµСЂР°", String(data.roomCount)],
    ["Р’СЃРµРіРѕ Р·Р°СЏРІРѕРє", String(data.requestCount)],
    ["Р—Р°СЏРІРєРё РІР»Р°РґРµР»СЊС†РµРІ", String(data.ownerRequestCount)],
    ["Р—Р°СЏРІРєРё Р°РіРµРЅС‚РѕРІ", String(data.agentRequestCount)],
    ["РџРµСЂРµРґР°РЅРѕ РІР»Р°РґРµР»СЊС†Сѓ", String(data.transferredRequestCount)],
    ["Р—Р°РІРµСЂС€РµРЅРѕ", String(data.completedRequestCount)],
    ["РљРѕР»Р»РµРєС†РёРё", String(data.collectionCount)],
  ];

  return (
    <main className="br-page br-page--dashboard">
      <div className="br-container br-dashboard-layout">
        <section className="br-admin-header">
          <div>
            <h1>РђРґРјРёРЅ-РїР°РЅРµР»СЊ</h1>
            <p>РћРїРµСЂР°С†РёРѕРЅРЅС‹Р№ РєР°Р±РёРЅРµС‚ Bronly: РїРѕР»СЊР·РѕРІР°С‚РµР»Рё, РїРѕРґРїРёСЃРєРё, Р·Р°СЏРІРєРё Рё РґРѕСЃС‚СѓРїРЅРѕСЃС‚СЊ РѕР±СЉРµРєС‚РѕРІ.</p>
          </div>
        </section>

        {message ? <div className="br-inline-notice">{message}</div> : null}

        <section className="br-admin-stats">
          {topStats.map(([label, value]) => (
            <Panel key={label} as="article" className="br-admin-stat">
              <span>{label}</span>
              <strong>{value}</strong>
            </Panel>
          ))}
        </section>

        <section className="br-admin-stats">
          {activityStats.map(([label, value]) => (
            <Panel key={label} as="article" className="br-admin-stat">
              <span>{label}</span>
              <strong>{value}</strong>
            </Panel>
          ))}
        </section>

        <section className="br-admin-grid" style={{ gridTemplateColumns: "1fr" }}>
          <Panel className="br-dashboard-block">
            <div className="br-dashboard-block__header">
              <div>
                <h2>Р РµС„РµСЂР°Р»СЊРЅС‹Рµ РїСЂРѕРґР»РµРЅРёСЏ</h2>
                <p>РџРѕРґС‚РІРµСЂР¶РґР°Р№С‚Рµ РёР»Рё РѕС‚РєР»РѕРЅСЏР№С‚Рµ РЅР°С‡РёСЃР»РµРЅРёСЏ РїРѕСЃР»Рµ milestone РїСЂРёРіР»Р°С€РµРЅРЅРѕРіРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ.</p>
              </div>
            </div>

            {data.pendingReferralRewards.length ? (
              <div className="br-table">
                <div className="br-table__head">
                  <span>РџСЂРёРіР»Р°СЃРёРІС€РёР№</span>
                  <span>РќРѕРІС‹Р№ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ</span>
                  <span>Milestone</span>
                  <span>Р‘РѕРЅСѓСЃ</span>
                  <span>Р‘С‹СЃС‚СЂС‹Р№ РїРµСЂРµС…РѕРґ</span>
                  <span>Р”РµР№СЃС‚РІРёРµ</span>
                </div>
                {data.pendingReferralRewards.map((row) => (
                  <div key={row.rewardId} className="br-table__row">
                    <span>
                      {row.inviterName}
                      <br />
                      <small>{row.inviterRoles.join(", ") || "owner"}</small>
                    </span>
                    <span>
                      {row.invitedName}
                      <br />
                      <small>{row.milestoneReachedAt}</small>
                    </span>
                    <span>{row.milestoneLabel}</span>
                    <span>+{row.rewardDays} РґРЅРµР№</span>
                    <span>
                      <a href={`#subscription-${row.inviterProfileId}`}>Рљ РїРѕРґРїРёСЃРєР°Рј</a>
                    </span>
                    <span>
                      <div className="br-owner-actions">
                        <form action={reviewReferralRewardAction}>
                          <input type="hidden" name="rewardId" value={row.rewardId} />
                          <input type="hidden" name="decision" value="approved" />
                          <Button type="submit" size="sm">
                            РџРѕРґС‚РІРµСЂРґРёС‚СЊ
                          </Button>
                        </form>
                        <form action={reviewReferralRewardAction}>
                          <input type="hidden" name="rewardId" value={row.rewardId} />
                          <input type="hidden" name="decision" value="rejected" />
                          <Button type="submit" size="sm" variant="secondary">
                            РћС‚РєР»РѕРЅРёС‚СЊ
                          </Button>
                        </form>
                      </div>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p>РџРѕРєР° РЅРµС‚ РѕР¶РёРґР°СЋС‰РёС… СЂРµС„РµСЂР°Р»СЊРЅС‹С… РїСЂРѕРґР»РµРЅРёР№.</p>
            )}
          </Panel>

          <Panel className="br-dashboard-block">
            <div className="br-dashboard-block__header">
              <div>
                <h2>РџРѕР»СЊР·РѕРІР°С‚РµР»Рё</h2>
                <p>Р РѕР»Рё, РєРѕРЅС‚Р°РєС‚С‹, РїСѓР±Р»РёС‡РЅС‹Рµ СЃСЃС‹Р»РєРё Рё Р°РґРјРёРЅСЃРєРѕРµ СЃРєСЂС‹С‚РёРµ owner/agent СЃС‚СЂР°РЅРёС†.</p>
              </div>
            </div>
            <div className="br-table">
              <div className="br-table__head">
                <span>РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ</span>
                <span>РљРѕРЅС‚Р°РєС‚</span>
                <span>РџСѓР±Р»РёС‡РЅС‹Рµ СЃСЃС‹Р»РєРё</span>
                <span>РћР±СЉРµРєС‚С‹</span>
                <span>Р РѕР»Рё</span>
                <span>Р—Р°СЏРІРєРё</span>
                <span>Р”РµР№СЃС‚РІРёРµ</span>
              </div>
              {data.users.map((row) => (
                <div key={row.profileId} className="br-table__row">
                  <span>{row.displayName}</span>
                  <span>{row.phone || row.slug || "РќРµ СѓРєР°Р·Р°РЅ"}</span>
                  <span>
                    {row.publicPageUrls.length ? (
                      <>
                        {renderPublicLinks(row.publicPageUrls)}
                        <br />
                        <small>{row.isPublicHiddenByAdmin ? "РЎРєСЂС‹С‚С‹ Р°РґРјРёРЅРѕРј" : "Р”РѕСЃС‚СѓРїРЅС‹"}</small>
                      </>
                    ) : (
                      "РќРµС‚ РїСѓР±Р»РёС‡РЅС‹С… СЃСЃС‹Р»РѕРє"
                    )}
                  </span>
                  <span>{row.propertyCount}</span>
                  <span>{row.roles.join(", ")}</span>
                  <span>{row.requestCount}</span>
                  <span>
                    {row.publicPageUrls.length ? (
                      <form action={toggleProfilePublicVisibilityAction}>
                        <input type="hidden" name="profileId" value={row.profileId} />
                        <input type="hidden" name="nextHidden" value={row.isPublicHiddenByAdmin ? "false" : "true"} />
                        <button className="br-button br-button--secondary" type="submit">
                          {row.isPublicHiddenByAdmin ? "Р’РµСЂРЅСѓС‚СЊ СЃС‚СЂР°РЅРёС†С‹" : "РЎРєСЂС‹С‚СЊ СЃС‚СЂР°РЅРёС†С‹"}
                        </button>
                      </form>
                    ) : (
                      "вЂ”"
                    )}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="br-dashboard-block">
            <div className="br-dashboard-block__header">
              <div>
                <h2>РџРѕРґРїРёСЃРєРё</h2>
                <p>Р СѓС‡РЅРѕРµ РїСЂРѕРґР»РµРЅРёРµ Рё РЅР°СЃС‚СЂРѕР№РєР° РґРѕСЃС‚СѓРїРѕРІ РїРѕ РєРѕРЅС‚РµРєСЃС‚Р°Рј owner Рё agent.</p>
              </div>
            </div>
            <div className="br-owner-stack">
              {data.subscriptions.map((row) => (
                <form
                  key={`${row.profileId}-${row.roleContext}`}
                  id={`subscription-${row.profileId}`}
                  action={saveSubscriptionAction}
                  className="br-owner-inline-form"
                >
                  <input type="hidden" name="profileId" value={row.profileId} />
                  <input type="hidden" name="roleContext" value={row.roleContext} />
                  <div className="br-form-field">
                    <label className="br-label">РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ</label>
                    <input className="br-field" value={row.displayName} disabled />
                  </div>
                  <div className="br-form-field">
                    <label className="br-label">РљРѕРЅС‚РµРєСЃС‚</label>
                    <input className="br-field" value={row.roleContext} disabled />
                  </div>
                  <div className="br-form-field">
                    <label className="br-label">РЎС‚Р°С‚СѓСЃ</label>
                    <select className="br-field" name="status" defaultValue={row.status}>
                      <option value="trial">trial</option>
                      <option value="active">active</option>
                      <option value="grace">grace</option>
                      <option value="expired">expired</option>
                      <option value="manual">manual</option>
                    </select>
                  </div>
                  <div className="br-form-field">
                    <label className="br-label">РџР»Р°РЅ</label>
                    <input className="br-field" name="planName" defaultValue={row.planName} />
                  </div>
                  <div className="br-form-field">
                    <label className="br-label">Р›РёРјРёС‚ РЅРѕРјРµСЂРѕРІ</label>
                    <input className="br-field" name="activeRoomLimit" defaultValue={row.activeRoomLimit ?? ""} />
                  </div>
                  <div className="br-form-field">
                    <label className="br-label">РђРєС‚РёРІРЅС‹Рµ РЅРѕРјРµСЂР°</label>
                    <input className="br-field" value={String(row.activeRoomCount)} disabled />
                  </div>
                  <div className="br-form-field">
                    <label className="br-label">Р”РѕСЃС‚СѓРї РґРѕ</label>
                    <input className="br-field" value={formatDateLabel(row.validUntil)} disabled />
                  </div>
                  <div className="br-form-field">
                    <label className="br-label">РћРїР»Р°С‡РµРЅРѕ РґРѕ</label>
                    <input className="br-field" name="paidUntil" type="date" defaultValue={formatDateInputValue(row.paidUntil)} />
                  </div>
                  <div className="br-form-field">
                    <label className="br-label">Grace period РґРѕ</label>
                    <input className="br-field" name="graceEndsAt" type="date" defaultValue={formatDateInputValue(row.graceEndsAt)} />
                  </div>
                  <div className="br-owner-actions">
                    <Button type="submit" variant="secondary">
                      РЎРѕС…СЂР°РЅРёС‚СЊ
                    </Button>
                    <button className="br-button br-button--primary" type="submit" formAction={extendSubscriptionAction}>
                      РџСЂРѕРґР»РёС‚СЊ РЅР° 30 РґРЅРµР№
                    </button>
                  </div>
                </form>
              ))}
            </div>
          </Panel>

          <Panel className="br-dashboard-block">
            <div className="br-dashboard-block__header">
              <div>
                <h2>РћР±СЉРµРєС‚С‹</h2>
                <p>Р—Р°РјРѕСЂРѕР·РєР° Рё СЂР°Р·РјРѕСЂРѕР·РєР° РєРѕРЅРєСЂРµС‚РЅРѕРіРѕ РѕР±СЉРµРєС‚Р° Р±РµР· РёР·РјРµРЅРµРЅРёСЏ РµРіРѕ РїСѓР±Р»РёРєР°С†РёРё.</p>
              </div>
            </div>
            <div className="br-table">
              <div className="br-table__head">
                <span>РћР±СЉРµРєС‚</span>
                <span>Р’Р»Р°РґРµР»РµС†</span>
                <span>РЎС‚Р°С‚СѓСЃ</span>
                <span>РќРѕРјРµСЂР°</span>
                <span>Р”РµР№СЃС‚РІРёРµ</span>
              </div>
              {data.properties.map((row) => (
                <div key={row.propertyId} className="br-table__row">
                  <span>
                    {row.title}
                    <br />
                    <small>slug РѕР±СЉРµРєС‚Р°: {row.slug}</small>
                  </span>
                  <span>
                    {row.ownerName}
                    <br />
                    <small>
                      {row.ownerPublicSlug ? <Link href={`/p/${row.ownerPublicSlug}`}>/p/{row.ownerPublicSlug}</Link> : "slug РІР»Р°РґРµР»СЊС†Р° РЅРµ Р·Р°РїРѕР»РЅРµРЅ"}
                    </small>
                  </span>
                  <span>{row.isFrozen ? "Р—Р°РјРѕСЂРѕР¶РµРЅ" : row.published ? "РћРїСѓР±Р»РёРєРѕРІР°РЅ" : "РЎРєСЂС‹С‚"}</span>
                  <span>
                    {row.activeRoomCount} / {row.totalRoomCount}
                  </span>
                  <span>
                    <form action={togglePropertyFreezeAction}>
                      <input type="hidden" name="propertyId" value={row.propertyId} />
                      <input type="hidden" name="nextFrozen" value={row.isFrozen ? "false" : "true"} />
                      <button className="br-button br-button--secondary" type="submit">
                        {row.isFrozen ? "Р Р°Р·РјРѕСЂРѕР·РёС‚СЊ" : "Р—Р°РјРѕСЂРѕР·РёС‚СЊ"}
                      </button>
                    </form>
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}
