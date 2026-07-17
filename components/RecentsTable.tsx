'use client';

import { C } from '@/lib/palette';
import { fmtInt, tempoRelativo } from '@/lib/format';
import { TokenRecord } from '@/lib/types';

interface RecentsTableProps {
  records: TokenRecord[];
  colorMap: Map<string, string>;
}

export function RecentsTable({ records, colorMap }: RecentsTableProps) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{ background: C.surface, borderColor: C.border }}
    >
      <h3 className="text-[15px] font-semibold mb-4" style={{ color: C.inkPrimary }}>
        Últimas execuções
      </h3>
      <div className="flex flex-col">
        {records.slice(0, 9).map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-3 py-2.5 border-b last:border-b-0"
            style={{ borderColor: C.grid }}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: colorMap.get(r.fluxo) || C.inkMuted }}
            />
            <span
              className="text-[13px] truncate flex-1 min-w-0"
              style={{ color: C.inkSecondary }}
              title={r.fluxo}
            >
              {r.fluxo}
            </span>
            <span
              className="text-[13px] font-medium shrink-0"
              style={{ color: C.inkPrimary, fontVariantNumeric: 'tabular-nums' }}
            >
              {fmtInt.format(r.tokens)}
            </span>
            <span
              className="text-[12px] w-16 text-right shrink-0"
              style={{ color: C.inkMuted }}
            >
              {tempoRelativo(r.created_at)}
            </span>
          </div>
        ))}

        {records.length === 0 && (
          <p className="text-[13px] py-8 text-center" style={{ color: C.inkMuted }}>
            Nenhuma execução no período
          </p>
        )}
      </div>
    </div>
  );
}
