"use client";

import Link from "next/link";
import { useState } from "react";

export function AddInventoryButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="br-button br-button--primary" onClick={() => setOpen(true)}>
        Добавить
      </button>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.42)",
            display: "grid",
            placeItems: "center",
            padding: 16,
            zIndex: 50,
          }}
        >
          <div className="br-card" style={{ width: "min(100%, 480px)", padding: 20 }}>
            <div className="br-dashboard-block__header" style={{ marginBottom: 16 }}>
              <div>
                <h3>Что добавить</h3>
                <p>Выберите, создаете ли вы полноценный объект с номерами или отдельный номер без объекта.</p>
              </div>
              <button type="button" className="br-link-button" onClick={() => setOpen(false)}>
                Закрыть
              </button>
            </div>
            <div className="br-owner-stack">
              <Link href="/dashboard/properties/new" className="br-button br-button--primary" onClick={() => setOpen(false)}>
                Объект с номерами
              </Link>
              <Link href="/dashboard/rooms/new" className="br-button br-button--secondary" onClick={() => setOpen(false)}>
                Отдельный номер
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
