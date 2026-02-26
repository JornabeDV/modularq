import { PDFDocument } from "pdf-lib";

/**
 * Descarga un PDF desde una URL y lo convierte a ArrayBuffer
 */
async function fetchPdfFromUrl(url: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Error fetching PDF from ${url}:`, response.statusText);
      return null;
    }
    return await response.arrayBuffer();
  } catch (error) {
    console.error(`Error downloading PDF from ${url}:`, error);
    return null;
  }
}

/**
 * Mergea múltiples PDFs en uno solo
 * @param mainPdfBuffer - El PDF principal (presupuesto)
 * @param attachmentUrls - URLs de los PDFs adjuntos (planos)
 * @returns Buffer del PDF mergeado
 */
export async function mergePdfs(
  mainPdfBuffer: ArrayBuffer,
  attachmentUrls: string[]
): Promise<Uint8Array> {
  // Crear un nuevo documento PDF que contendrá todo
  const mergedPdf = await PDFDocument.create();

  // 1. Copiar páginas del PDF principal (presupuesto)
  const mainPdf = await PDFDocument.load(mainPdfBuffer);
  const mainPages = await mergedPdf.copyPages(mainPdf, mainPdf.getPageIndices());
  mainPages.forEach((page) => mergedPdf.addPage(page));

  // 2. Descargar y agregar cada PDF adjunto
  for (const url of attachmentUrls) {
    try {
      const pdfBuffer = await fetchPdfFromUrl(url);
      if (pdfBuffer) {
        const attachmentPdf = await PDFDocument.load(pdfBuffer);
        const attachmentPages = await mergedPdf.copyPages(
          attachmentPdf,
          attachmentPdf.getPageIndices()
        );
        attachmentPages.forEach((page) => mergedPdf.addPage(page));
      }
    } catch (error) {
      console.error(`Error processing PDF from ${url}:`, error);
      // Continuar con el siguiente PDF si uno falla
    }
  }

  // Guardar el PDF mergeado
  return await mergedPdf.save();
}

/**
 * Verifica si una URL es un PDF
 */
export function isPdfUrl(url: string): boolean {
  return url.toLowerCase().endsWith(".pdf");
}
