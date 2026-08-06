// Preços por 1 milhão de tokens, em dólar — usados quando a linha tem
// "input tokens"/"output tokens" preenchidos (cálculo exato).
// Base: GPT-4.1 mini.
export const INPUT_POR_MILHAO_USD = 0.4;
export const OUTPUT_POR_MILHAO_USD = 1.6;
// Prompt cache hit: 75% de desconto sobre o input (preço da OpenAI para
// "cached_tokens" retornado em usage.prompt_tokens_details).
export const CACHED_INPUT_POR_MILHAO_USD = 0.1;

// Fallback quando só existe "total tokens" (linhas antigas, sem separação).
// Blended a partir do mix assumido 75% input / 25% output.
export const CUSTO_POR_MILHAO_USD = 0.7;

export const TABLE_NAME = 'tokens e suas origens - IA';

// Fluxos que não devem contar em nada no painel (KPIs, gráficos, breakdown).
export const FLUXOS_EXCLUIDOS = ['IA Qualidade v5 - IA CSAT'];

// Exceção pontual: o fluxo "Sub-Fluxo - Tipo Mensagem" rodou em gpt-4o-mini
// (não GPT-4.1 mini) só em 04/08/2026 — preço bem menor. Já corrigido no n8n;
// data fixa (não "hoje") para que filtrar por esse dia no passado continue
// aplicando o preço certo. Remover se passarmos a registrar o modelo por linha.
export const EXCECAO_MODELO = {
  fluxo: 'Sub-Fluxo - Tipo Mensagem',
  data: new Date(2026, 7, 4).toDateString(), // 04/08/2026 (mês 7 = agosto, 0-indexed)
  inputPorMilhaoUSD: 0.15,
  outputPorMilhaoUSD: 0.6,
};
