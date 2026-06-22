"use client";

import { AlertCircle } from "lucide-react";

type PropertiesErrorProps = {
  reset: () => void;
};

export default function PropertiesError({ reset }: PropertiesErrorProps) {
  return (
    <section className="br-property-hub">
      <article className="br-property-hub-error br-card">
        <div className="br-property-hub-error__icon" aria-hidden="true">
          <AlertCircle />
        </div>
        <div className="br-property-hub-error__copy">
          <h1>Не удалось загрузить объекты</h1>
          <p>Попробуйте ещё раз. Если ошибка повторится, проверьте подключение и состояние данных.</p>
        </div>
        <button type="button" className="br-button br-button--primary" onClick={reset}>
          Повторить
        </button>
      </article>
    </section>
  );
}
