"use client";

export function PrintCalendarButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="motion-soft rounded-full bg-white/90 px-5 py-3 text-sm font-bold text-ink shadow-sm hover:bg-white"
    >
      Print or save as PDF
    </button>
  );
}
