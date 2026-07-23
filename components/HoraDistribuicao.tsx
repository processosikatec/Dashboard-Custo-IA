'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { C } from '@/lib/palette';
import { fmtCompact, fmtInt } from '@/lib/format';
import { DateRange, HoraPoint } from '@/lib/types';
import { CompareControls, CompareMode } from './CompareControls';

interface HoraDistribuicaoProps {
  data: HoraPoint[];
  compareMode: CompareMode;
  onCompareMode: (m: CompareMode) => void;
  compareRange: DateRange | null;
  onCompareRange: (r: DateRange) => void;
}

function Tip({
  active,
  payload,
  hasComparacao,
}: {
  active?: boolean;
  payload?: { payload: HoraPoint }[];
  hasComparacao: boolean;
}) {
  if (!active || !payload?.length) return null;
  const { hora, tokens, tokensComparacao } = payload[0].payload;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-[13px] shadow-lg"
      style={{ background: C.surface, borderColor: C.border, color: C.inkPrimary }}
    >
      <p style={{ color: C.inkMuted }} className="mb-1">
        {String(hora).padStart(2, '0')}h – {String((hora + 1) % 24).padStart(2, '0')}h
      </p>
      <p className="font-semibold">{fmtInt.format(tokens)} tokens</p>
      {hasComparacao && (
        <p style={{ color: C.inkMuted }}>{fmtInt.format(tokensComparacao || 0)} tokens (comparação)</p>
      )}
    </div>
  );
}

export function HoraDistribuicao({
  data,
  compareMode,
  onCompareMode,
  compareRange,
  onCompareRange,
}: HoraDistribuicaoProps) {
  const hasComparacao = compareMode !== 'off';
  const max = Math.max(...data.map((d) => Math.max(d.tokens, d.tokensComparacao || 0)), 1);
  const picoHora = data.reduce((a, b) => (b.tokens > a.tokens ? b : a), data[0]);

  return (
    <div className="rounded-xl border p-5" style={{ background: C.surface, borderColor: C.border }}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
        <h3 className="text-[15px] font-semibold" style={{ color: C.inkPrimary }}>
          Consumo por horário do dia
        </h3>
        <CompareControls mode={compareMode} onMode={onCompareMode} range={compareRange} onRange={onCompareRange} />
      </div>

      <p className="text-[12px] mb-4" style={{ color: C.inkMuted }}>
        {picoHora?.tokens > 0
          ? `Pico às ${String(picoHora.hora).padStart(2, '0')}h — soma todos os dias do período`
          : 'Sem dados no período'}
      </p>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={C.grid} strokeWidth={1} vertical={false} />
          <XAxis
            dataKey="hora"
            tickFormatter={(h: number) => `${h}h`}
            tick={{ fill: C.inkMuted, fontSize: 11 }}
            axisLine={{ stroke: C.baseline }}
            tickLine={false}
            interval={1}
          />
          <YAxis
            tick={{ fill: C.inkMuted, fontSize: 12 }}
            tickFormatter={(v: number) => (v === 0 ? '0' : fmtCompact.format(v))}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip content={<Tip hasComparacao={hasComparacao} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          {hasComparacao && (
            <Legend
              wrapperStyle={{ fontSize: 12, color: C.inkSecondary, paddingTop: 8 }}
              iconType="circle"
              iconSize={8}
            />
          )}
          <Bar dataKey="tokens" name="Período atual" radius={[4, 4, 0, 0]} maxBarSize={hasComparacao ? 14 : 24}>
            {data.map((d) => (
              <Cell key={d.hora} fill={C.accent} fillOpacity={0.35 + 0.65 * (d.tokens / max)} />
            ))}
          </Bar>
          {hasComparacao && (
            <Bar
              dataKey="tokensComparacao"
              name="Comparação"
              radius={[4, 4, 0, 0]}
              maxBarSize={14}
              fill={C.inkMuted}
              fillOpacity={0.5}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
