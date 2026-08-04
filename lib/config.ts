// Preços por 1 milhão de tokens, em dólar — usados quando a linha tem
// "input tokens"/"output tokens" preenchidos (cálculo exato).
// Base: GPT-4.1 mini.
export const INPUT_POR_MILHAO_USD = 0.4;
export const OUTPUT_POR_MILHAO_USD = 1.6;

// Fallback quando só existe "total tokens" (linhas antigas, sem separação).
// Blended a partir do mix assumido 75% input / 25% output.
export const CUSTO_POR_MILHAO_USD = 0.7;

export const TABLE_NAME = 'tokens e suas origens - IA';
