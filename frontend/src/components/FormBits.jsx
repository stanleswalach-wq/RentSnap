import React from "react";

export function Field({ label, testid, children }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider font-semibold text-ink/70 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

export const inputCls =
  "w-full bg-white border border-ink/20 rounded px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-accent placeholder:text-ink/35 transition-colors";

export function TextInput({ testid, ...props }) {
  return <input data-testid={testid} className={inputCls} {...props} />;
}

export function SectionTitle({ children }) {
  return (
    <h3 className="font-display uppercase text-lg text-accent tracking-tight pt-6 pb-2">
      {children}
    </h3>
  );
}

export function PresetChips({ options = [], onPick }) {
  // Bezpieczna tablica – zapobiega błędom, gdy opcje jeszcze się nie załadowały lub są puste
  const safeOptions = Array.isArray(options) ? options : [];

  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {safeOptions.map((o) => (
        <button
          key={o.label || o.value}
          type="button"
          onClick={() => onPick(o.value)}
          className="text-[11px] font-semibold bg-cream border border-ink/15 rounded px-2.5 py-1 hover:border-accent hover:text-accent transition-colors"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}