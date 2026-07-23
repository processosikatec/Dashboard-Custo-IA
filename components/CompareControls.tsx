'use client';

import { useEffect, useRef, useState } from 'react';
import { C } from '@/lib/palette';
import { CompareRangePicker } from './CompareRangePicker';
import { DateRange } from '@/lib/types';

export type CompareMode = 'off' | 'ontem' | 'custom';

interface CompareControlsProps {
  mode: CompareMode;
  onMode: (m: CompareMode) => void;
  range: DateRange | null;
  onRange: (r: DateRange) => void;
}

export function CompareControls({ mode, onMode, range, onRange }: CompareControlsProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setPickerOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onMode(mode === 'ontem' ? 'off' : 'ontem')}
        className="px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors"
        style={
          mode === 'ontem'
            ? { background: 'rgba(255,255,255,0.12)', color: C.inkPrimary }
            : { color: C.inkMuted }
        }
      >
        Comparar com ontem
      </button>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setPickerOpen((v) => !v)}
          className="px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors"
          style={
            mode === 'custom'
              ? { background: 'rgba(255,255,255,0.12)', color: C.inkPrimary }
              : { color: C.inkMuted }
          }
        >
          {mode === 'custom' && range
            ? `${range.start.toLocaleDateString('pt-BR')} – ${range.end.toLocaleDateString('pt-BR')}`
            : 'Personalizado'}
        </button>
        {pickerOpen && (
          <CompareRangePicker
            compareRange={range}
            onCompareRange={onRange}
            onApplied={() => {
              onMode('custom');
              setPickerOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
