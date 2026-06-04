-- 1. Ver cuántas cotizaciones tienen exchange_rate nulo, agrupadas por mes
SELECT
  DATE_TRUNC('month', created_at) AS mes,
  COUNT(*) AS cantidad_cotizaciones,
  COUNT(exchange_rate) AS con_tasa_cargada,
  COUNT(*) FILTER (WHERE exchange_rate IS NULL) AS sin_tasa
FROM quotes
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY mes DESC;

-- 2. Ver cotizaciones específicas sin tasa (últimas 50)
SELECT
  id,
  number,
  client_name,
  total,
  currency,
  created_at,
  exchange_rate
FROM quotes
WHERE exchange_rate IS NULL
ORDER BY created_at DESC
LIMIT 50;
