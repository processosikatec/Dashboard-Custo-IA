'use client';

import { C } from '@/lib/palette';
import { fmtInt, fmtUSD, tempoRelativo } from '@/lib/format';
import { TokenRecord } from '@/lib/types';

interface TopExecucoesProps {
  execucoes: (TokenRecord & { custo: number })[];
  colorMap: Map<string, string>;
}

export function TopExecucoes({ execucoes, colorMap }: TopExecucoesProps) {
  const max = Math.max(...execucoes.map((e) => e.custo), 0.0001);

  return (
    <div className="rounded-xl border p-5" style={{ background: C.surface, borderColor: C.border }}>
      <h3 className="text-[15px] font-semibold mb-1" style={{ color: C.inkPrimary }}>
        Execuções mais caras
      </h3>
      <p className="text-[12px] mb-4" style={{ color: C.inkMuted }}>
        Top 10 do período — ajuda a achar picos e outliers
      </p>

      <div className="flex flex-col">
        {execucoes.map((e, i) => (
          <div
            key={e.id}
            className="flex items-center gap-3 py-2 border-b last:border-b-0"
            style={{ borderColor: C.grid }}
          >
            <span
              className="text-[12px] w-4 text-right tabular-nums shrink-0"
              style={{ color: C.inkMuted }}
            >
              {i + 1}
            </span>
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: colorMap.get(e.fluxo) || C.inkMuted }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] truncate" style={{ color: C.inkSecondary }} title={e.fluxo}>
                  {e.fluxo}
                </span>
                <span className="text-[13px] font-semibold shrink-0 tabular-nums" style={{ color: C.inkPrimary }}>
                  {fmtUSD.format(e.custo)}
                </span>
              </div>
              <div className="h-1 rounded-full mt-1 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(e.custo / max) * 100}%`, background: colorMap.get(e.fluxo) || C.inkMuted }}
                />
              </div>
            </div>
            <span className="text-[12px] w-16 text-right shrink-0 tabular-nums" style={{ color: C.inkMuted }}>
              {fmtInt.format(e.tokens)}
            </span>
            <span className="text-[12px] w-14 text-right shrink-0" style={{ color: C.inkMuted }}>
              {tempoRelativo(e.created_at)}
            </span>
          </div>
        ))}

        {execucoes.length === 0 && (
          <p className="text-[13px] py-8 text-center" style={{ color: C.inkMuted }}>
            Sem execuções no período
          </p>
        )}
      </div>
    </div>
  );
}
