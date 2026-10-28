'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { C } from '@/lib/palette';
import { fmtInt, fmtUSD } from '@/lib/format';
import { GastoDiaPoint } from '@/lib/types';

const JANELAS = [7, 14, 30];

interface GastoDiarioProps {
  data: GastoDiaPoint[];
  colorMap: Map<string, string>;
  dias: number;
  onDias: (d: number) => void;
}

type Row = Record<string, string | number | null> & { custo: number; anterior: number | null; execucoes: number };

function Tip({
  active,
  payload,
  label,
  fluxos,
  colorMap,
}: {
  active?: boolean;
  payload?: { payload: Row }[];
  label?: string;
  fluxos: string[];
  colorMap: Map<string, string>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const itens = fluxos
    .map((f) => ({ f, v: Number(row[f]) || 0 }))
    .filter((i) => i.v > 0)
    .sort((a, b) => b.v - a.v);
  const diff = row.anterior !== null ? row.custo - row.anterior : null;

  return (
    <div
      className="rounded-lg border px-3 py-2 text-[13px] shadow-lg min-w-[200px]"
      style={{ background: C.surface, borderColor: C.border, color: C.inkPrimary }}
    >
      <p style={{ color: C.inkMuted }} className="mb-1.5">
        {label} · {fmtInt.format(row.execucoes)} execuções
      </p>
      <div className="flex flex-col gap-1">
        {itens.map(({ f, v }) => (
          <div key={f} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colorMap.get(f) || C.inkMuted }} />
              <span style={{ color: C.inkSecondary }} className="truncate">{f}</span>
            </span>
            <span className="font-medium shrink-0">{fmtUSD.format(v)}</span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 pt-1.5 border-t flex items-center justify-between gap-4" style={{ borderColor: C.grid }}>
        <span style={{ color: C.inkMuted }}>Total do dia</span>
        <span className="font-semibold">{fmtUSD.format(row.custo)}</span>
      </div>
      {diff !== null && (
        <div className="flex items-center justify-between gap-4">
          <span style={{ color: C.inkMuted }}>vs. dia anterior</span>
          <span style={{ color: diff > 0 ? C.bad : diff < 0 ? C.good : C.inkMuted }}>
            {diff > 0 ? '+' : diff < 0 ? '−' : ''}
            {fmtUSD.format(Math.abs(diff))}
            {row.anterior && row.anterior > 0 ? ` (${diff > 0 ? '+' : diff < 0 ? '−' : ''}${Math.abs((diff / row.anterior) * 100).toFixed(1)}%)` : ''}
          </span>
        </div>
      )}
    </div>
  );
}

export function GastoDiario({ data, colorMap, dias, onDias }: GastoDiarioProps) {
  // Fluxos presentes na janela, na ordem do colorMap (maior volume embaixo da pilha);
  // "Outros" sempre no topo.
  const fluxos = useMemo(() => {
    const presentes = new Set<string>();
    data.forEach((p) => Object.keys(p.fluxosCusto).forEach((f) => presentes.add(f)));
    const ordem = [...colorMap.keys()];
    return [...presentes].sort((a, b) => {
      const ia = ordem.indexOf(a);
      const ib = ordem.indexOf(b);
      return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
    });
  }, [data, colorMap]);

  const rows: Row[] = useMemo(
    () =>
      data.map((p, i) => {
        const row: Row = {
          label: p.label,
          custo: p.custo,
          execucoes: p.execucoes,
          anterior: i > 0 ? data[i - 1].custo : null,
        };
        fluxos.forEach((f) => {
          row[f] = p.fluxosCusto[f] || 0;
        });
        return row;
      }),
    [data, fluxos],
  );

  // Média só dos dias fechados — hoje ainda está em andamento e puxaria a média pra baixo.
  // Ignora também os dias zerados antes do primeiro registro da janela.
  const primeiro = data.findIndex((p) => p.custo > 0);
  const fechados = primeiro === -1 ? [] : data.slice(primeiro, -1);
  const media = fechados.length ? fechados.reduce((s, p) => s + p.custo, 0) / fechados.length : 0;
  const total = data.reduce((s, p) => s + p.custo, 0);
  const pico = data.reduce((a, b) => (b.custo > a.custo ? b : a), data[0]);

  return (
    <div className="rounded-xl border p-5" style={{ background: C.surface, borderColor: C.border }}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
        <h3 className="text-[15px] font-semibold" style={{ color: C.inkPrimary }}>
          Gasto por dia
        </h3>
        <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
          {JANELAS.map((d) => (
            <button
              key={d}
              onClick={() => onDias(d)}
              className="px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors"
              style={dias === d ? { background: 'rgba(255,255,255,0.12)', color: C.inkPrimary } : { color: C.inkMuted }}
            >
              {d} dias
            </button>
          ))}
        </div>
      </div>

      <p className="text-[12px] mb-4" style={{ color: C.inkMuted }}>
        {total > 0
          ? `${fmtUSD.format(total)} em ${dias} dias · média ${fmtUSD.format(media)}/dia (dias fechados) · pico ${pico.label} com ${fmtUSD.format(pico.custo)}`
          : 'Sem gasto na janela'}
      </p>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={C.grid} strokeWidth={1} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: C.inkMuted, fontSize: 11 }}
            axisLine={{ stroke: C.baseline }}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            tick={{ fill: C.inkMuted, fontSize: 12 }}
            tickFormatter={(v: number) => (v === 0 ? '0' : fmtUSD.format(v))}
            axisLine={false}
            tickLine={false}
            width={64}
          />
          <Tooltip content={<Tip fluxos={fluxos} colorMap={colorMap} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          {media > 0 && (
            <ReferenceLine
              y={media}
              stroke={C.inkMuted}
              strokeDasharray="4 4"
              label={{ value: 'média', position: 'insideTopRight', fill: C.inkMuted, fontSize: 11 }}
            />
          )}
          {fluxos.map((f, i) => (
            <Bar
              key={f}
              dataKey={f}
              stackId="custo"
              fill={colorMap.get(f) || C.inkMuted}
              maxBarSize={28}
              radius={i === fluxos.length - 1 ? [4, 4, 0, 0] : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
