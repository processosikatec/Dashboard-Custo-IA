'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { C } from '@/lib/palette';
import { fmtCompact, fmtInt } from '@/lib/format';

interface HoraDistribuicaoProps {
  data: { hora: number; tokens: number }[];
}

function Tip({ active, payload }: { active?: boolean; payload?: { payload: { hora: number; tokens: number } }[] }) {
  if (!active || !payload?.length) return null;
  const { hora, tokens } = payload[0].payload;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-[13px] shadow-lg"
      style={{ background: C.surface, borderColor: C.border, color: C.inkPrimary }}
    >
      <p style={{ color: C.inkMuted }}>{String(hora).padStart(2, '0')}h – {String((hora + 1) % 24).padStart(2, '0')}h</p>
      <p className="font-semibold">{fmtInt.format(tokens)} tokens</p>
    </div>
  );
}

export function HoraDistribuicao({ data }: HoraDistribuicaoProps) {
  const max = Math.max(...data.map((d) => d.tokens), 1);
  const picoHora = data.reduce((a, b) => (b.tokens > a.tokens ? b : a), data[0]);

  return (
    <div className="rounded-xl border p-5" style={{ background: C.surface, borderColor: C.border }}>
      <h3 className="text-[15px] font-semibold mb-1" style={{ color: C.inkPrimary }}>
        Consumo por horário do dia
      </h3>
      <p className="text-[12px] mb-4" style={{ color: C.inkMuted }}>
        {picoHora?.tokens > 0
          ? `Pico às ${String(picoHora.hora).padStart(2, '0')}h — soma todos os dias do período`
          : 'Sem dados no período'}
      </p>

      <ResponsiveContainer width="100%" height={200}>
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
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="tokens" radius={[4, 4, 0, 0]} maxBarSize={24}>
            {data.map((d) => (
              <Cell key={d.hora} fill={C.accent} fillOpacity={0.35 + 0.65 * (d.tokens / max)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
