'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  TABLE_NAME,
  CUSTO_POR_MILHAO_USD,
  INPUT_POR_MILHAO_USD,
  OUTPUT_POR_MILHAO_USD,
  CACHED_INPUT_POR_MILHAO_USD,
  EXCECAO_MODELO,
} from '@/lib/config';
import { SERIES_COLORS, C } from '@/lib/palette';
import { TokenRecord, FluxoStat, SeriesPoint, Period, DateRange } from '@/lib/types';
import { CompareMode } from '@/components/CompareControls';

const OUTROS = 'Outros';

function normalize(row: Record<string, unknown>): TokenRecord {
  const input = row['input tokens'];
  const output = row['output tokens'];
  const cached = row['cached tokens'];
  return {
    id: Number(row.id),
    created_at: String(row.created_at ?? ''),
    tokens: Number(row['total tokens']) || 0,
    inputTokens: input === null || input === undefined ? null : Number(input),
    outputTokens: output === null || output === undefined ? null : Number(output),
    cachedTokens: cached === null || cached === undefined ? null : Number(cached),
    fluxo: String(row.fluxo ?? 'Desconhecido'),
  };
}

/**
 * Custo exato quando input/output existem, descontando cache hit quando registrado
 * (cachedTokens é cobrado a 25% do preço normal de input); senão estimativa blended
 * sobre o total. Aplica preço de modelo diferente para a exceção pontual configurada
 * (fluxo + dia específicos que rodaram em outro modelo).
 */
function custoDe(r: TokenRecord): number {
  const isExcecao =
    r.fluxo === EXCECAO_MODELO.fluxo && new Date(r.created_at).toDateString() === EXCECAO_MODELO.data;

  if (r.inputTokens !== null && r.outputTokens !== null) {
    if (isExcecao) {
      return (
        (r.inputTokens / 1_000_000) * EXCECAO_MODELO.inputPorMilhaoUSD +
        (r.outputTokens / 1_000_000) * EXCECAO_MODELO.outputPorMilhaoUSD
      );
    }
    const cached = r.cachedTokens ?? 0;
    const inputNormal = Math.max(r.inputTokens - cached, 0);
    return (
      (inputNormal / 1_000_000) * INPUT_POR_MILHAO_USD +
      (cached / 1_000_000) * CACHED_INPUT_POR_MILHAO_USD +
      (r.outputTokens / 1_000_000) * OUTPUT_POR_MILHAO_USD
    );
  }
  return (r.tokens / 1_000_000) * CUSTO_POR_MILHAO_USD;
}

