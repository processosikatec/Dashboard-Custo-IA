'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { TABLE_NAME, CUSTO_POR_MILHAO_BRL } from '@/lib/config';
import { SERIES_COLORS } from '@/lib/palette';
import { TokenRecord, FluxoStat, SeriesPoint, Period } from '@/lib/types';

function normalize(row: Record<string, unknown>): TokenRecord {
  return {
    id: Number(row.id),
    created_at: String(row.created_at ?? ''),
    tokens: Number(row['total tokens']) || 0,
    fluxo: String(row.fluxo ?? 'Desconhecido'),
  };
}

function periodStart(period: Period): Date | null {
  if (period === 'tudo') return null;
  const s = new Date();
  if (period === '7d') s.setDate(s.getDate() - 6);
  if (period === '30d') s.setDate(s.getDate() - 29);
  s.setHours(0, 0, 0, 0);
  return s;
}

function buildSeries(records: TokenRecord[], period: Period): SeriesPoint[] {
  const now = new Date();

  if (period === 'hoje') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const buckets = new Map<number, number>();
    for (let h = 0; h <= now.getHours(); h++) buckets.set(h, 0);
    records.forEach((r) => {
      const d = new Date(r.created_at);
      if (d >= start) buckets.set(d.getHours(), (buckets.get(d.getHours()) || 0) + r.tokens);
    });
    return [...buckets.entries()].map(([h, tokens]) => ({
      label: `${String(h).padStart(2, '0')}h`,
      tokens,
    }));
  }

  let start = periodStart(period);
  if (!start) {
    const oldest = records.reduce(
      (min, r) => Math.min(min, +new Date(r.created_at)),
      +now,
    );
    start = new Date(oldest);
    start.setHours(0, 0, 0, 0);
  }

  const buckets: { label: string; tokens: number }[] = [];
  const idx = new Map<string, number>();
  for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
    idx.set(d.toDateString(), buckets.length);
    buckets.push({
      label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      tokens: 0,
    });
  }
  records.forEach((r) => {
    const i = idx.get(new Date(r.created_at).toDateString());
    if (i !== undefined) buckets[i].tokens += r.tokens;
  });
  return buckets;
}

export function useTokens(period: Period) {
  const [records, setRecords] = useState<TokenRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchTokens = useCallback(async () => {
    try {
      const { data, error: err } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5000);

      if (err) throw err;
      setRecords((data || []).map(normalize));
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTokens();

    const channel = supabase
      .channel('tokens-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: TABLE_NAME },
        (payload) => {
          setRecords((prev) => [normalize(payload.new as Record<string, unknown>), ...prev]);
          setLastUpdate(new Date());
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [fetchTokens]);

  // Cor segue a entidade: atribuição alfabética é estável entre filtros e reloads.
  const colorMap = useMemo(() => {
    const fluxos = [...new Set(records.map((r) => r.fluxo))].sort((a, b) =>
      a.localeCompare(b, 'pt-BR'),
    );
    const map = new Map<string, string>();
    fluxos.forEach((f, i) => map.set(f, SERIES_COLORS[i % SERIES_COLORS.length]));
    return map;
  }, [records]);

  const filtered = useMemo(() => {
    const start = periodStart(period);
    if (!start) return records;
    return records.filter((r) => new Date(r.created_at) >= start);
  }, [records, period]);

  const fluxoStats: FluxoStat[] = useMemo(() => {
    const map = new Map<string, { tokens: number; count: number }>();
    filtered.forEach((r) => {
      const cur = map.get(r.fluxo) || { tokens: 0, count: 0 };
      cur.tokens += r.tokens;
      cur.count += 1;
      map.set(r.fluxo, cur);
    });
    const total = [...map.values()].reduce((s, v) => s + v.tokens, 0) || 1;
    return [...map.entries()]
      .map(([fluxo, { tokens, count }]) => ({
        fluxo,
        tokens,
        count,
        custo: (tokens / 1_000_000) * CUSTO_POR_MILHAO_BRL,
        percentage: (tokens / total) * 100,
        color: colorMap.get(fluxo) || SERIES_COLORS[0],
      }))
      .sort((a, b) => b.tokens - a.tokens);
  }, [filtered, colorMap]);

  const kpis = useMemo(() => {
    const totalTokens = filtered.reduce((s, r) => s + r.tokens, 0);

    const hojeStart = new Date();
    hojeStart.setHours(0, 0, 0, 0);
    const ontemStart = new Date(hojeStart);
    ontemStart.setDate(ontemStart.getDate() - 1);

    let hoje = 0;
    let ontem = 0;
    records.forEach((r) => {
      const d = new Date(r.created_at);
      if (d >= hojeStart) hoje += r.tokens;
      else if (d >= ontemStart) ontem += r.tokens;
    });

    return {
      totalTokens,
      custo: (totalTokens / 1_000_000) * CUSTO_POR_MILHAO_BRL,
      hoje,
      deltaPct: ontem > 0 ? ((hoje - ontem) / ontem) * 100 : null,
      execucoes: filtered.length,
      fluxosAtivos: fluxoStats.length,
    };
  }, [filtered, records, fluxoStats]);

  const series = useMemo(() => buildSeries(records, period), [records, period]);

  // Sparkline: total por hora nas últimas 12 horas.
  const sparkline = useMemo(() => {
    const now = Date.now();
    const buckets = new Array(12).fill(0);
    records.forEach((r) => {
      const age = now - +new Date(r.created_at);
      const slot = 11 - Math.floor(age / 3_600_000);
      if (slot >= 0 && slot < 12) buckets[slot] += r.tokens;
    });
    return buckets;
  }, [records]);

  return { records: filtered, allRecords: records, fluxoStats, kpis, series, sparkline, colorMap, loading, error, lastUpdate, refetch: fetchTokens };
}
