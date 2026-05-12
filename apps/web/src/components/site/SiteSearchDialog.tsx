"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SiteSearchDialog({ open, onClose }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="hr-search-dialog-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="hr-search-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="hr-search-dialog-title">
          Search HealthRankings
        </h2>
        <form
          className="hr-search-dialog-form"
          onSubmit={(e) => {
            e.preventDefault();
            const q = String(inputRef.current?.value || "").trim();
            if (q.length < 2) return;
            onClose();
            router.push(`/search?q=${encodeURIComponent(q)}`);
          }}
        >
          <input
            ref={inputRef}
            type="search"
            name="q"
            className="hr-search-dialog-input"
            placeholder="Articles, devices, topics…"
            autoComplete="off"
            aria-label="Search query"
          />
          <div className="hr-search-dialog-actions">
            <button type="button" className="hr-search-dialog-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="hr-search-dialog-submit">
              Search
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
