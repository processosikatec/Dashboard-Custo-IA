'use client';

import { C } from '@/lib/palette';

interface StatCardProps {
  label: string;
  value: string;
  fullValue?: string;
  sub?: string;
  delta?: { pct: number; vs: string; upIsGood?: boolean } | null;
  spark?: number[];
}

function Sparkline({ points }: { points: number[] }) {
  const w = 96;
  const h = 32;
  const max = Math.max(...points, 1);
  const step = w / (points.length - 1);
  const coords = points.map((v, i) => [i * step, h - 3 - (v / max) * (h - 6)]);
  const path = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const [lx, ly] = coords[coords.length - 1];

  return (
    <svg width={w} height={h} className="shrink-0" aria-hidden="true">
      <polyline
        points={path}
        fill="none"
        stroke={C.inkMuted}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lx} cy={ly} r="4" fill={C.accent} stroke={C.surface} strokeWidth="2" />
    </svg>
  );
}

export function StatCard({ label, value, fullValue, sub, delta, spark }: StatCardProps) {
  const deltaColor = delta
    ? (delta.pct >= 0) === (delta.upIsGood ?? false)
      ? C.good
      : C.bad
    : undefined;

  return (
    <div
      className="rounded-xl border p-5 flex flex-col gap-1"
      style={{ background: C.surface, borderColor: C.border }}
    >
      <p className="text-[13px] leading-tight" style={{ color: C.inkSecondary }}>
        {label}
      </p>
      <div className="flex items-end justify-between gap-3">
        <p
          className="text-[32px] leading-tight font-semibold tracking-tight"
          style={{ color: C.inkPrimary }}
          title={fullValue}
        >
          {value}
        </p>
        {spark && spark.some((v) => v > 0) && <Sparkline points={spark} />}
      </div>
      {delta && delta.pct !== null && (
        <p className="text-[13px] font-medium" style={{ color: deltaColor }}>
          {delta.pct >= 0 ? '↑' : '↓'} {Math.abs(delta.pct).toFixed(0)}%{' '}
          <span style={{ color: C.inkMuted, fontWeight: 400 }}>{delta.vs}</span>
        </p>
      )}
      {sub && !delta && (
        <p className="text-[13px]" style={{ color: C.inkMuted }}>
          {sub}
        </p>
      )}
    </div>
  );
}
