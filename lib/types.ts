export interface TokenRecord {
  id: number;
  created_at: string;
  tokens: number;
  fluxo: string;
}

export interface FluxoStat {
  fluxo: string;
  tokens: number;
  custo: number;
  percentage: number;
  count: number;
  color: string;
}

export interface SeriesPoint {
  label: string;
  tokens: number;
}

export type Period = 'hoje' | '7d' | '30d' | 'tudo';