function somaCusto(records: TokenRecord[]): number {
  return records.reduce((s, r) => s + custoDe(r), 0);
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

/** Resolve o período selecionado para um intervalo [start, end] concreto. */
function resolveRange(period: Period, custom: DateRange | null, records: TokenRecord[]): DateRange {
  const now = new Date();
  if (period === 'custom' && custom) return custom;
  if (period === 'hoje') return { start: startOfDay(now), end: now };
  if (period === '7d') {
    const s = startOfDay(now);
    s.setDate(s.getDate() - 6);
    return { start: s, end: now };
  }
  if (period === '30d') {
    const s = startOfDay(now);
    s.setDate(s.getDate() - 29);
    return { start: s, end: now };
  }
  // 'tudo'
  const oldest = records.reduce((min, r) => Math.min(min, +new Date(r.created_at)), +now);
  return { start: startOfDay(new Date(Number.isFinite(oldest) ? oldest : +now)), end: now };
}

/** Intervalo imediatamente anterior, com a mesma duração — para comparação. */
function previousRange(range: DateRange): DateRange {
  const durationMs = range.end.getTime() - range.start.getTime();
  return {
    start: new Date(range.start.getTime() - durationMs),
    end: new Date(range.start.getTime() - 1),
  };
}

function bucketLabel(d: Date, granularity: 'hour' | 'day'): string {
  if (granularity === 'hour') return `${String(d.getHours()).padStart(2, '0')}h`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function granularityFor(range: DateRange): 'hour' | 'day' {
  return range.end.getTime() - range.start.getTime() <= 36 * 3_600_000 ? 'hour' : 'day';
}

function buildBuckets(range: DateRange): { key: string; label: string }[] {
  const granularity = granularityFor(range);
  const buckets: { key: string; label: string }[] = [];
  if (granularity === 'hour') {
    const d = new Date(range.start);
    d.setMinutes(0, 0, 0);
    while (d <= range.end) {
      buckets.push({ key: d.toISOString().slice(0, 13), label: bucketLabel(d, 'hour') });
      d.setHours(d.getHours() + 1);
    }
  } else {
    const d = startOfDay(range.start);
    while (d <= range.end) {
      buckets.push({ key: d.toDateString(), label: bucketLabel(d, 'day') });
      d.setDate(d.getDate() + 1);
    }
  }
  return buckets;
}

function bucketKeyFor(date: Date, granularity: 'hour' | 'day'): string {
  return granularity === 'hour' ? date.toISOString().slice(0, 13) : date.toDateString();
}

export function useTokens() {
  const [allRecords, setAllRecords] = useState<TokenRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const [period, setPeriod] = useState<Period>('hoje');
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [selectedFluxos, setSelectedFluxos] = useState<Set<string> | null>(null); // null = todos

  // Comparação independente para o gráfico de tendência (multi-linha por fluxo).
  const [seriesCompareMode, setSeriesCompareMode] = useState<CompareMode>('off');
  const [seriesCompareRange, setSeriesCompareRange] = useState<DateRange | null>(null);

  // Comparação independente para o gráfico de distribuição por horário do dia.
  const [horaCompareMode, setHoraCompareMode] = useState<CompareMode>('off');
  const [horaCompareRange, setHoraCompareRange] = useState<DateRange | null>(null);

  const fetchTokens = useCallback(async () => {
    setRefreshing(true);
    try {
      // O PostgREST limita cada resposta a ~1000 linhas por padrão — .limit() sozinho
      // não contorna isso. Pagina em blocos de 1000 até esgotar a tabela.
      const PAGE_SIZE = 1000;
      const all: Record<string, unknown>[] = [];
      for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error: err } = await supabase
          .from(TABLE_NAME)
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, from + PAGE_SIZE - 1);

        if (err) throw err;
        if (!data || data.length === 0) break;
        all.push(...data);
        if (data.length < PAGE_SIZE) break;
      }

      setAllRecords(all.map(normalize));
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTokens();

    // Atualização por polling a cada 1min — comportamento previsível, sem depender
    // de replicação realtime do Supabase (não confirmada como confiável nesta tabela).
    const interval = setInterval(fetchTokens, 60_000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchTokens]);

  // Todos os fluxos conhecidos, para a lista do filtro (ordem alfabética).
  const allFluxos = useMemo(
    () => [...new Set(allRecords.map((r) => r.fluxo))].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [allRecords],
  );

  // A paleta tem 8 cores CVD-seguras — nunca reciclar hue para um 9º+ fluxo.
  // Os 8 de maior volume histórico ganham cor própria (estável, não muda com filtro
  // de período); o resto cai em "Outros", cinza, agregado nos gráficos.
  const colorMap = useMemo(() => {
    const totals = new Map<string, number>();
    allRecords.forEach((r) => totals.set(r.fluxo, (totals.get(r.fluxo) || 0) + r.tokens));
    const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([f]) => f);

    const map = new Map<string, string>();
    ranked.slice(0, SERIES_COLORS.length).forEach((f, i) => map.set(f, SERIES_COLORS[i]));
    map.set(OUTROS, C.inkMuted);
    return map;
  }, [allRecords]);

  const coloredFluxos = useMemo(() => new Set(colorMap.keys()), [colorMap]);

  /** Nome do fluxo para exibição/agrupamento — vira "Outros" se não tiver cor própria. */
  const displayFluxo = useCallback(
    (fluxo: string) => (coloredFluxos.has(fluxo) ? fluxo : OUTROS),
    [coloredFluxos],
  );

  // Registros filtrados por fluxo (mas ainda não por data).
  const byFluxo = useMemo(() => {
    if (!selectedFluxos || selectedFluxos.size === 0) return allRecords;
    return allRecords.filter((r) => selectedFluxos.has(r.fluxo));
  }, [allRecords, selectedFluxos]);

  const range = useMemo(() => resolveRange(period, customRange, byFluxo), [period, customRange, byFluxo]);

  const records = useMemo(
    () =>
      byFluxo.filter((r) => {
        const t = +new Date(r.created_at);
        return t >= range.start.getTime() && t <= range.end.getTime();
      }),
    [byFluxo, range],
  );

  const fluxoStats: FluxoStat[] = useMemo(() => {
    const map = new Map<string, { tokens: number; custo: number; count: number; exatos: number }>();
    records.forEach((r) => {
      const key = displayFluxo(r.fluxo);
      const cur = map.get(key) || { tokens: 0, custo: 0, count: 0, exatos: 0 };
      cur.tokens += r.tokens;
      cur.custo += custoDe(r);
      cur.count += 1;
      if (r.inputTokens !== null && r.outputTokens !== null) cur.exatos += 1;
      map.set(key, cur);
    });
    const total = [...map.values()].reduce((s, v) => s + v.tokens, 0) || 1;
    return [...map.entries()]
      .map(([fluxo, { tokens, custo, count, exatos }]) => ({
        fluxo,
        tokens,
        count,
        custo,
        precisaoExata: count > 0 ? exatos / count : 0,
        percentage: (tokens / total) * 100,
        color: colorMap.get(fluxo) || SERIES_COLORS[0],
      }))
      // "Outros" sempre por último, o resto por volume.
      .sort((a, b) => (a.fluxo === OUTROS ? 1 : b.fluxo === OUTROS ? -1 : b.tokens - a.tokens));
  }, [records, colorMap, displayFluxo]);

  const kpis = useMemo(() => {
    const totalTokens = records.reduce((s, r) => s + r.tokens, 0);
    const totalCusto = somaCusto(records);
    const precisaoExata = records.length
      ? records.filter((r) => r.inputTokens !== null && r.outputTokens !== null).length / records.length
      : 0;

    const hojeStart = startOfDay(new Date());
    const ontemStart = new Date(hojeStart);
    ontemStart.setDate(ontemStart.getDate() - 1);

    let hoje = 0;
    let ontem = 0;
    byFluxo.forEach((r) => {
      const d = new Date(r.created_at);
      if (d >= hojeStart) hoje += r.tokens;
      else if (d >= ontemStart) ontem += r.tokens;
    });

    const prevRange = previousRange(range);
    const prevTotal = byFluxo
      .filter((r) => {
        const t = +new Date(r.created_at);
        return t >= prevRange.start.getTime() && t <= prevRange.end.getTime();
      })
      .reduce((s, r) => s + r.tokens, 0);

    return {
      totalTokens,
      custo: totalCusto,
      precisaoExata,
      hoje,
      deltaPct: ontem > 0 ? ((hoje - ontem) / ontem) * 100 : null,
      periodoDeltaPct: prevTotal > 0 ? ((totalTokens - prevTotal) / prevTotal) * 100 : null,
      execucoes: records.length,
      fluxosAtivos: fluxoStats.length,
    };
  }, [records, byFluxo, range, fluxoStats]);

  // Intervalo de comparação para o gráfico de tendência: "ontem" (mesmo intervalo de
  // horas do dia anterior) ou um período customizado escolhido pelo usuário.
  const seriesCompareRangeResolved = useMemo((): DateRange | null => {
    if (seriesCompareMode === 'ontem') {
      const durationMs = range.end.getTime() - range.start.getTime();
      const start = new Date(range.start.getTime() - 86_400_000);
      return { start, end: new Date(start.getTime() + durationMs) };
    }
    if (seriesCompareMode === 'custom' && seriesCompareRange) return seriesCompareRange;
    return null;
  }, [seriesCompareMode, seriesCompareRange, range]);

  // Série temporal: um ponto por bucket, com breakdown por fluxo e, se ativado,
  // o valor do mesmo ponto no intervalo de comparação (overlay).
  const series: SeriesPoint[] = useMemo(() => {
    const buckets = buildBuckets(range);
    const granularity = granularityFor(range);
    const idx = new Map(buckets.map((b, i) => [b.key, i]));

    const points: SeriesPoint[] = buckets.map((b) => ({
      label: b.label,
      tokens: 0,
      custo: 0,
      execucoes: 0,
      fluxos: {},
      fluxosCusto: {},
    }));

    records.forEach((r) => {
      const key = bucketKeyFor(new Date(r.created_at), granularity);
      const i = idx.get(key);
      if (i === undefined) return;
      const c = custoDe(r);
      const fluxoKey = displayFluxo(r.fluxo);
      points[i].tokens += r.tokens;
      points[i].custo += c;
      points[i].execucoes += 1;
      points[i].fluxos[fluxoKey] = (points[i].fluxos[fluxoKey] || 0) + r.tokens;
      points[i].fluxosCusto[fluxoKey] = (points[i].fluxosCusto[fluxoKey] || 0) + c;
    });

    if (seriesCompareRangeResolved) {
      const prevGranularity = granularityFor(seriesCompareRangeResolved);
      const prevBuckets = buildBuckets(seriesCompareRangeResolved);
      const prevTokenTotals = new Array(prevBuckets.length).fill(0);
      const prevCustoTotals = new Array(prevBuckets.length).fill(0);
      const prevIdx = new Map(prevBuckets.map((b, i) => [b.key, i]));

      byFluxo.forEach((r) => {
        const t = +new Date(r.created_at);
        if (t < seriesCompareRangeResolved.start.getTime() || t > seriesCompareRangeResolved.end.getTime()) return;
        const key = bucketKeyFor(new Date(r.created_at), prevGranularity);
        const i = prevIdx.get(key);
        if (i !== undefined) {
          prevTokenTotals[i] += r.tokens;
          prevCustoTotals[i] += custoDe(r);
        }
      });

      points.forEach((p, i) => {
        if (i < prevTokenTotals.length) {
          p.tokensAnterior = prevTokenTotals[i];
          p.custoAnterior = prevCustoTotals[i];
        }
      });
    }

    return points;
  }, [records, range, seriesCompareRangeResolved, byFluxo, displayFluxo]);

  // Sparkline: total por hora nas últimas 12 horas (sobre os fluxos selecionados).
  const sparkline = useMemo(() => {
    const now = Date.now();
    const buckets = new Array(12).fill(0);
    byFluxo.forEach((r) => {
      const age = now - +new Date(r.created_at);
      const slot = 11 - Math.floor(age / 3_600_000);
      if (slot >= 0 && slot < 12) buckets[slot] += r.tokens;
    });
    return buckets;
  }, [byFluxo]);

  // Ranking das execuções individuais mais caras no período — acha outliers e picos.
  const topExecucoes = useMemo(
    () =>
      [...records]
        .sort((a, b) => custoDe(b) - custoDe(a))
        .slice(0, 10)
        .map((r) => ({ ...r, custo: custoDe(r) })),
    [records],
  );

  // Intervalo de comparação para a distribuição por hora: "ontem" (dia anterior a hoje)
  // ou um período customizado escolhido pelo usuário.
  const horaCompareRangeResolved = useMemo((): DateRange | null => {
    if (horaCompareMode === 'ontem') {
      const hojeStart = startOfDay(new Date());
      const ontemStart = new Date(hojeStart);
      ontemStart.setDate(ontemStart.getDate() - 1);
      return { start: ontemStart, end: new Date(hojeStart.getTime() - 1) };
    }
    if (horaCompareMode === 'custom' && horaCompareRange) return horaCompareRange;
    return null;
  }, [horaCompareMode, horaCompareRange]);

  // Distribuição de tokens por hora do dia (0–23h), somando todos os dias do período —
  // mostra em que horários o gasto se concentra, independente de quantos dias o filtro cobre.
  // Quando há comparação ativa, cada hora também traz o total do intervalo de comparação.
  const horaDistribuicao = useMemo(() => {
    const buckets = new Array(24).fill(0);
    records.forEach((r) => {
      buckets[new Date(r.created_at).getHours()] += r.tokens;
    });

    if (!horaCompareRangeResolved) {
      return buckets.map((tokens, hora) => ({ hora, tokens }));
    }

    const compareBuckets = new Array(24).fill(0);
    byFluxo.forEach((r) => {
      const t = +new Date(r.created_at);
      if (t >= horaCompareRangeResolved.start.getTime() && t <= horaCompareRangeResolved.end.getTime()) {
        compareBuckets[new Date(r.created_at).getHours()] += r.tokens;
      }
    });

    return buckets.map((tokens, hora) => ({ hora, tokens, tokensComparacao: compareBuckets[hora] }));
  }, [records, byFluxo, horaCompareRangeResolved]);

  // Projeção de gasto do mês corrente com base no ritmo médio diário observado.
  const projecaoMensal = useMemo(() => {
    const now = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
    const diasNoMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const diaAtual = now.getDate();

    const doMes = byFluxo.filter((r) => new Date(r.created_at) >= inicioMes);
    const custoAteAgora = somaCusto(doMes);
    const custoMedioDiario = diaAtual > 0 ? custoAteAgora / diaAtual : 0;

    return {
      custoAteAgora,
      custoProjetado: custoMedioDiario * diasNoMes,
      diaAtual,
      diasNoMes,
    };
  }, [byFluxo]);

  return {
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
    seriesCompareMode,
    setSeriesCompareMode,
    seriesCompareRange,
    setSeriesCompareRange,
    projecaoMensal,
    colorMap,
    loading,
    refreshing,
    error,
    lastUpdate,
    refetch: fetchTokens,
    period,
    setPeriod,
    customRange,
    setCustomRange,
    selectedFluxos,
    setSelectedFluxos,
    range,
  };
}
