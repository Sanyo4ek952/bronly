"use client";

import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";

export function ExpandableText({ text }: { text: string }) {
  const id = useId();
  const textRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const element = textRef.current;
    if (!element || expanded) return;
    const measure = () => setOverflows(element.scrollHeight > element.clientHeight + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [text, expanded]);

  if (!text.trim()) return null;

  return (
    <div className="grid min-w-0 gap-2">
      <p ref={textRef} id={id} className={cn("whitespace-pre-line leading-relaxed [overflow-wrap:anywhere]", !expanded && "line-clamp-4")}>
        {text}
      </p>
      {overflows ? <Button
        variant="ghost"
        className="justify-self-start text-[var(--accent)]"
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() => setExpanded((current) => !current)}
      >{expanded ? "Свернуть" : "Читать полностью"}</Button> : null}
    </div>
  );
}
