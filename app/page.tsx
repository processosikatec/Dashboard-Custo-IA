'use client';

import { useTokens } from '@/hooks/useTokens';
import { StatCard } from '@/components/StatCard';
import { TimeSeriesChart } from '@/components/TimeSeriesChart';
import { FluxoBreakdown } from '@/components/FluxoBreakdown';
import { RecentsTable } from '@/components/RecentsTable';
import { TopExecucoes } from '@/components/TopExecucoes';
import { HoraDistribuicao } from '@/components/HoraDistribuicao';
import { FiltroFluxo } from '@/components/FiltroFluxo';
import { FiltroPeriodo } from '@/components/FiltroPeriodo';
import { C } from '@/lib/palette';
import { fmtCompact, fmtInt, fmtBRL } from '@/lib/format';
import { CUSTO_POR_MILHAO_BRL } from '@/lib/config';

const PERIOD_LABELS: Record<string, string> = {
  hoje: 'hoje',
  '7d': '7 dias',
  '30d': '30 dias',
  tudo: 'tudo',
  custom: 'período',
};

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      style={{ animation: spinning ? 'spin 0.8s linear infinite' : undefined }}
    >
      <path
        d="M12.25 7A5.25 5.25 0 1 1 10.5 3.06M12.25 1.75V4.9h-3.15"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Dashboard() {
  const {
    records,
    allFluxos,
    fluxoStats,
    kpis,
    series,
    sparkline,
    topExecucoes,
    horaDistribuicao,
    horaCompareMode,
    setHoraCompareMode,
    horaCompareRange,
    setHoraCompareRange,
    projecaoMensal,
    colorMap,
    loading,
    refreshing,
    error,
    lastUpdate,
    refetch,
    period,
    setPeriod,
    customRange,
    setCustomRange,
    selectedFluxos,
    setSelectedFluxos,
    compareEnabled,
    setCompareEnabled,
    range,
  } = useTokens();

  const periodLabel = PERIOD_LABELS[period] ?? period;
  const activeFluxos = fluxoStats.map((s) => s.fluxo);

  const chartTitle =
    range.end.getTime() - range.start.getTime() <= 36 * 3_600_000
      ? 'Consumo por hora'
      : 'Consumo por dia';

  return (
    <div className="min-h-screen" style={{ background: C.page }}>
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>

      {/* Header */}
      <header className="border-b" style={{ background: C.surface, borderColor: C.border }}>
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight" style={{ color: C.inkPrimary }}>
              Painel de Gastos IA
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: C.inkMuted }}>
              Consumo de tokens dos fluxos n8n
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdate && (
              <span className="text-[12px]" style={{ color: C.inkMuted }}>
                Atualizado às {lastUpdate.toLocaleTimeString('pt-BR')}
              </span>
            )}
            <button
              onClick={() => refetch()}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-[12px] font-medium transition-colors disabled:opacity-60"
              style={{ borderColor: C.border, color: C.inkSecondary }}
            >
              <RefreshIcon spinning={refreshing} />
              {refreshing ? 'Atualizando…' : 'Atualizar'}
            </button>
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

        {/* Filtros — escopam todos os cards abaixo */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FiltroPeriodo
            period={period}
            onPeriod={setPeriod}
            customRange={customRange}
            onCustomRange={setCustomRange}
            compareEnabled={compareEnabled}
            onCompareToggle={setCompareEnabled}
          />
          <FiltroFluxo
            fluxos={allFluxos}
            colorMap={colorMap}
            selected={selectedFluxos}
            onChange={setSelectedFluxos}
          />
        </div>

        <div className="flex flex-col gap-5 transition-opacity" style={{ opacity: loading ? 0.5 : 1 }}>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label={`Gasto ${kpis.precisaoExata > 0.99 ? '' : 'estimado '}(${periodLabel})`}
              value={fmtBRL.format(kpis.custo)}
              delta={
                kpis.periodoDeltaPct !== null
                  ? { pct: kpis.periodoDeltaPct, vs: 'vs. período anterior', upIsGood: false }
                  : null
              }
              sub={
                kpis.periodoDeltaPct !== null
                  ? undefined
                  : kpis.precisaoExata > 0.99
                    ? 'preço exato (input/output)'
                    : kpis.precisaoExata > 0
                      ? `${Math.round(kpis.precisaoExata * 100)}% exato, resto estimado`
                      : `${fmtBRL.format(CUSTO_POR_MILHAO_BRL)} por 1M tokens (estimado)`
              }
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
                kpis.deltaPct !== null ? { pct: kpis.deltaPct, vs: 'vs. ontem', upIsGood: false } : null
              }
              spark={sparkline}
            />
            <StatCard
              label="Projeção do mês"
              value={fmtBRL.format(projecaoMensal.custoProjetado)}
              sub={`${fmtBRL.format(projecaoMensal.custoAteAgora)} já gasto · dia ${projecaoMensal.diaAtual}/${projecaoMensal.diasNoMes}`}
            />
          </div>

          {/* Breakdown + recentes */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-3">
              <FluxoBreakdown stats={fluxoStats} />
            </div>
            <div className="lg:col-span-2">
              <RecentsTable records={records} colorMap={colorMap} />
            </div>
          </div>

          {/* Tendência multi-fluxo */}
          <TimeSeriesChart
            data={series}
            title={chartTitle}
            fluxos={activeFluxos}
            colorMap={colorMap}
            compareEnabled={compareEnabled}
          />

          {/* Distribuição por horário + execuções mais caras */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-3">
              <HoraDistribuicao
                data={horaDistribuicao}
                compareMode={horaCompareMode}
                onCompareMode={setHoraCompareMode}
                compareRange={horaCompareRange}
                onCompareRange={setHoraCompareRange}
              />
            </div>
            <div className="lg:col-span-2">
              <TopExecucoes execucoes={topExecucoes} colorMap={colorMap} />
            </div>
          </div>
        </div>

        <footer className="pb-4">
          <p className="text-[12px]" style={{ color: C.inkMuted }}>
            Modelo: GPT-4.1 mini — US$ 0,40/1M input, US$ 1,60/1M output (dólar R$ 5,07).
            Sem separação de input/output na linha, usa estimativa blended de{' '}
            {fmtBRL.format(CUSTO_POR_MILHAO_BRL)}/1M — ajuste em <code>lib/config.ts</code>.
          </p>
        </footer>
      </main>
    </div>
  );
}
