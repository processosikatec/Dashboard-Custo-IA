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
import { fmtCompact, fmtInt, fmtUSD } from '@/lib/format';
import { SeriesPoint, Metric, DateRange } from '@/lib/types';
import { CompareControls, CompareMode } from './CompareControls';

interface TimeSeriesChartProps {
  data: SeriesPoint[];
  title: string;
  fluxos: string[];
  colorMap: Map<string, string>;
  compareMode: CompareMode;
  onCompareMode: (m: CompareMode) => void;
  compareRange: DateRange | null;
  onCompareRange: (r: DateRange) => void;
}

function fmtValue(v: number, metric: Metric) {
  return metric === 'custo' ? fmtUSD.format(v) : `${fmtInt.format(v)} tokens`;
}

function fmtDelta(atual: number, anterior: number, metric: Metric) {
  const diff = atual - anterior;
  const sinal = diff > 0 ? '+' : diff < 0 ? '−' : '';
  const abs = metric === 'custo' ? fmtUSD.format(Math.abs(diff)) : fmtInt.format(Math.abs(diff));
  const pct = anterior > 0 ? ` (${sinal}${Math.abs((diff / anterior) * 100).toFixed(1)}%)` : '';
  return { texto: `${sinal}${abs}${pct}`, cor: diff > 0 ? C.bad : diff < 0 ? C.good : C.inkMuted };
}

function ChartTooltip({
  active,
  payload,
  label,
  metric,
  fluxos,
  compareLabel,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string; payload: Record<string, string | number> }[];
  label?: string;
  metric: Metric;
  fluxos: string[];
  compareLabel: string;
}) {
  if (!active || !payload?.length) return null;
  // Total vem do ponto (todos os fluxos), não só das linhas visíveis — senão fluxos
  // fora do top 6 sumiriam do total e a comparação com o período anterior ficaria torta.
  const row = payload[0].payload;
  const total = Number(row.total) || 0;
  const anterior = row.anteriorValor !== undefined ? Number(row.anteriorValor) : null;
  const delta = anterior !== null ? fmtDelta(total, anterior, metric) : null;

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
      {anterior !== null && delta && (
        <>
          <div className="flex items-center justify-between gap-4" style={{ color: C.inkMuted }}>
            <span>
              {compareLabel}
              {row.labelAnterior ? ` (${row.labelAnterior})` : ''}
            </span>
            <span>{fmtValue(anterior, metric)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span style={{ color: C.inkMuted }}>Diferença</span>
            <span className="font-medium" style={{ color: delta.cor }}>
              {delta.texto}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export function TimeSeriesChart({
  data,
  title,
  fluxos,
  colorMap,
  compareMode,
  onCompareMode,
  compareRange,
  onCompareRange,
}: TimeSeriesChartProps) {
  const [metric, setMetric] = useState<Metric>('tokens');
  const compareEnabled = compareMode !== 'off';

  // Expande cada ponto com uma chave por fluxo (em tokens ou em custo real) + o total do período anterior.
  const chartData = useMemo(() => {
    return data.map((p) => {
      const row: Record<string, string | number> = {
        label: p.label,
        total: metric === 'custo' ? p.custo : p.tokens,
      };
      if (p.labelAnterior) row.labelAnterior = p.labelAnterior;
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

  const compareLabel = compareMode === 'ontem' ? 'Ontem' : 'Comparação';

  // Resumo do intervalo inteiro: soma só os pontos que têm par na comparação, para
  // comparar janelas equivalentes (ex.: hoje até 11h vs. ontem até 11h).
  const resumo = useMemo(() => {
    if (!compareEnabled) return null;
    let atual = 0;
    let anterior = 0;
    let pares = 0;
    data.forEach((p) => {
      const ant = metric === 'custo' ? p.custoAnterior : p.tokensAnterior;
      if (ant === undefined) return;
      atual += metric === 'custo' ? p.custo : p.tokens;
      anterior += ant;
      pares += 1;
    });
    return pares > 0 ? { atual, anterior, delta: fmtDelta(atual, anterior, metric) } : null;
  }, [compareEnabled, data, metric]);

  const showLegend = fluxos.length >= 2 || compareEnabled;
  const visibleFluxos = fluxos.slice(0, 6);
  const overflowCount = fluxos.length - visibleFluxos.length;

  return (
    <div className="rounded-xl border p-5" style={{ background: C.surface, borderColor: C.border }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-[15px] font-semibold" style={{ color: C.inkPrimary }}>
          {title}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <CompareControls
            mode={compareMode}
            onMode={onCompareMode}
            range={compareRange}
            onRange={onCompareRange}
          />
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
                {m === 'tokens' ? 'Tokens' : 'Custo (US$)'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {resumo && (
        <p className="text-[12px] -mt-2 mb-3" style={{ color: C.inkMuted }}>
          Total {fmtValue(resumo.atual, metric)} vs. {compareLabel.toLowerCase()} {fmtValue(resumo.anterior, metric)} no
          mesmo intervalo —{' '}
          <span className="font-medium" style={{ color: resumo.delta.cor }}>
            {resumo.delta.texto}
          </span>
        </p>
      )}

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
              v === 0 ? '0' : metric === 'custo' ? fmtUSD.format(v) : fmtCompact.format(v)
            }
            axisLine={false}
            tickLine={false}
            width={metric === 'custo' ? 64 : 48}
          />
          <Tooltip
            content={<ChartTooltip metric={metric} fluxos={visibleFluxos} compareLabel={compareLabel} />}
            cursor={{ stroke: C.baseline, strokeWidth: 1 }}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: 12, color: C.inkSecondary, paddingTop: 12 }}
              iconType="circle"
              iconSize={8}
            />
          )}
          {/* Na comparação, total contra total: a linha tracejada é a soma de todos os
              fluxos no intervalo anterior, então o par certo é o total atual, não cada fluxo. */}
          {compareEnabled && (
            <Line
              type="monotone"
              dataKey="total"
              name="Total"
              stroke={C.inkPrimary}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: C.surface }}
            />
          )}
          {compareEnabled && (
            <Line
              type="monotone"
              dataKey="anteriorValor"
              name={`Total ${compareLabel.toLowerCase()}`}
              stroke={C.inkMuted}
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0, fill: C.inkMuted }}
            />
          )}
          {visibleFluxos.map((f) => (
            <Line
              key={f}
              type="monotone"
              dataKey={f}
              name={f}
              stroke={colorMap.get(f) || C.accent}
              strokeWidth={compareEnabled ? 1.25 : 2}
              strokeOpacity={compareEnabled ? 0.45 : 1}
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
