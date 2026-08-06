// Preços por 1 milhão de tokens, em dólar — usados quando a linha tem
// "input tokens"/"output tokens" preenchidos (cálculo exato).
// Base: GPT-4.1 mini.
//
// O n8n não expõe cached_tokens (prompt cache da OpenAI), então não dá pra
// calcular o desconto de cache por registro. Calibramos o preço de input pra
// um blended que aproxima o valor real: comparando dois dias contra o painel
// de uso da própria OpenAI (04/08 e 05/08/2026), a fração de cache hit ficou
// em ~18% nos dois — usamos esse blended fixo em vez do preço cheio.
// Reavaliar se o mix de cache mudar muito, ou trocar por cálculo exato se o
// n8n passar a registrar cached_tokens.
export const INPUT_POR_MILHAO_USD = 0.345; // full $0.40 blended com ~18% de cache a $0.10
export const OUTPUT_POR_MILHAO_USD = 1.6;
// Prompt cache hit: 75% de desconto sobre o input (preço da OpenAI para
// "cached_tokens" retornado em usage.prompt_tokens_details) — usado só se essa
// coluna vier a ser populada no futuro; hoje nenhuma linha a tem.
export const CACHED_INPUT_POR_MILHAO_USD = 0.1;

// Fallback quando só existe "total tokens" (linhas antigas, sem separação).
// Blended a partir do mix assumido 75% input / 25% output, já com o mesmo
// desconto de cache aproximado usado acima.
export const CUSTO_POR_MILHAO_USD = 0.66; // 0.75 × 0.345 + 0.25 × 1.6

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
