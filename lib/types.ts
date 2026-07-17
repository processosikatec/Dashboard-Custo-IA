export interface TokenRecord {
  id: number;
  created_at: string;
  tokens: number;
  /** presentes só quando o registro veio com colunas separadas; usados para custo exato */
  inputTokens: number | null;
  outputTokens: number | null;
  fluxo: string;
}

export interface FluxoStat {
  fluxo: string;
  tokens: number;
  custo: number;
  /** fração (0–1) das execuções deste fluxo com input/output separados */
  precisaoExata: number;
  percentage: number;
  count: number;
  color: string;
}

export interface SeriesPoint {
  label: string;
  tokens: number;
  custo: number;
  execucoes: number;
  fluxos: Record<string, number>;
  fluxosCusto: Record<string, number>;
  /** valor do mesmo ponto no período anterior, para overlay de comparação */
  tokensAnterior?: number;
  custoAnterior?: number;
}

export type Period = 'hoje' | '7d' | '30d' | 'tudo' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

export type Metric = 'tokens' | 'custo';
