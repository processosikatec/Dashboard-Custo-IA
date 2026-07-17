'use client';

import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { C } from '@/lib/palette';
import { fmtCompact, fmtInt, fmtBRL } from '@/lib/format';
import { SeriesPoint, Metric } from '@/lib/types';

interface TimeSeriesChartProps {
  data: SeriesPoint[];
  title: string;
  fluxos: string[];
  colorMap: Map<string, string>;
  compareEnabled: boolean;
}

function fmtValue(v: number, metric: Metric) {
  return metric === 'custo' ? fmtBRL.format(v) : `${fmtInt.format(v)} tokens`;
}

function ChartTooltip({
  active,
  payload,
  label,
  metric,
  fluxos,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
  label?: string;
  metric: Metric;
  fluxos: string[];
}) {
  if (!active || !payload?.length) return null;
  const total = payload
    .filter((p) => fluxos.includes(p.dataKey))
    .reduce((s, p) => s + (p.value || 0), 0);
  const anterior = payload.find((p) => p.dataKey === 'anteriorValor');

  return (
    <div
      className="rounded-lg border px-3 py-2 text-[13px] shadow-lg min-w-[180px]"
      style={{ background: C.surface, borderColor: C.border, color: C.inkPrimary }}
    >
      <p style={{ color: C.inkMuted }} className="mb-1.5">{label}</p>
      <div className="flex flex-col gap-1">
        {payload
          .filter((p) => fluxos.includes(p.dataKey))
          .sort((a, b) => b.value - a.value)
          .map((p) => (
            <div key={p.dataKey} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                <span style={{ color: C.inkSecondary }} className="truncate">{p.dataKey}</span>
              </span>
              <span className="font-medium shrink-0">{fmtValue(p.value || 0, metric)}</span>
            </div>
          ))}
      </div>
      <div className="mt-1.5 pt-1.5 border-t flex items-center justify-between gap-4" style={{ borderColor: C.grid }}>
        <span style={{ color: C.inkMuted }}>Total</span>
        <span className="font-semibold">{fmtValue(total, metric)}</span>
      </div>
      {anterior && (
        <div className="flex items-center justify-between gap-4" style={{ color: C.inkMuted }}>
          <span>Período anterior</span>
          <span>{fmtValue(anterior.value || 0, metric)}</span>
        </div>
      )}
    </div>
  );
}

export function TimeSeriesChart({ data, title, fluxos, colorMap, compareEnabled }: TimeSeriesChartProps) {
  const [metric, setMetric] = useState<Metric>('tokens');

  // Expande cada ponto com uma chave por fluxo (em tokens ou em custo real) + o total do período anterior.
  const chartData = useMemo(() => {
    return data.map((p) => {
      const row: Record<string, string | number> = { label: p.label };
      const porFluxo = metric === 'custo' ? p.fluxosCusto : p.fluxos;
      fluxos.forEach((f) => {
        row[f] = porFluxo[f] || 0;
      });
      const anterior = metric === 'custo' ? p.custoAnterior : p.tokensAnterior;
      if (anterior !== undefined) {
        row.anteriorValor = anterior;
      }
      return row;
    });
  }, [data, fluxos, metric]);

  const showLegend = fluxos.length >= 2;
  const visibleFluxos = fluxos.slice(0, 6);
  const overflowCount = fluxos.length - visibleFluxos.length;

  return (
    <div className="rounded-xl border p-5" style={{ background: C.surface, borderColor: C.border }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-[15px] font-semibold" style={{ color: C.inkPrimary }}>
          {title}
        </h3>
        <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
          {(['tokens', 'custo'] as Metric[]).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className="px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors"
              style={
                metric === m
                  ? { background: 'rgba(255,255,255,0.12)', color: C.inkPrimary }
                  : { color: C.inkMuted }
              }
            >
              {m === 'tokens' ? 'Tokens' : 'Custo (R$)'}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={C.grid} strokeWidth={1} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: C.inkMuted, fontSize: 12 }}
            axisLine={{ stroke: C.baseline }}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={32}
          />
          <YAxis
            tick={{ fill: C.inkMuted, fontSize: 12 }}
            tickFormatter={(v: number) =>
              v === 0 ? '0' : metric === 'custo' ? fmtBRL.format(v) : fmtCompact.format(v)
            }
            axisLine={false}
            tickLine={false}
            width={metric === 'custo' ? 64 : 48}
          />
          <Tooltip
            content={<ChartTooltip metric={metric} fluxos={visibleFluxos} />}
            cursor={{ stroke: C.baseline, strokeWidth: 1 }}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: 12, color: C.inkSecondary, paddingTop: 12 }}
              iconType="circle"
              iconSize={8}
            />
          )}
          {compareEnabled && (
            <Line
              type="monotone"
              dataKey="anteriorValor"
              name="Período anterior"
              stroke={C.inkMuted}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              legendType="none"
            />
          )}
          {visibleFluxos.map((f) => (
            <Line
              key={f}
              type="monotone"
              dataKey={f}
              name={f}
              stroke={colorMap.get(f) || C.accent}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: C.surface }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {overflowCount > 0 && (
        <p className="text-[12px] mt-2" style={{ color: C.inkMuted }}>
          +{overflowCount} outro(s) fluxo(s) somados no total — veja o detalhamento abaixo.
        </p>
      )}
    </div>
  );
}
