-- Adiciona coluna de cached tokens (input reaproveitado do prompt cache da OpenAI,
-- cobrado a 25% do preço normal de input). Nullable — linhas antigas ficam sem valor
-- e o painel usa o preço cheio de input como fallback pra elas.
ALTER TABLE "tokens e suas origens - IA"
  ADD COLUMN IF NOT EXISTS "cached tokens" numeric;
