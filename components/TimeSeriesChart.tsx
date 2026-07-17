'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { C } from '@/lib/palette';
import { fmtCompact, fmtInt, fmtBRL } from '@/lib/format';
import { CUSTO_POR_MILHAO_BRL } from '@/lib/config';
import { SeriesPoint } from '@/lib/types';

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const tokens = payload[0].value;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-[13px] shadow-lg"
      style={{ background: C.surface, borderColor: C.border, color: C.inkPrimary }}
    >
      <p style={{ color: C.inkMuted }}>{label}</p>
      <p className="font-semibold">{fmtInt.format(tokens)} tokens</p>
      <p style={{ color: C.inkSecondary }}>
        {fmtBRL.format((tokens / 1_000_000) * CUSTO_POR_MILHAO_BRL)}
      </p>
    </div>
  );
}

export function TimeSeriesChart({ data, title }: { data: SeriesPoint[]; title: string }) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{ background: C.surface, borderColor: C.border }}
    >
      <h3 className="text-[15px] font-semibold mb-4" style={{ color: C.inkPrimary }}>
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="tokenFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.accent} stopOpacity={0.18} />
              <stop offset="100%" stopColor={C.accent} stopOpacity={0.02} />
            </linearGradient>
          </defs>
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
            tickFormatter={(v: number) => (v === 0 ? '0' : fmtCompact.format(v))}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: C.baseline, strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="tokens"
            stroke={C.accent}
            strokeWidth={2}
            fill="url(#tokenFill)"
            dot={false}
            activeDot={{ r: 4, fill: C.accent, stroke: C.surface, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
