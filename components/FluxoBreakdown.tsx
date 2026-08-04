'use client';

import { C } from '@/lib/palette';
import { fmtCompact, fmtInt, fmtUSD } from '@/lib/format';
import { FluxoStat } from '@/lib/types';

export function FluxoBreakdown({ stats }: { stats: FluxoStat[] }) {
  const max = Math.max(...stats.map((s) => s.tokens), 1);

  return (
    <div
      className="rounded-xl border p-5"
      style={{ background: C.surface, borderColor: C.border }}
    >
      <div className="flex items-baseline justify-between mb-5">
        <h3 className="text-[15px] font-semibold" style={{ color: C.inkPrimary }}>
          Gasto por fluxo
        </h3>
        <span className="text-[13px]" style={{ color: C.inkMuted }}>
          {stats.length} fluxos
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {stats.map((s) => (
          <div
            key={s.fluxo}
            title={`${fmtInt.format(s.tokens)} tokens · ${s.count} execuções · ${fmtUSD.format(s.custo / (s.count || 1))} por execução`}
          >
            <div className="flex items-baseline justify-between gap-3 mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: s.color }}
                />
                <span
                  className="text-[13px] font-medium truncate"
                  style={{ color: C.inkPrimary }}
                >
                  {s.fluxo}
                </span>
                <span className="text-[12px] shrink-0" style={{ color: C.inkMuted }}>
                  {fmtUSD.format(s.custo / (s.count || 1))}/exec.
                </span>
              </div>
              <div className="flex items-baseline gap-3 shrink-0 text-[13px]">
                <span style={{ color: C.inkSecondary }}>
                  {fmtCompact.format(s.tokens)} tokens
                </span>
                <span className="font-semibold" style={{ color: C.inkPrimary }}>
                  {fmtUSD.format(s.custo)}
                </span>
                <span className="w-10 text-right" style={{ color: C.inkMuted }}>
                  {s.percentage.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="h-[10px] rounded-r-[4px] overflow-hidden" style={{ background: 'transparent' }}>
              <div
                className="h-full rounded-r-[4px] transition-[width] duration-500"
                style={{
                  width: `${Math.max((s.tokens / max) * 100, 1)}%`,
                  background: s.color,
                }}
              />
            </div>
          </div>
        ))}

        {stats.length === 0 && (
          <p className="text-[13px] py-8 text-center" style={{ color: C.inkMuted }}>
            Sem dados no período selecionado
          </p>
        )}
      </div>
    </div>
  );
}
