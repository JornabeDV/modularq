/**
 * Conversor de números a letras en español.
 *
 * Soporta números enteros y decimales (hasta 2 cifras) dentro del rango
 * usado en cotizaciones (rango Long: 64 bits, hasta ~922 billones).
 *
 * Caso especial: cuando la parte entera es 0, devuelve "cero".
 */

const UNIDADES = [
  "", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho",
  "nueve", "diez", "once", "doce", "trece", "catorce", "quince",
  "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte",
  "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco",
  "veintiséis", "veintisiete", "veintiocho", "veintinueve",
];

const DECENAS = [
  "", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta",
  "ochenta", "noventa",
];

const CENTENAS = [
  "", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos",
  "seiscientos", "setecientos", "ochocientos", "novecientos",
];

function tresHasta999(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cien";

  const centena = Math.floor(n / 100);
  const resto = n % 100;

  const c = CENTENAS[centena];
  const r = resto < 30 ? UNIDADES[resto] : DECENAS[Math.floor(resto / 10)] + (resto % 10 ? " y " + UNIDADES[resto % 10] : "");

  if (c && r) return c + " " + r;
  return c || r;
}

/**
 * Convierte un número entero no negativo a su representación en letras en
 * español. Usa "un" antes de "millón"/"millones" (apócope) en grupos de un
 * millón para mantener la lectura natural.
 */
export function numeroALetras(n: number): string {
  if (n === 0) return "cero";
  if (n < 0) return "menos " + numeroALetras(-n);

  // Se procesa en grupos de tres dígitos
  const grupos: number[] = [];
  let temp = Math.floor(n);
  while (temp > 0) {
    grupos.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  // Nombres por nivel de agrupación (i=1 miles, i=2 millones, etc.)
  // En español el plural se usa a partir de 2, salvo "mil" que es invariable.
  const NOMBRES_SING: Record<number, string> = { 2: "millón", 3: "billón", 4: "trillón" };
  const NOMBRES_PLUR: Record<number, string> = { 1: "mil", 2: "millones", 3: "billones", 4: "trillones" };

  let resultado = "";

  for (let i = grupos.length - 1; i >= 0; i--) {
    const g = grupos[i];
    if (g === 0) continue;

    if (i === 0) {
      resultado += (resultado ? " " : "") + tresHasta999(g);
      continue;
    }

    if (i === 1) {
      // miles (plural invariable)
      if (g === 1) {
        resultado += " mil";
      } else {
        resultado += " " + tresHasta999(g) + " mil";
      }
      continue;
    }

    // millones / billones / trillones
    const plural = g !== 1;
    const nombre = plural ? NOMBRES_PLUR[i] : NOMBRES_SING[i];
    if (!nombre) {
      // Nivel sin nombre definido: cae al caso genérico
      resultado += " " + tresHasta999(g);
      continue;
    }
    const enLetras = tresHasta999(g);
    // Apócope: antes de sustantivo plural, "uno"/"veintiuno" etc. → "un"/"veintiún".
    const llevaApocope = plural && (g === 1 || (g >= 21 && g <= 29) || g === 100);
    if (llevaApocope) {
      const apocope = enLetras.replace(/^uno$/, "un");
      resultado += " " + apocope + " " + nombre;
    } else {
      resultado += " " + enLetras + " " + nombre;
    }
  }

  return resultado.trim();
}
/**
 * Convierte un monto (posiblemente con decimales) a letras en español.
 *
 * - `moneda` define la palabra de la unidad ("pesos" / "dólares").
 * - El plural se aplica solo si la parte entera es distinta de uno.
 * - Los centavos se expresan como "XX/100" (estilo factura) o con la
 *   palabra "con XX centavos" según `estilo`.
 */
export interface MontoEnLetrasOptions {
  moneda?: string;        // ej: "pesos", "dólares"
  estiloCentavos?: "con" | "barras"; // "con XX centavos" o "XX/100"
}

export function montoEnLetras(
  monto: number,
  options: MontoEnLetrasOptions = {}
): string {
  const { moneda = "pesos", estiloCentavos = "barras" } = options;

  const entero = Math.floor(monto);
  // redondeo de centavos para evitar artefactos de coma flotante
  const centavos = Math.round((monto - entero) * 100);

  const letrasEntero = numeroALetras(entero);
  const unidadPlural = letrasEntero === "uno" ? moneda : moneda + (moneda.endsWith("s") ? "" : "s");

  const parteEntera = `${letrasEntero} ${unidadPlural}`;

  if (estiloCentavos === "con") {
    return `${parteEntera} con ${centavos}/100`;
  }
  return `${parteEntera} ${String(centavos).padStart(2, "0")}/100`;
}
