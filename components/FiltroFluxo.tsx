'use client';

import { useEffect, useRef, useState } from 'react';
import { C } from '@/lib/palette';

interface FiltroFluxoProps {
  fluxos: string[];
  colorMap: Map<string, string>;
  selected: Set<string> | null; // null = todos
  onChange: (next: Set<string> | null) => void;
}

export function FiltroFluxo({ fluxos, colorMap, selected, onChange }: FiltroFluxoProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const allSelected = !selected || selected.size === 0;
  const label = allSelected
    ? 'Todos os fluxos'
    : selected.size === 1
      ? [...selected][0]
      : `${selected.size} fluxos`;

  function toggle(f: string) {
    const next = new Set(allSelected ? fluxos : selected);
    if (next.has(f)) next.delete(f);
    else next.add(f);
    if (next.size === 0 || next.size === fluxos.length) onChange(null);
    else onChange(next);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-medium border transition-colors"
        style={{
          borderColor: C.border,
          color: allSelected ? C.inkMuted : C.inkPrimary,
          background: allSelected ? 'transparent' : 'rgba(255,255,255,0.06)',
        }}
      >
        <span className="truncate max-w-[160px]">{label}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="shrink-0">
          <path d="M1 1L5 5L9 1" stroke={C.inkMuted} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute z-20 mt-1.5 rounded-lg border shadow-xl py-1.5 min-w-[220px] max-h-72 overflow-y-auto"
          style={{ background: C.surface, borderColor: C.border }}
        >
          <button
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-white/5 flex items-center justify-between"
            style={{ color: C.inkPrimary }}
          >
            Todos os fluxos
            {allSelected && <CheckIcon />}
          </button>
          <div className="my-1 border-t" style={{ borderColor: C.grid }} />
          {fluxos.map((f) => {
            const checked = allSelected || selected.has(f);
            return (
              <button
                key={f}
                onClick={() => toggle(f)}
                className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-white/5 flex items-center justify-between gap-2"
                style={{ color: C.inkPrimary }}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: colorMap.get(f) || C.inkMuted }}
                  />
                  <span className="truncate">{f}</span>
                </span>
                {checked && <CheckIcon />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <path d="M2.5 7L5.5 10L11.5 3.5" stroke={C.good} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
