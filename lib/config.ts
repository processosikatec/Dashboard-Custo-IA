// Preços por 1 milhão de tokens, em dólar — usados quando a linha tem
// "input tokens"/"output tokens" preenchidos (cálculo exato).
// Base: GPT-4.1 mini.
// TEMPORÁRIO: usando o preço de cache (0,10) no input cheio, sem a coluna
// "cached tokens" ainda populada — aproxima o valor real (que tem cache hit
// alto) até o n8n passar a registrar cached_tokens de verdade. Reverter para
// 0.4 assim que a coluna estiver populada e confiável.
export const INPUT_POR_MILHAO_USD = 0.1;
export const OUTPUT_POR_MILHAO_USD = 1.6;
// Prompt cache hit: 75% de desconto sobre o input (preço da OpenAI para
// "cached_tokens" retornado em usage.prompt_tokens_details).
export const CACHED_INPUT_POR_MILHAO_USD = 0.1;

// Fallback quando só existe "total tokens" (linhas antigas, sem separação).
// Blended a partir do mix assumido 75% input / 25% output.
export const CUSTO_POR_MILHAO_USD = 0.7;

export const TABLE_NAME = 'tokens e suas origens - IA';
