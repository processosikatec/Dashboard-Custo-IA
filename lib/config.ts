// Preços por 1 milhão de tokens, em reais — usados quando a linha tem
// "input tokens"/"output tokens" preenchidos (cálculo exato).
// Base: GPT-4.1 mini, dólar R$ 5,07.
export const INPUT_POR_MILHAO_BRL = 2.03; // US$ 0,40/1M
export const OUTPUT_POR_MILHAO_BRL = 8.11; // US$ 1,60/1M

// Fallback quando só existe "total tokens" (linhas antigas, sem separação).
// Blended a partir do mix assumido 75% input / 25% output.
export const CUSTO_POR_MILHAO_BRL = 3.55;

export const TABLE_NAME = 'tokens e suas origens - IA';
