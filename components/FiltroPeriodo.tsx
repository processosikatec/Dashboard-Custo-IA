'use client';

import { useEffect, useRef, useState } from 'react';
import { C } from '@/lib/palette';
import { DateRange, Period } from '@/lib/types';

const PRESETS: { key: Exclude<Period, 'custom'>; label: string }[] = [
  { key: 'hoje', label: 'Hoje' },
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: 'tudo', label: 'Tudo' },
];

function toInputDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface FiltroPeriodoProps {
  period: Period;
  onPeriod: (p: Period) => void;
  customRange: DateRange | null;
  onCustomRange: (r: DateRange) => void;
  compareEnabled: boolean;
  onCompareToggle: (v: boolean) => void;
}

export function FiltroPeriodo({
  period,
  onPeriod,
  customRange,
  onCustomRange,
  compareEnabled,
  onCompareToggle,
}: FiltroPeriodoProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const today = toInputDate(new Date());
  const [start, setStart] = useState(customRange ? toInputDate(customRange.start) : today);
  const [end, setEnd] = useState(customRange ? toInputDate(customRange.end) : today);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function apply() {
    const s = new Date(`${start}T00:00:00`);
    const e = new Date(`${end}T23:59:59.999`);
    onCustomRange({ start: s, end: e });
    onPeriod('custom');
    setOpen(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => onPeriod(p.key)}
            className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors"
            style={
              period === p.key
                ? { background: 'rgba(255,255,255,0.10)', color: C.inkPrimary }
                : { color: C.inkMuted }
            }
          >
            {p.label}
          </button>
        ))}

        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors"
            style={
              period === 'custom'
                ? { background: 'rgba(255,255,255,0.10)', color: C.inkPrimary }
                : { color: C.inkMuted }
            }
          >
            {period === 'custom' && customRange
              ? `${customRange.start.toLocaleDateString('pt-BR')} – ${customRange.end.toLocaleDateString('pt-BR')}`
              : 'Personalizado'}
          </button>

          {open && (
            <div
              className="absolute z-20 mt-1.5 right-0 rounded-lg border shadow-xl p-3 flex flex-col gap-2"
              style={{ background: C.surface, borderColor: C.border }}
            >
              <label className="flex items-center justify-between gap-3 text-[13px]" style={{ color: C.inkSecondary }}>
                Início
                <input
                  type="date"
                  value={start}
                  max={end}
                  onChange={(e) => setStart(e.target.value)}
                  className="rounded px-2 py-1 text-[13px]"
                  style={{ background: 'rgba(255,255,255,0.06)', color: C.inkPrimary, border: `1px solid ${C.border}` }}
                />
              </label>
              <label className="flex items-center justify-between gap-3 text-[13px]" style={{ color: C.inkSecondary }}>
                Fim
                <input
                  type="date"
                  value={end}
                  min={start}
                  max={today}
                  onChange={(e) => setEnd(e.target.value)}
                  className="rounded px-2 py-1 text-[13px]"
                  style={{ background: 'rgba(255,255,255,0.06)', color: C.inkPrimary, border: `1px solid ${C.border}` }}
                />
              </label>
              <button
                onClick={apply}
                className="mt-1 px-3 py-1.5 rounded-lg text-[13px] font-medium"
                style={{ background: C.accent, color: '#fff' }}
              >
                Aplicar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="w-px h-5 mx-1" style={{ background: C.border }} />

      <button
        onClick={() => onCompareToggle(!compareEnabled)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-colors"
        style={{
          borderColor: C.border,
          color: compareEnabled ? C.inkPrimary : C.inkMuted,
          background: compareEnabled ? 'rgba(255,255,255,0.06)' : 'transparent',
        }}
      >
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: compareEnabled ? C.accent : C.inkMuted }}
        />
        Comparar com período anterior
      </button>
    </div>
  );
}
