/**
 * Utilidad para sanitizar texto antes de renderizarlo en PDFs generados con
 * @react-pdf/renderer (basado en @react-pdf/pdfkit).
 *
 * Las fuentes estándar de PDF (Helvetica, Courier, Times) usan WinAnsiEncoding.
 * La función AFMFont.encodeText en pdfkit mapea caracteres Unicode a través de
 * WIN_ANSI_MAP; si un carácter NO está en ese mapa y su código Unicode es > 255,
 * se llama char.toString(16) lo que produce una cadena hex de 4 dígitos.
 * El intérprete del PDF interpreta esos 4 dígitos como 2 bytes, y el segundo
 * byte suele ser un dígito, no el carácter esperado.
 *
 * Ejemplo: ″ (U+2033, código 8243) → toHexString "2033" → bytes 0x20 0x33 →
 *   espacio + "3". Por eso ″ aparece como "3" en el PDF.
 *
 * Esta función reemplaza los caracteres problemáticos por equivalentes que
 * SÍ están soportados por WinAnsiEncoding en las fuentes estándar.
 */

const UNSUPPORTED_REPLACEMENTS: Record<string, string> = {
  // Prime / doble prima (pulgadas, pies, etc.) – U+2032-U+2037
  "\u2032": "'", // ′ PRIME → apóstrofe recto
  "\u2033": '"',  // ″ DOUBLE PRIME → comilla recta
  "\u2034": "'''", // ‴ TRIPLE PRIME → 3 apóstrofes
  "\u2035": "'", // ‵ REVERSED PRIME → apóstrofe recto
  "\u2036": "''", // ‶ REVERSED DOUBLE PRIME → 2 comillas rectas
  "\u2037": "'''", // ‷ REVERSED TRIPLE PRIME → 3 apóstrofes

  // Otros caracteres que podrían no estar en WinAnsiEncoding pero son comunes
  "\u2013": "-", // – EN DASH → guion
  "\u2014": "-", // — EM DASH → guion
  "\u2026": "...", // … ELLIPSIS → 3 puntos
  "\u00A9": "(c)", // © COPYRIGHT SIGN
  "\u00AE": "(r)", // ® REGISTERED SIGN
  "\u00B0": "°", // ° DEGREE SIGN (soportado en WinAnsi)
  "\u2122": "(tm)", // ™ TRADE MARK SIGN

  // Guillemets franceses/redondos que pueden no renderizar bien
  "\u00AB": '"', // « LEFT-POINTING DOUBLE ANGLE QUOTE
  "\u00BB": '"', // » RIGHT-POINTING DOUBLE ANGLE QUOTE
};

const UNSUPPORTED_PATTERN = new RegExp(
  Object.keys(UNSUPPORTED_REPLACEMENTS).join("|"),
  "g"
);

/**
 * Reemplaza caracteres que la fuente estándar de react-pdf no puede renderizar
 * correctamente. Aplicar a TODO texto que proviene de la entrada del usuario
 * (descripciones, notas, nombres de ítems, etc.) antes de pasarlo a <Text>.
 */
export function sanitizePdfText(text: string | undefined | null): string {
  if (!text) return "";
  return text.replace(UNSUPPORTED_PATTERN, (match) => UNSUPPORTED_REPLACEMENTS[match] ?? match);
}
