'use client';

import { useState } from 'react';
import { C } from '@/lib/palette';
import { DateRange } from '@/lib/types';

function toInputDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface CompareRangePickerProps {
  compareRange: DateRange | null;
  onCompareRange: (r: DateRange) => void;
  onApplied: () => void;
}

export function CompareRangePicker({ compareRange, onCompareRange, onApplied }: CompareRangePickerProps) {
  const today = toInputDate(new Date());
  const [start, setStart] = useState(compareRange ? toInputDate(compareRange.start) : today);
  const [end, setEnd] = useState(compareRange ? toInputDate(compareRange.end) : today);

  return (
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
        onClick={() => {
          onCompareRange({ start: new Date(`${start}T00:00:00`), end: new Date(`${end}T23:59:59.999`) });
          onApplied();
        }}
        className="mt-1 px-3 py-1.5 rounded-lg text-[13px] font-medium"
        style={{ background: C.accent, color: '#fff' }}
      >
        Aplicar
      </button>
    </div>
  );
}
