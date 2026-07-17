'use client';

import { useState } from 'react';
import { useTokens } from '@/hooks/useTokens';
import { StatCard } from '@/components/StatCard';
import { TimeSeriesChart } from '@/components/TimeSeriesChart';
import { FluxoBreakdown } from '@/components/FluxoBreakdown';
import { RecentsTable } from '@/components/RecentsTable';
import { C } from '@/lib/palette';
import { fmtCompact, fmtInt, fmtBRL } from '@/lib/format';
import { CUSTO_POR_MILHAO_BRL } from '@/lib/config';
import { Period } from '@/lib/types';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'hoje', label: 'Hoje' },
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: 'tudo', label: 'Tudo' },
];

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>('hoje');
  const { records, fluxoStats, kpis, series, sparkline, colorMap, loading, error, lastUpdate } =
    useTokens(period);

  const periodLabel = PERIODS.find((p) => p.key === period)?.label.toLowerCase();

  return (
    <div className="min-h-screen" style={{ background: C.page }}>
      {/* Header */}
      <header
        className="border-b"
        style={{ background: C.surface, borderColor: C.border }}
      >
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight" style={{ color: C.inkPrimary }}>
              Painel de Gastos IA
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: C.inkMuted }}>
              Consumo de tokens dos fluxos n8n em tempo real
            </p>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdate && (
              <span className="text-[12px]" style={{ color: C.inkMuted }}>
                Atualizado às {lastUpdate.toLocaleTimeString('pt-BR')}
              </span>
            )}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
              style={{ borderColor: C.border }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: C.good }}
              />
              <span className="text-[12px] font-medium" style={{ color: C.inkSecondary }}>
                Tempo real
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-5">
        {error && (
          <div
            className="rounded-xl border px-4 py-3 text-[13px]"
            style={{ borderColor: C.bad, color: C.bad, background: C.surface }}
          >
            Erro ao carregar dados: {error}
          </div>
        )}

        {/* Filtro de período — escopa todos os cards abaixo */}
        <div className="flex items-center gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors"
              style={
                period === p.key
                  ? { background: 'rgba(255,255,255,0.10)', color: C.inkPrimary }
                  : { color: C.inkMuted }
              }
            >
              {p.label}
            </button>
          ))}
        </div>

        <div
          className="flex flex-col gap-5 transition-opacity"
          style={{ opacity: loading ? 0.5 : 1 }}
        >
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label={`Gasto estimado (${periodLabel})`}
              value={fmtBRL.format(kpis.custo)}
              sub={`${fmtBRL.format(CUSTO_POR_MILHAO_BRL)} por 1M tokens`}
            />
            <StatCard
              label={`Tokens consumidos (${periodLabel})`}
              value={fmtCompact.format(kpis.totalTokens)}
              fullValue={fmtInt.format(kpis.totalTokens)}
              sub={`${fmtInt.format(kpis.execucoes)} execuções`}
            />
            <StatCard
              label="Tokens hoje"
              value={fmtCompact.format(kpis.hoje)}
              fullValue={fmtInt.format(kpis.hoje)}
              delta={
                kpis.deltaPct !== null
                  ? { pct: kpis.deltaPct, vs: 'vs. ontem', upIsGood: false }
                  : null
              }
              spark={sparkline}
            />
            <StatCard
              label="Fluxos ativos"
              value={String(kpis.fluxosAtivos)}
              sub={periodLabel === 'hoje' ? 'no dia de hoje' : `no período (${periodLabel})`}
            />
          </div>

          {/* Tendência */}
          <TimeSeriesChart
            data={series}
            title={
              period === 'hoje'
                ? 'Consumo por hora — hoje'
                : 'Consumo por dia'
            }
          />

          {/* Breakdown + recentes */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-3">
              <FluxoBreakdown stats={fluxoStats} />
            </div>
            <div className="lg:col-span-2">
              <RecentsTable records={records} colorMap={colorMap} />
            </div>
          </div>
        </div>

        <footer className="pb-4">
          <p className="text-[12px]" style={{ color: C.inkMuted }}>
            Custo estimado: US$ 0,75 por milhão de tokens ({fmtBRL.format(CUSTO_POR_MILHAO_BRL)},
            dólar R$ 5,07) — ajuste em <code>lib/config.ts</code>.
          </p>
        </footer>
      </main>
    </div>
  );
}
