import * as pdfjsLib from "pdfjs-dist";
import type { PDFPageProxy, PageViewport } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export type ImportedPageSize = "short" | "a4" | "long";

export type ImportedDocument = {
  title: string;
  htmlPages: string[];
  combinedHtml: string;
  pageSize: ImportedPageSize;
  lockPagination: boolean;
  wordCount: number;
};

export const ACCEPTED_DOCUMENT_ACCEPT =
  ".pdf,.docx,.txt,.html,.htm,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/html";

function fileTitle(file: File): string {
  return file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "Imported Document";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitizeImportedHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

function countWords(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(" ").length : 0;
}

function inferPageSize(widthPt: number, heightPt: number): ImportedPageSize {
  const heightIn = heightPt / 72;
  const widthIn = widthPt / 72;
  if (heightIn >= 12.4) return "long";
  if (Math.abs(widthIn - 8.27) < 0.25 && heightIn > 11.2) return "a4";
  return "short";
}

function fontFromPdfName(fontName: string): { family: string; weight: string; style: string } {
  const n = fontName.toLowerCase();
  const family =
    n.includes("times") || n.includes("georgia")
      ? "'Times New Roman', Times, serif"
      : n.includes("courier")
        ? "'Courier New', Courier, monospace"
        : "Arial, Helvetica, sans-serif";
  return {
    family,
    weight: n.includes("bold") ? "700" : "400",
    style: n.includes("italic") || n.includes("oblique") ? "italic" : "normal",
  };
}

function wrapImportedPage(inner: string, heightPx: number): string {
  return `<div class="imported-pdf-page" data-imported-page="true" style="position:relative;width:100%;height:${Math.round(heightPx)}px;overflow:hidden;background:#fff;">${inner}</div>`;
}

async function renderPdfPageToDataUrl(
  page: PDFPageProxy,
  viewport: PageViewport
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not render this PDF page.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport, intent: "display" }).promise;
  return canvas.toDataURL("image/jpeg", 0.88);
}

async function pdfPageToHtml(
  page: PDFPageProxy,
  displayScale: number
): Promise<{ html: string; heightPx: number }> {
  const displayViewport = page.getViewport({ scale: displayScale });
  const renderViewport = page.getViewport({ scale: displayScale * 2 });
  const imageUrl = await renderPdfPageToDataUrl(page, renderViewport);
  const textContent = await page.getTextContent();

  const spans: string[] = [];
  for (const raw of textContent.items) {
    if (!("str" in raw)) continue;
    const item = raw as {
      str: string;
      transform: number[];
      width: number;
      fontName: string;
    };
    if (!item.str || !item.str.trim()) continue;

    const tx = pdfjsLib.Util.transform(displayViewport.transform, item.transform);
    const fontHeight = Math.hypot(tx[2], tx[3]) || 12;
    const left = tx[4];
    const top = tx[5] - fontHeight;
    const font = fontFromPdfName(item.fontName || "");
    const widthPx = item.width * displayScale;

    spans.push(
      `<span class="pdf-t" contenteditable="true" data-original="${escapeHtml(item.str)}" style="position:absolute;left:${left.toFixed(2)}px;top:${top.toFixed(2)}px;font-size:${fontHeight.toFixed(2)}px;font-family:${font.family};font-weight:${font.weight};font-style:${font.style};line-height:1;white-space:pre;width:${Math.max(widthPx, 4).toFixed(2)}px;">${escapeHtml(item.str)}</span>`
    );
  }

  const img = `<img class="pdf-page-bg" src="${imageUrl}" alt="Document page" draggable="false" style="position:absolute;left:0;top:0;width:100%;height:100%;user-select:none;pointer-events:none;" />`;
  const layer = `<div class="pdf-text-layer" style="position:absolute;left:0;top:0;width:100%;height:100%;">${spans.join("")}</div>`;
  return { html: wrapImportedPage(img + layer, displayViewport.height), heightPx: displayViewport.height };
}

async function importPdf(file: File): Promise<ImportedDocument> {
  const data = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data, useSystemFonts: true });
  const pdf = await loadingTask.promise;
  const first = await pdf.getPage(1);
  const baseViewport = first.getViewport({ scale: 1 });
  const pageSize = inferPageSize(baseViewport.width, baseViewport.height);
  const targetWidth =
    pageSize === "a4" ? 794 : 816;
  const displayScale = targetWidth / baseViewport.width;

  const htmlPages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = i === 1 ? first : await pdf.getPage(i);
    const converted = await pdfPageToHtml(page, displayScale);
    htmlPages.push(converted.html);
  }

  const combinedHtml = htmlPages.join("");
  return {
    title: fileTitle(file),
    htmlPages,
    combinedHtml,
    pageSize,
    lockPagination: true,
    wordCount: countWords(combinedHtml),
  };
}

async function importDocx(file: File): Promise<ImportedDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        const base64 = await image.readAsBase64String();
        return { src: `data:${image.contentType};base64,${base64}` };
      }),
    }
  );
  const html = sanitizeImportedHtml(result.value || "<p></p>");
  return {
    title: fileTitle(file),
    htmlPages: [html],
    combinedHtml: html,
    pageSize: "short",
    lockPagination: false,
    wordCount: countWords(html),
  };
}

async function importPlainText(file: File): Promise<ImportedDocument> {
  const text = await file.text();
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/);
  const html = (blocks.length ? blocks : [text])
    .map((block) => `<p style="margin:0 0 8px 0;line-height:1.45;white-space:pre-wrap;">${escapeHtml(block.trim())}</p>`)
    .join("");
  return {
    title: fileTitle(file),
    htmlPages: [html],
    combinedHtml: html,
    pageSize: "short",
    lockPagination: false,
    wordCount: countWords(html),
  };
}

async function importHtml(file: File): Promise<ImportedDocument> {
  const html = sanitizeImportedHtml(await file.text());
  return {
    title: fileTitle(file),
    htmlPages: [html],
    combinedHtml: html,
    pageSize: "short",
    lockPagination: false,
    wordCount: countWords(html),
  };
}

export async function importDocumentFile(file: File): Promise<ImportedDocument> {
  const name = file.name.toLowerCase();
  const type = file.type;

  if (type === "application/pdf" || name.endsWith(".pdf")) {
    return importPdf(file);
  }
  if (
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    return importDocx(file);
  }
  if (type === "text/html" || name.endsWith(".html") || name.endsWith(".htm")) {
    return importHtml(file);
  }
  if (type === "text/plain" || name.endsWith(".txt")) {
    return importPlainText(file);
  }

  throw new Error("Please choose a PDF, Word (.docx), HTML, or text file.");
}
