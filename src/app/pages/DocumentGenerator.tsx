"use client";

/**
 * DocumentGenerator.tsx
 * ---------------------------------------------------------------------------
 * CTU Document Studio — WYSIWYG split-view editor with paginated preview.
 *
 * PAGINATION GUARANTEES
 *   • Preview and print consume the SAME fragment array and SAME single-page
 *     HTML builder → identical page breaks and page counts.
 *   • Two-way responsiveness: increasing or decreasing the font re-paginates
 *     from scratch, so pages appear/disappear as the content grows/shrinks.
 *   • No leftover empty pages: trailing empty fragments are stripped.
 *   • Header / footer images stay compact and repeat on every page.
 *   • Trailing signature block moves as a single atomic unit.
 *   • Pages are drawn with the SAME font size / line height the paginator
 *     measured with (state `fit`), so nothing is clipped.
 *   • Tables split between rows (header row repeats); Enter in a heading
 *     never creates another underlined heading.
 *   • Preview pages scale to the panel width at any browser zoom.
 *
 * LINE-SPACING / FIT FIX (v4)
 *   • Line-height is never compressed by the fitter — the user's chosen
 *     spacing is a hard contract that survives into editor, preview and print.
 *   • Changing line spacing or page size in the Layout ribbon now counts as
 *     a user customization, just like typing. Once the user has customized
 *     the document, the aggressive "force onto the requested page count"
 *     pass is disabled: the document flows onto as many pages as the chosen
 *     typography requires. The small-overflow absorption (≤ 20% of a page)
 *     still applies so a lone spilling line gets pulled back in.
 *   • The paginator fast-paths "already fits on one page" and otherwise
 *     measures real rendered positions (getBoundingClientRect), so margin
 *     collapsing is respected and adjacent margins never count twice.
 */

import React, { useState, useRef, useEffect, type RefObject } from "react";
import {
  Sparkles, RefreshCw, Image as ImageIcon, X, FileText, AlertCircle,
  ChevronDown, ChevronUp, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Printer, ArrowLeft, Plus, Minus, Bold, Italic,
  Underline as UnderlineIcon, Strikethrough, List, ListOrdered,
  PenTool, Calendar, Layers, FileSpreadsheet, Trash2, Check,
  Undo, Redo, FolderOpen, UploadCloud, Eye, EyeOff, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import {
  Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType,
  Header, Footer, Table, TableRow, TableCell, WidthType, BorderStyle,
} from "docx";
import { saveAs } from "file-saver";
import {
  DOCUMENT_TEMPLATES, getTemplateById,
  type DocumentTemplate, type PageSize, type DocFont,
} from "../components/documentTemplates";

/* ============================================================================
 * PAGE SIZE SPECIFICATIONS
 * ==========================================================================*/
interface PageSizeConfig {
  key: PageSize; label: string; subLabel: string;
  cssWidth: number; cssHeight: number; docxWidth: number; docxHeight: number;
}

const PAGE_SIZES: Record<PageSize, PageSizeConfig> = {
  short: { key: "short", label: "Letter (Short)", subLabel: '8.5" × 11"',
    cssWidth: 816, cssHeight: 1056, docxWidth: 12240, docxHeight: 15840 },
  a4:    { key: "a4",    label: "A4 (Standard)",   subLabel: '8.27" × 11.69"',
    cssWidth: 794, cssHeight: 1123, docxWidth: 11906, docxHeight: 16838 },
  long:  { key: "long",  label: "Legal (Long)",    subLabel: '8.5" × 13"',
    cssWidth: 816, cssHeight: 1248, docxWidth: 12240, docxHeight: 18720 },
};

/* ============================================================================
 * SHARED PAGE GEOMETRY
 * ==========================================================================*/
const PAGE_PADDING_TOP = 36;
const PAGE_PADDING_BOTTOM = 36;
const PAGE_PADDING_LEFT = 48;
const PAGE_PADDING_RIGHT = 48;

const HEADER_AREA_HEIGHT = 84;
const FOOTER_AREA_HEIGHT = 72;
const FOOTER_MIN_HEIGHT = 26;

const MAX_HEADER_IMG_HEIGHT = 62;
const MAX_FOOTER_IMG_HEIGHT = 42;

/** Sub-pixel slack so a fragment never clips by a hair. */
const PAGE_FIT_SAFETY_PX = 12;

const MIN_FIT_FONT_PT = 10;

/** Non-AI / user-customized documents are only auto-fitted when they overflow one page by at most this ratio. */
const SMALL_OVERFLOW_FIT_RATIO = 1.2;

/** The signature block is only searched for among the last N blocks of the document. */
const SIGNATURE_LOOKBACK_BLOCKS = 12;

function getContentAreaHeight(cssHeight: number, hasHeader: boolean, hasFooter: boolean): number {
  return (
    cssHeight - PAGE_PADDING_TOP - PAGE_PADDING_BOTTOM -
    (hasHeader ? HEADER_AREA_HEIGHT : 0) -
    (hasFooter ? FOOTER_AREA_HEIGHT : FOOTER_MIN_HEIGHT)
  );
}

function getContentAreaWidth(cssWidth: number): number {
  return cssWidth - PAGE_PADDING_LEFT - PAGE_PADDING_RIGHT;
}

/* ============================================================================
 * FONT CONFIG
 * ==========================================================================*/
const FONT_CONFIG: Record<DocFont, { name: string; css: string; docx: string; pdf: string }> = {
  serif:   { name: "Times New Roman",  css: "'Times New Roman', Times, serif",       docx: "Times New Roman", pdf: "times" },
  sans:    { name: "Arial / Calibri",  css: "Arial, 'Helvetica Neue', sans-serif",   docx: "Calibri",         pdf: "helvetica" },
  georgia: { name: "Georgia",          css: "Georgia, serif",                        docx: "Georgia",         pdf: "times" },
  mono:    { name: "Courier New",      css: "'Courier New', Courier, monospace",     docx: "Courier New",     pdf: "courier" },
};

/* ============================================================================
 * DEFAULT LETTERHEAD ASSETS
 * ==========================================================================*/
const DEFAULT_HEADER_URL = "/ctu-argao-header.jpg";
const DEFAULT_FOOTER_URL = "/ctu-argao-footer.jpg";

/* ============================================================================
 * SHARED CONTENT CSS
 * ── line-height is a single custom property (--doc-line-height), written on
 *    every .wysiwyg-content surface (editor / measure / preview / print).
 * ==========================================================================*/
const CONTENT_STYLES = `
  .wysiwyg-content { box-sizing: border-box; line-height: var(--doc-line-height, 1.45); }
  .wysiwyg-content * { box-sizing: border-box; }
  .wysiwyg-content h1 { font-size: 1.45em; text-align: center; text-transform: uppercase;
    margin: 0 0 14px 0; letter-spacing: 0.03em; font-weight: 700; }
  .wysiwyg-content h2 { font-size: 1.15em; border-bottom: 1.5px solid #1f2937;
    padding-bottom: 2px; margin: 14px 0 6px 0; font-weight: 700; }
  .wysiwyg-content h3 { font-size: 1.02em; border-bottom: 1px solid #6b7280;
    padding-bottom: 2px; margin: 10px 0 4px 0; font-weight: 700; }
  .wysiwyg-content p { margin: 0 0 6px 0; }
  .wysiwyg-content ul { margin: 0 0 8px 0; padding-left: 24px; list-style-type: disc; }
  .wysiwyg-content ol { margin: 0 0 8px 0; padding-left: 24px; list-style-type: decimal; }
  .wysiwyg-content li { margin-bottom: 4px; }
  .wysiwyg-content table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 0.9em; }
  .wysiwyg-content img { max-width: 100%; height: auto; }
  .wysiwyg-content strong { font-weight: 700; }
  .wysiwyg-content em { font-style: italic; }
  .wysiwyg-content u { text-decoration: underline; }
  /* Blank lines that live inside a heading must be invisible spacing, not a rule. */
  .wysiwyg-content h1:has(> br:only-child),
  .wysiwyg-content h2:has(> br:only-child),
  .wysiwyg-content h3:has(> br:only-child),
  .wysiwyg-content h2:empty,
  .wysiwyg-content h3:empty { border-bottom: 0 !important; }
`;

/* ============================================================================
 * SYSTEM PROMPT
 * ==========================================================================*/
export const SYSTEM_PROMPT = `You are a senior institutional and academic document drafting assistant for Cebu Technological University (CTU Argao Campus and System).

You generate professional, legally sound, and academic-grade documents.

STRICT PAGE LIMIT RULE (MANDATORY):
- If the user says "1 page" or says nothing about page count → the document MUST FIT ON EXACTLY ONE (1) PAGE.
- If the user says "N pages" (N > 1) → produce content that fills approximately N pages (~400 words/page).
- If the user says "multi-page" with no number → use best judgment.

RULES:
1. Generate ONLY the body content. No graphic letterheads.
2. Do not wrap the response in markdown code fences.
3. Tone: professional academic.
   - # DOCUMENT TITLE (UPPERCASE)
   - Metadata block for memos/letters:
     **MEMORANDUM NO. / REF NO.:** __________, s. 2026
     **FOR / TO:** ___________________________________
     **FROM:** _____________________________________
     **DATE:** _____________________________________
     **SUBJECT:** __________________________________
   - Section headings: ## 1.0 RATIONALE, ## 2.0 OBJECTIVES, etc.
   - Bullets "- " or numbers "1. ".
   - Underline blanks: "________________________".
   - Always end with formal signature blocks.
4. Ready for immediate printing.`;

/* ============================================================================
 * QUICK PROMPTS
 * ==========================================================================*/
const QUICK_PROMPTS = [
  { title: "Official Memorandum",
    prompt: "Draft an Official Campus Memorandum announcing the submission schedule and compliance guidelines for Midterm Grade Submissions and Instructional Materials for the current academic semester." },
  { title: "Activity & Budget Proposal",
    prompt: "Create a formal Academic Activity and Budget Proposal for a 2-day Faculty Capability Training on AI and RAG Governance Tools at CTU Argao Campus." },
  { title: "Course Syllabus (OBE)",
    prompt: "Generate an Outcomes-Based Education (OBE) Course Syllabus for IT 312: Advanced Database Systems, including Course Description, Intended Learning Outcomes, Assessment Tasks, and Grading Policy." },
  { title: "Faculty Endorsement Letter",
    prompt: "Write a formal Endorsement Letter from the Department Chairperson to the Campus Director recommending faculty research paper presentation at an international conference." },
  { title: "Academic Policy Resolution",
    prompt: "Draft an Academic Council Resolution approving the revised guidelines on Capstone Project Defense, Intellectual Property Rights, and Repository Archival for graduating BSIT students." },
  { title: "Terms of Reference (TOR)",
    prompt: "Draft Terms of Reference (TOR) for the Campus Accreditation and Quality Assurance Working Committee." },
  { title: "Service Invoice / Contract",
    prompt: "Create a formal Service Invoice and Deliverable Sign-off for institutional IT infrastructure consulting." },
  { title: "Certificate of Appreciation",
    prompt: "Draft a formal Certificate of Appreciation and Citation for a Keynote Resource Speaker at the Annual University IT Colloquium." },
];

/* ============================================================================
 * TYPES
 * ==========================================================================*/
type ImageAsset = {
  dataUrl: string; base64: string; mimeType: "png" | "jpg" | "gif" | "bmp";
  width: number; height: number; fileName: string;
};
type GenerationStatus = "idle" | "generating" | "importing" | "success" | "error";
type DownloadTarget = "docx" | null;
type DocAlign = "left" | "center" | "right" | "justify";
type AppView = "chooser" | "templates" | "compose" | "editor";
type RibbonTab = "home" | "layout" | "insert";
type LineSpacing = "1.15" | "1.5" | "2.0";

/** Helper: safely set a CSS custom property inline without TS complaining. */
function cssVars(vars: Record<string, string>): React.CSSProperties {
  return vars as unknown as React.CSSProperties;
}

/* ============================================================================
 * IMAGE HELPERS
 * ==========================================================================*/
const MAX_IMAGE_DIMENSION_PX = 1600;
const MAX_IMAGE_SIZE_MB = 5;
const HEADER_FOOTER_DISPLAY_HEIGHT_PX = 60;
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

function markdownToHtml(raw: string): string {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  let html = "";
  let inList = false;
  let inTable = false;
  let isTableHeader = true;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (!line) {
      if (inList) { html += "</ul>"; inList = false; }
      if (inTable) { html += "</tbody></table>"; inTable = false; }
      continue;
    }

    line = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    line = line.replace(/__(.*?)__/g, "<strong>$1</strong>");
    line = line.replace(/\*([^*]+)\*/g, "<em>$1</em>");

    if (line.startsWith("|")) {
      if (inList) { html += "</ul>"; inList = false; }
      if (/^[-:\s]+$/.test(line.replace(/\|/g, "").trim())) {
        if (inTable && isTableHeader) { html += "</thead><tbody>"; isTableHeader = false; }
        continue;
      }
      const cells = line.split("|").filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map((c) => c.trim());
      if (!inTable) {
        inTable = true; isTableHeader = true;
        html += `<table><thead><tr>`;
        cells.forEach((cell) => {
          html += `<th style="border: 1px solid #9ca3af; padding: 5px 8px; text-align: left; font-weight: 700; background-color: #f3f4f6;">${cell}</th>`;
        });
        html += `</tr>`;
      } else {
        const tag = isTableHeader ? "th" : "td";
        const style = isTableHeader
          ? "border: 1px solid #9ca3af; padding: 5px 8px; text-align: left; font-weight: 700;"
          : "border: 1px solid #d1d5db; padding: 5px 8px;";
        html += `<tr>`;
        cells.forEach((cell) => { html += `<${tag} style="${style}">${cell}</${tag}>`; });
        html += `</tr>`;
      }
      continue;
    } else if (inTable) {
      html += (isTableHeader ? "</thead>" : "</tbody>") + "</table>";
      inTable = false;
    }

    if (line.startsWith("# ")) { if (inList) { html += "</ul>"; inList = false; } html += `<h1>${line.slice(2)}</h1>`; }
    else if (line.startsWith("## ")) { if (inList) { html += "</ul>"; inList = false; } html += `<h2>${line.slice(3)}</h2>`; }
    else if (line.startsWith("### ")) { if (inList) { html += "</ul>"; inList = false; } html += `<h3>${line.slice(4)}</h3>`; }
    else if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!inList) { html += `<ul>`; inList = true; }
      html += `<li>${line.slice(2)}</li>`;
    } else if (/^\d+\.\s/.test(line)) {
      if (inList) { html += "</ul>"; inList = false; }
      const text = line.replace(/^\d+\.\s/, "");
      html += `<p><strong>${line.match(/^\d+\./)?.[0]}</strong> ${text}</p>`;
    } else {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<p>${line}</p>`;
    }
  }

  if (inList) html += "</ul>";
  if (inTable) html += (isTableHeader ? "</thead>" : "</tbody>") + "</table>";

  return html;
}

async function fileToImageAsset(file: File): Promise<ImageAsset> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) throw new Error("Please upload a PNG, JPG, or WEBP image.");
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) throw new Error(`Image must be smaller than ${MAX_IMAGE_SIZE_MB}MB.`);

  const rawDataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new window.Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not decode image."));
    el.src = rawDataUrl;
  });

  let { width, height } = img;
  if (width > MAX_IMAGE_DIMENSION_PX || height > MAX_IMAGE_DIMENSION_PX) {
    const scale = MAX_IMAGE_DIMENSION_PX / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported.");
  ctx.drawImage(img, 0, 0, width, height);

  const dataUrl = canvas.toDataURL("image/png");
  const base64 = dataUrl.split(",")[1];

  return { dataUrl, base64, mimeType: "png", width, height, fileName: file.name };
}

async function loadImageAssetFromUrl(url: string): Promise<ImageAsset | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const blob = await resp.blob();
    const fileName = url.split("/").pop() || "letterhead.png";
    const type = blob.type || (/\.jpe?g$/i.test(url) ? "image/jpeg" : "image/png");
    const file = new File([blob], fileName, { type });
    return await fileToImageAsset(file);
  } catch { return null; }
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

function scaledDocxDimensions(image: ImageAsset): { width: number; height: number } {
  const maxHeight = HEADER_FOOTER_DISPLAY_HEIGHT_PX;
  const aspect = image.width / image.height;
  const height = Math.min(maxHeight, image.height);
  const width = Math.round(height * aspect);
  return { width, height: Math.round(height) };
}

/* ============================================================================
 * PAGINATION SPLITTING HELPERS
 * ==========================================================================*/
function splitListAtHeight(listEl: HTMLElement, maxHeight: number): { firstHtml: string; restEl: HTMLElement } | null {
  const items = Array.from(listEl.children).filter((c) => c.tagName === "LI") as HTMLElement[];
  if (items.length < 2) return null;

  const listTop = listEl.getBoundingClientRect().top;
  let splitIndex = -1;
  for (let i = 0; i < items.length; i++) {
    const itemBottom = items[i].getBoundingClientRect().bottom;
    if (itemBottom - listTop <= maxHeight) splitIndex = i;
    else break;
  }
  if (splitIndex < 0 || splitIndex >= items.length - 1) return null;

  const firstEl = document.createElement(listEl.tagName);
  const restEl = document.createElement(listEl.tagName);
  Array.from(listEl.attributes).forEach((attr) => {
    firstEl.setAttribute(attr.name, attr.value);
    restEl.setAttribute(attr.name, attr.value);
  });
  items.forEach((li, idx) => {
    const cloneLi = li.cloneNode(true) as HTMLElement;
    (idx <= splitIndex ? firstEl : restEl).appendChild(cloneLi);
  });
  return { firstHtml: firstEl.outerHTML, restEl };
}

/** Split a table between rows. The header row(s) are repeated on the continuation. */
function splitTableAtHeight(table: HTMLElement, maxHeight: number): { firstHtml: string; restEl: HTMLElement } | null {
  const rows = Array.from(table.querySelectorAll("tbody > tr")) as HTMLElement[];
  if (rows.length < 2) return null;

  const limit = maxHeight - 10;
  const top = table.getBoundingClientRect().top;
  let splitIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].getBoundingClientRect().bottom - top <= limit) splitIndex = i;
    else break;
  }
  if (splitIndex < 0 || splitIndex >= rows.length - 1) return null;

  const firstEl = table.cloneNode(true) as HTMLElement;
  const restEl = table.cloneNode(true) as HTMLElement;
  firstEl.querySelectorAll("tbody > tr").forEach((r, i) => { if (i > splitIndex) r.remove(); });
  restEl.querySelectorAll("tbody > tr").forEach((r, i) => { if (i <= splitIndex) r.remove(); });
  return { firstHtml: firstEl.outerHTML, restEl };
}

function splitElementAtHeight(el: HTMLElement, maxHeight: number): { firstHtml: string; restEl: HTMLElement } | null {
  const elTop = el.getBoundingClientRect().top;
  const collectTextNodes = (root: Node): Text[] => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    let n: Node | null;
    while ((n = walker.nextNode())) nodes.push(n as Text);
    return nodes;
  };
  const textNodes = collectTextNodes(el);
  const totalLen = textNodes.reduce((sum, t) => sum + (t.textContent?.length || 0), 0);
  if (totalLen < 2) return null;

  const rangeAtOffset = (root: Node, nodes: Text[], offset: number): Range => {
    const range = document.createRange();
    range.setStart(root, 0);
    let remaining = offset;
    for (const tn of nodes) {
      const len = tn.textContent?.length || 0;
      if (remaining <= len) { range.setEnd(tn, Math.max(0, remaining)); return range; }
      remaining -= len;
    }
    range.setEnd(root, root.childNodes.length);
    return range;
  };
  const bottomAtOffset = (offset: number): number => {
    const range = rangeAtOffset(el, textNodes, offset);
    const rects = range.getClientRects();
    return rects.length ? rects[rects.length - 1].bottom : elTop;
  };

  if (bottomAtOffset(1) - elTop > maxHeight) return null;

  let lo = 1;
  let hi = totalLen;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (bottomAtOffset(mid) - elTop <= maxHeight) lo = mid;
    else hi = mid - 1;
  }
  let splitOffset = lo;
  if (splitOffset >= totalLen - 1) return null;

  let combined = "";
  for (const tn of textNodes) combined += tn.textContent || "";
  let snapped = splitOffset;
  let guard = 0;
  while (snapped > 0 && guard < 60 && !/\s/.test(combined[snapped - 1] || "")) { snapped--; guard++; }
  if (snapped > 0 && splitOffset - snapped < 60) splitOffset = snapped;
  if (splitOffset <= 0) return null;

  const clone = el.cloneNode(true) as HTMLElement;
  const cloneTextNodes = collectTextNodes(clone);
  const boundary = rangeAtOffset(clone, cloneTextNodes, splitOffset);

  const firstRange = document.createRange();
  firstRange.setStart(clone, 0);
  firstRange.setEnd(boundary.endContainer, boundary.endOffset);
  const firstContents = firstRange.cloneContents();

  const removeRange = document.createRange();
  removeRange.setStart(clone, 0);
  removeRange.setEnd(boundary.endContainer, boundary.endOffset);
  removeRange.deleteContents();

  const restFirstText = collectTextNodes(clone)[0];
  if (restFirstText && restFirstText.textContent) {
    restFirstText.textContent = restFirstText.textContent.replace(/^ +/, "");
  }

  const firstEl = document.createElement(el.tagName);
  Array.from(el.attributes).forEach((attr) => firstEl.setAttribute(attr.name, attr.value));
  firstEl.appendChild(firstContents);
  return { firstHtml: firstEl.outerHTML, restEl: clone };
}

function sanitizeFileName(input: string): string {
  return input.trim().slice(0, 40).replace(/[^a-z0-9\s-]/gi, "").replace(/\s+/g, "_") || "CTU_Document";
}

/** Institutional memos/proposals/letters are realistically 1-5 pages; capping
 *  here keeps generations fast, keeps the browser-side pagination snappy, and
 *  stays well clear of any model's default completion-length limit. */
const MAX_TARGET_PAGES = 5;

function parseTargetPageCount(prompt: string): number | null {
  const p = (prompt || "").toLowerCase();
  if (/multi[-\s]?page/.test(p)) return MAX_TARGET_PAGES;
  const wordMatch = p.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\s*page/);
  if (wordMatch) {
    const map: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
    const n = map[wordMatch[1]] ?? 1;
    return Math.min(n, MAX_TARGET_PAGES);
  }
  const numMatch = p.match(/(\d+)\s*page/);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    if (n >= 1) return Math.min(n, MAX_TARGET_PAGES);
  }
  return 1;
}

function parseFontSizePt(styleStr: string, baseSizePt: number): number | null {
  if (!styleStr) return null;
  const match = styleStr.match(/([\d.]+)\s*(pt|px|em)?/i);
  if (!match) return null;
  const val = parseFloat(match[1]);
  if (isNaN(val)) return null;
  const unit = (match[2] || "pt").toLowerCase();
  if (unit === "px") return Math.round((val * 72) / 96);
  if (unit === "em") return Math.round(val * baseSizePt);
  return Math.round(val);
}

/* ============================================================================
 * FIT-TO-PAGE HELPERS
 * ==========================================================================*/

/** Reduce explicit font sizes on any element that carries one inline. */
function reduceExplicitFontSizes(measure: HTMLElement, delta: number): void {
  measure.querySelectorAll<HTMLElement>("[style*='font-size']").forEach((el) => {
    const current = parseFloat(el.style.fontSize);
    if (!isNaN(current) && current > MIN_FIT_FONT_PT) {
      el.style.fontSize = `${Math.max(MIN_FIT_FONT_PT, current - delta)}pt`;
    }
  });
}

/**
 * Aggressive single-page fit.
 *
 * Line-height is NEVER compressed — the user's chosen line spacing is a
 * hard contract that survives into editor, preview and print. The fitter
 * only tightens margins and, as a last resort, reduces the font size down
 * to MIN_FIT_FONT_PT. If a document can't fit at the user's spacing even
 * after margins are tight and font is at the floor, it correctly flows
 * onto additional pages instead of silently tightening the leading.
 */
function aggressiveFitToOnePage(
  measure: HTMLElement,
  targetHeight: number,
  baseFontPt: number
): void {
  const MAX_STEPS = 200;
  const SPACING_RAMP = 18;

  let fontPt = baseFontPt;
  let steps = 0;
  let prevHeight = Infinity;

  while (measure.offsetHeight > targetHeight && steps < MAX_STEPS) {
    steps++;
    const p = Math.min(1, steps / SPACING_RAMP);

    const h1Margin = Math.max(0, 14 - p * 14);
    const h2MarginTop = Math.max(1, 14 - p * 13);
    const h2MarginBottom = Math.max(0, 6 - p * 6);
    const h3MarginTop = Math.max(1, 10 - p * 9);
    const h3MarginBottom = Math.max(0, 4 - p * 4);
    const pMarginBottom = Math.max(0, 6 - p * 6);
    const ulMarginBottom = Math.max(0, 8 - p * 8);
    const liMarginBottom = Math.max(0, 4 - p * 4);
    const tableMargin = Math.max(0, 8 - p * 8);
    const ulPaddingLeft = Math.max(12, 24 - p * 12);
    const h2PaddingBottom = Math.max(0, 2 - p * 2);

    measure.querySelectorAll("h1").forEach((el) => {
      (el as HTMLElement).style.margin = `0 0 ${h1Margin}px 0`;
    });
    measure.querySelectorAll("h2").forEach((el) => {
      const h = el as HTMLElement;
      h.style.margin = `${h2MarginTop}px 0 ${h2MarginBottom}px 0`;
      h.style.paddingBottom = `${h2PaddingBottom}px`;
    });
    measure.querySelectorAll("h3").forEach((el) => {
      (el as HTMLElement).style.margin = `${h3MarginTop}px 0 ${h3MarginBottom}px 0`;
    });
    measure.querySelectorAll("p").forEach((el) => {
      (el as HTMLElement).style.margin = `0 0 ${pMarginBottom}px 0`;
    });
    measure.querySelectorAll("ul, ol").forEach((el) => {
      const h = el as HTMLElement;
      h.style.margin = `0 0 ${ulMarginBottom}px 0`;
      h.style.paddingLeft = `${ulPaddingLeft}px`;
    });
    measure.querySelectorAll("li").forEach((el) => {
      (el as HTMLElement).style.marginBottom = `${liMarginBottom}px`;
    });
    measure.querySelectorAll("table").forEach((el) => {
      (el as HTMLElement).style.margin = `${tableMargin}px 0`;
    });

    const h = measure.offsetHeight;
    if (h <= targetHeight) break;

    if (p >= 1 && fontPt > MIN_FIT_FONT_PT) {
      fontPt = Math.max(MIN_FIT_FONT_PT, fontPt - 0.5);
      measure.style.fontSize = `${fontPt}pt`;
      reduceExplicitFontSizes(measure, 0.5);
    } else if (h >= prevHeight - 0.5) {
      // Font is at the floor and no explicit sizes remain (or the last pass
      // produced no height change at all). Nothing more to gain — stop.
      break;
    }
    prevHeight = h;
  }
}

/** Moderate shrink toward an N-page target (N > 1). Never touches line-height. */
function moderateShrinkForMultiPage(measure: HTMLElement, maxTotalHeight: number, baseFontPt: number): void {
  const MAX_STEPS = 30;
  let fontPt = baseFontPt;
  let steps = 0;

  while (measure.offsetHeight > maxTotalHeight && steps < MAX_STEPS) {
    steps++;
    const intensity = steps * 0.7;

    measure.querySelectorAll("h1, h2, h3, p, ul, ol, li, table").forEach((el) => {
      const h = el as HTMLElement;
      const tag = h.tagName.toLowerCase();
      if (tag === "h1") { h.style.margin = "0 0 6px 0"; h.style.fontSize = `${Math.max(1.0, 1.3 - intensity * 0.02)}em`; }
      else if (tag === "h2") { h.style.margin = "6px 0 2px 0"; h.style.fontSize = `${Math.max(0.85, 1.02 - intensity * 0.015)}em`; h.style.paddingBottom = "1px"; }
      else if (tag === "h3") { h.style.margin = "4px 0 2px 0"; }
      else if (tag === "p") { h.style.margin = "0 0 3px 0"; }
      else if (tag === "ul" || tag === "ol") { h.style.margin = "0 0 3px 0"; h.style.paddingLeft = "20px"; }
      else if (tag === "li") { h.style.margin = "0 0 2px 0"; }
      else if (tag === "table") { h.style.margin = "4px 0"; }
    });

    if (measure.offsetHeight > maxTotalHeight && fontPt > MIN_FIT_FONT_PT) {
      fontPt = Math.max(MIN_FIT_FONT_PT, fontPt - 0.5);
      measure.style.fontSize = `${fontPt}pt`;
    }
    if (fontPt <= MIN_FIT_FONT_PT) {
      reduceExplicitFontSizes(measure, 0.5);
    }
  }
}

/** Wrap the trailing signature block (plus the preceding paragraph) as one atomic unit. */
const SIG_BLOCK_REGEX =
  /\b(prepared\s+by|reviewed\s+by|approved\s+by|recommending\s+approval|recommended\s+by|noted\s+by|attested\s+by|conforme|submitted\s+by|respectfully\s+submitted)\b/i;

function wrapTrailingSignatureBlock(measure: HTMLElement, maxHeight: number = Infinity): void {
  const children = Array.from(measure.children) as HTMLElement[];
  if (children.length < 3) return;

  let firstSigIdx = -1;
  for (let i = Math.max(0, children.length - SIGNATURE_LOOKBACK_BLOCKS); i < children.length; i++) {
    const text = (children[i].textContent || "").trim();
    if (SIG_BLOCK_REGEX.test(text)) { firstSigIdx = i; break; }
  }
  if (firstSigIdx < 1) return;

  const wrapStart = firstSigIdx - 1;
  const toWrap = children.slice(wrapStart);

  const blockHeight = toWrap.reduce((sum, el) => sum + el.offsetHeight, 0);
  if (blockHeight > maxHeight) return;

  toWrap.forEach((el) => { if (el.parentNode === measure) measure.removeChild(el); });

  const wrapper = document.createElement("div");
  wrapper.className = "signature-block-group";
  wrapper.setAttribute("data-signature-block", "1");
  wrapper.style.cssText = "page-break-inside: avoid; break-inside: avoid;";
  toWrap.forEach((el) => wrapper.appendChild(el));
  measure.appendChild(wrapper);
}

/**
 * Split the measure element's children into an array of fragment HTML strings.
 *
 * Fast path: if the whole document already fits inside one page, return it
 * as ONE fragment without running the split loop. The loop measures real
 * rendered positions (getBoundingClientRect), so margin collapsing is
 * respected — adjacent margins never count twice.
 */
function splitHtmlIntoFragments(measure: HTMLElement, pageHeight: number): string[] {
  const children = Array.from(measure.children) as HTMLElement[];
  if (children.length === 0) return [measure.innerHTML];

  // ── Fast path: the whole thing already fits on one page. ────────────────
  if (measure.offsetHeight <= pageHeight + 4) {
    return [measure.innerHTML];
  }

  const fragments: string[] = [];
  const queue: HTMLElement[] = [...children];
  let qIndex = 0;
  let currentFragmentBlocks: string[] = [];
  let pageStartTop: number | null = null;
  const MIN_USEFUL_SPACE = 32;

  while (qIndex < queue.length) {
    const el = queue[qIndex];
    qIndex++;

    const tag = el.tagName.toLowerCase();
    const rect = el.getBoundingClientRect();
    const elTop = rect.top;
    const elBottom = rect.bottom;
    const elHeight = elBottom - elTop;

    const isAtomic = tag === "div" || el.getAttribute("data-signature-block") === "1";

    const trySplit = (maxHeight: number) => {
      if (maxHeight < MIN_USEFUL_SPACE) return null;
      if (isAtomic) return null;
      if (tag === "ul" || tag === "ol") return splitListAtHeight(el, maxHeight);
      if (tag === "table") return splitTableAtHeight(el, maxHeight);
      if (tag === "p") return splitElementAtHeight(el, maxHeight);
      return null;
    };

    if (pageStartTop === null) {
      if (elHeight > pageHeight) {
        const split = trySplit(pageHeight);
        if (split) {
          fragments.push(split.firstHtml);
          el.insertAdjacentElement("afterend", split.restEl);
          queue.splice(qIndex, 0, split.restEl);
          continue;
        }
      }
      currentFragmentBlocks.push(el.outerHTML);
      pageStartTop = elTop;
      continue;
    }

    const usedHeight = elBottom - pageStartTop;
    if (usedHeight <= pageHeight) {
      currentFragmentBlocks.push(el.outerHTML);
      continue;
    }

    const spaceForEl = pageHeight - (elTop - pageStartTop);
    const split = spaceForEl >= MIN_USEFUL_SPACE ? trySplit(spaceForEl) : null;

    if (split) {
      currentFragmentBlocks.push(split.firstHtml);
      fragments.push(currentFragmentBlocks.join(""));
      currentFragmentBlocks = [];
      pageStartTop = null;
      el.insertAdjacentElement("afterend", split.restEl);
      queue.splice(qIndex, 0, split.restEl);
      continue;
    }

    if (currentFragmentBlocks.length > 0) {
      fragments.push(currentFragmentBlocks.join(""));
      currentFragmentBlocks = [];
      pageStartTop = null;
    }

    if (elHeight > pageHeight) {
      const splitFresh = trySplit(pageHeight);
      if (splitFresh) {
        fragments.push(splitFresh.firstHtml);
        el.insertAdjacentElement("afterend", splitFresh.restEl);
        queue.splice(qIndex, 0, splitFresh.restEl);
        continue;
      }
    }
    currentFragmentBlocks.push(el.outerHTML);
    pageStartTop = elTop;
  }

  if (currentFragmentBlocks.length > 0) {
    fragments.push(currentFragmentBlocks.join(""));
  }

  return fragments;
}

/* ============================================================================
 * SINGLE-PAGE HTML BUILDER (preview + print share this)
 * ==========================================================================*/
interface SinglePageOptions {
  fragment: string;
  pageNum: number;
  totalPages: number;
  cfg: PageSizeConfig;
  fontCss: string;
  fontSizePt: number;
  lineSpacing: string;
  alignment: DocAlign;
  headerUrl: string | null;
  footerUrl: string | null;
}

function buildSinglePageHtml(opts: SinglePageOptions): string {
  const {
    fragment, pageNum, totalPages, cfg, fontCss, fontSizePt,
    lineSpacing, alignment, headerUrl, footerUrl,
  } = opts;

  const hasHeader = !!headerUrl;
  const hasFooter = !!footerUrl;

  const pageStyle =
    `width:${cfg.cssWidth}px;height:${cfg.cssHeight}px;` +
    `padding:${PAGE_PADDING_TOP}px ${PAGE_PADDING_RIGHT}px ${PAGE_PADDING_BOTTOM}px ${PAGE_PADDING_LEFT}px;` +
    `box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;` +
    `background:#ffffff;font-family:${fontCss};font-size:${fontSizePt}pt;` +
    `color:#111827;line-height:${lineSpacing};position:relative;`;

  const headerStyle =
    `height:${HEADER_AREA_HEIGHT}px;flex-shrink:0;display:flex;align-items:center;justify-content:center;overflow:hidden;`;
  const headerImgStyle =
    `max-height:${MAX_HEADER_IMG_HEIGHT}px;max-width:100%;height:auto;width:auto;display:block;object-fit:contain;`;

  const contentStyle =
    `flex:1 1 auto;min-height:0;overflow:hidden;text-align:${alignment};` +
    `--doc-line-height:${lineSpacing};`;

  const footerStyle =
    `height:${hasFooter ? FOOTER_AREA_HEIGHT : FOOTER_MIN_HEIGHT}px;` +
    `flex-shrink:0;display:flex;flex-direction:column;justify-content:flex-end;` +
    `padding-top:4px;border-top:1px solid #E5E7EB;position:relative;overflow:hidden;`;
  const footerImgStyle =
    `max-height:${MAX_FOOTER_IMG_HEIGHT}px;max-width:100%;height:auto;width:auto;display:inline-block;object-fit:contain;`;

  const pageNumStyle = `position:absolute;right:0;bottom:0;font-size:10px;color:#9CA3AF;font-weight:600;`;

  const headerHtml = hasHeader
    ? `<div style="${headerStyle}"><img src="${headerUrl}" style="${headerImgStyle}" alt="" /></div>`
    : "";

  const footerHtml = `
    <div style="${footerStyle}">
      ${hasFooter ? `<div style="text-align:center;"><img src="${footerUrl}" style="${footerImgStyle}" alt="" /></div>` : ""}
      <div style="${pageNumStyle}">Page ${pageNum} of ${totalPages}</div>
    </div>
  `;

  return `<div style="${pageStyle}">${headerHtml}<div class="wysiwyg-content" style="${contentStyle}">${fragment}</div>${footerHtml}</div>`;
}

/* ============================================================================
 * DOCX BUILDER
 * ==========================================================================*/
async function buildDocxBlobFromHtml(
  html: string, docFontKey: DocFont, docFontSizePt: number, pageSizeKey: PageSize,
  docAlignMode: DocAlign, headerImg: ImageAsset | null, noHdr: boolean,
  footerImg: ImageAsset | null, noFtr: boolean
): Promise<Blob> {
  const temp = document.createElement("div");
  temp.innerHTML = html;
  const defaultFontName = FONT_CONFIG[docFontKey].docx;
  const baseHalfPt = docFontSizePt * 2;
  const currentSizeConfig = PAGE_SIZES[pageSizeKey];
  const children: (Paragraph | Table)[] = [];

  const base64ToBytes = (b64: string): Uint8Array => {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  };

  const styleToFont = (styleFamily: string | undefined, fallback: string): string => {
    if (!styleFamily) return fallback;
    if (styleFamily.includes("Times")) return "Times New Roman";
    if (styleFamily.includes("Arial") || styleFamily.includes("Calibri")) return "Calibri";
    if (styleFamily.includes("Courier")) return "Courier New";
    if (styleFamily.includes("Georgia")) return "Georgia";
    return fallback;
  };

  type RunNode =
    | { kind: "text"; text: string; font: string; size: number; bold: boolean; italics: boolean; underline: boolean; strike: boolean }
    | { kind: "image"; data: Uint8Array; width: number; height: number; type: "png" | "jpg" };

  const extractRuns = (
    node: Node,
    inherited: { bold?: boolean; italics?: boolean; underline?: boolean; strike?: boolean; font?: string; size?: number } = {}
  ): RunNode[] => {
    const bold = inherited.bold ?? false;
    const italics = inherited.italics ?? false;
    const underline = inherited.underline ?? false;
    const strike = inherited.strike ?? false;
    const font = inherited.font ?? defaultFontName;
    const size = inherited.size ?? baseHalfPt;
    const out: RunNode[] = [];

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text) out.push({ kind: "text", text, font, size, bold, italics, underline, strike });
      return out;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return out;

    const el = node as HTMLElement;
    const tag = el.tagName;

    if (tag === "IMG") {
      const src = el.getAttribute("src") || "";
      const b64 = src.startsWith("data:") ? src.split(",")[1] : "";
      if (b64) {
        const naturalW = parseFloat(el.getAttribute("width") || "") || 100;
        const naturalH = parseFloat(el.getAttribute("height") || "") || 60;
        const displayH = Math.min(100, naturalH) || naturalH;
        const displayW = Math.round(displayH * (naturalW / naturalH));
        const mime = src.split(";")[0].split(":")[1] || "image/png";
        out.push({ kind: "image", data: base64ToBytes(b64), width: displayW, height: Math.round(displayH),
          type: mime.includes("jpeg") || mime.includes("jpg") ? "jpg" : "png" });
      }
      return out;
    }

    const isBold = bold || tag === "STRONG" || tag === "B" || el.style.fontWeight === "bold" || parseInt(el.style.fontWeight || "0", 10) >= 600;
    const isItalic = italics || tag === "EM" || tag === "I" || el.style.fontStyle === "italic";
    const isUnderline = underline || tag === "U" || el.style.textDecoration.includes("underline");
    const isStrike = strike || ["STRIKE", "S", "DEL"].includes(tag) || el.style.textDecoration.includes("line-through");
    const nextFont = el.style.fontFamily ? styleToFont(el.style.fontFamily, font) : font;
    let nextSize = size;
    if (el.style.fontSize) {
      const pt = parseFontSizePt(el.style.fontSize, Math.round(size / 2));
      if (pt) nextSize = pt * 2;
    }

    for (const child of Array.from(el.childNodes)) {
      out.push(...extractRuns(child, { bold: isBold, italics: isItalic, underline: isUnderline, strike: isStrike, font: nextFont, size: nextSize }));
    }
    return out;
  };

  const runsToDocx = (runs: RunNode[]): (TextRun | ImageRun)[] =>
    runs.map((r) => {
      if (r.kind === "image") {
        return new ImageRun({ data: r.data, transformation: { width: r.width, height: r.height }, type: r.type });
      }
      return new TextRun({ text: r.text, font: r.font, bold: r.bold, italics: r.italics,
        underline: r.underline ? {} : undefined, strike: r.strike, size: r.size });
    });

  const blockAlign = (el: HTMLElement, fallback: (typeof AlignmentType)[keyof typeof AlignmentType]) => {
    const a = (el.style.textAlign || "").toLowerCase();
    if (a === "center") return AlignmentType.CENTER;
    if (a === "right") return AlignmentType.RIGHT;
    if (a === "justify") return AlignmentType.JUSTIFIED;
    if (a === "left") return AlignmentType.LEFT;
    return fallback;
  };

  const nilBorders = {
    top:    { style: BorderStyle.NIL, size: 0, color: "FFFFFF" },
    bottom: { style: BorderStyle.NIL, size: 0, color: "FFFFFF" },
    left:   { style: BorderStyle.NIL, size: 0, color: "FFFFFF" },
    right:  { style: BorderStyle.NIL, size: 0, color: "FFFFFF" },
  };

  const buildDocxTable = (tableEl: HTMLTableElement): Table => {
    const anyBordered = Array.from(tableEl.querySelectorAll("td, th")).some((c) => {
      const style = (c as HTMLElement).style;
      const border = style.border || style.borderTop || style.borderLeft || style.borderRight || style.borderBottom;
      return border && !/none|0/.test(border);
    });
    const borderless = !anyBordered;

    const rows = Array.from(
      tableEl.querySelectorAll(":scope > tbody > tr, :scope > thead > tr, :scope > tr")
    ) as HTMLTableRowElement[];

    const tableRows = rows.map((tr) => {
      const cells = Array.from(tr.children).filter((c) => c.tagName === "TD" || c.tagName === "TH") as HTMLTableCellElement[];
      const totalCells = cells.length || 1;

      return new TableRow({
        children: cells.map((cell) => {
          const wRaw = cell.getAttribute("width") || cell.style.width;
          let pct = 100 / totalCells;
          if (wRaw && wRaw.endsWith("%")) pct = parseFloat(wRaw);

          const parts = (cell.innerHTML || "").split(/<br\s*\/?>/i);
          const cellParagraphs: Paragraph[] = [];

          for (const part of parts) {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = part;
            const runs = runsToDocx(extractRuns(wrapper));
            cellParagraphs.push(new Paragraph({ children: runs.length ? runs : [new TextRun("")], spacing: { before: 20, after: 20 } }));
          }
          if (cellParagraphs.length === 0) cellParagraphs.push(new Paragraph({ children: [new TextRun("")] }));

          return new TableCell({
            width: { size: Math.round(pct * 10), type: WidthType.PERCENTAGE },
            borders: borderless ? nilBorders : undefined,
            margins: { top: 40, bottom: 40, left: 60, right: 60 },
            children: cellParagraphs,
          });
        }),
      });
    });

    return new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: borderless ? nilBorders : undefined,
    });
  };

  const defaultAlign =
    docAlignMode === "center" ? AlignmentType.CENTER :
    docAlignMode === "right"  ? AlignmentType.RIGHT :
    docAlignMode === "justify" ? AlignmentType.JUSTIFIED :
    AlignmentType.LEFT;

  for (const block of Array.from(temp.children)) {
    const el = block as HTMLElement;
    const tag = el.tagName.toLowerCase();
    if (tag === "table") { children.push(buildDocxTable(el as HTMLTableElement)); continue; }

    if (tag === "h1") {
      const runs = runsToDocx(extractRuns(el, { bold: true }));
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 140, after: 260 },
        children: runs.map((r) => r instanceof TextRun
          ? new TextRun({ text: (el.textContent || "").toUpperCase(), font: defaultFontName, bold: true, size: Math.round(baseHalfPt * 1.55) })
          : r),
      }));
    } else if (tag === "h2") {
      const runs = runsToDocx(extractRuns(el, { bold: true }));
      children.push(new Paragraph({
        alignment: blockAlign(el, defaultAlign),
        spacing: { before: 240, after: 120 },
        children: runs.map((r) => r instanceof TextRun
          ? new TextRun({ text: (el.textContent || ""), font: defaultFontName, bold: true, underline: {}, size: Math.round(baseHalfPt * 1.2) })
          : r),
      }));
    } else if (tag === "h3") {
      const runs = runsToDocx(extractRuns(el, { bold: true }));
      children.push(new Paragraph({
        alignment: blockAlign(el, defaultAlign),
        spacing: { before: 180, after: 100 },
        children: runs.map((r) => r instanceof TextRun
          ? new TextRun({ text: (el.textContent || ""), font: defaultFontName, bold: true, underline: {}, size: Math.round(baseHalfPt * 1.05) })
          : r),
      }));
    } else if (tag === "ul" || tag === "ol") {
      for (const li of Array.from(el.querySelectorAll("li"))) {
        children.push(new Paragraph({
          bullet: { level: 0 },
          alignment: blockAlign(li as HTMLElement, defaultAlign),
          spacing: { before: 40, after: 40 },
          children: runsToDocx(extractRuns(li)),
        }));
      }
    } else {
      const innerRuns = runsToDocx(extractRuns(el));
      if (innerRuns.length) {
        children.push(new Paragraph({ alignment: blockAlign(el, defaultAlign), spacing: { before: 60, after: 100 }, children: innerRuns }));
      }
    }
  }

  const headerContent = !noHdr && headerImg
    ? new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new ImageRun({ data: base64ToUint8Array(headerImg.base64), transformation: scaledDocxDimensions(headerImg), type: "png" })] })] })
    : new Header({ children: [new Paragraph("")] });

  const footerContent = !noFtr && footerImg
    ? new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new ImageRun({ data: base64ToUint8Array(footerImg.base64), transformation: scaledDocxDimensions(footerImg), type: "png" })] })] })
    : new Footer({ children: [new Paragraph("")] });

  const doc = new Document({
    sections: [{
      properties: {
        page: { size: { width: currentSizeConfig.docxWidth, height: currentSizeConfig.docxHeight },
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
      },
      headers: { default: headerContent },
      footers: { default: footerContent },
      children: children.length > 0 ? children : [new Paragraph({ text: "CTU Document" })],
    }],
    styles: { default: { document: { run: { font: defaultFontName, size: baseHalfPt } } } },
  });

  return await Packer.toBlob(doc);
}

/* ============================================================================
 * MAIN COMPONENT
 * ==========================================================================*/
export function DocumentGenerator() {
  const [view, setView] = useState<AppView>("chooser");
  const [entryMode, setEntryMode] = useState<"ai" | "template">("ai");
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  const [prompt, setPrompt] = useState("");
  const [showAllPrompts, setShowAllPrompts] = useState(false);
  const [activeRibbonTab, setActiveRibbonTab] = useState<RibbonTab>("home");

  const [pageSize, setPageSize] = useState<PageSize>("short");
  const [docFont] = useState<DocFont>("serif");
  const [docFontSize] = useState(12);
  const [docAlign] = useState<DocAlign>("left");
  const [lineSpacing, setLineSpacing] = useState<LineSpacing>("1.5");

  const [activeStyles, setActiveStyles] = useState({
    bold: false, italic: false, underline: false, strike: false,
    ul: false, ol: false, alignLeft: true, alignCenter: false, alignRight: false, alignJustify: false,
    font: "serif" as DocFont,
  });

  const [displayedFontSize, setDisplayedFontSize] = useState(docFontSize);
  const [wordCount, setWordCount] = useState(0);
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<DownloadTarget>(null);

  const [showEditor, setShowEditor] = useState(true);

  const [headerImage, setHeaderImage] = useState<ImageAsset | null>(null);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [footerImage, setFooterImage] = useState<ImageAsset | null>(null);
  const [footerError, setFooterError] = useState<string | null>(null);

  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const fontDropdownRef = useRef<HTMLDivElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const footerInputRef = useRef<HTMLInputElement>(null);

  const [masterHtml, setMasterHtml] = useState("");
  const [previewFragments, setPreviewFragments] = useState<string[]>([]);
  // Typography the paginator actually measured with. Pages MUST be drawn with
  // the same values. `lineHeight` is always the user's chosen spacing — the
  // fitter is forbidden from compressing it.
  const [fit, setFit] = useState<{ fontPt: number; lineHeight: string } | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const isApplyingExternalHtmlRef = useRef(false);

  // Tracks whether the document has been customized since it was loaded.
  // Set to TRUE by:
  //   • typing in the editor (`handleEditorInput`)
  //   • changing Line Spacing in the Layout ribbon
  //   • changing Page Size in the Layout ribbon
  //
  // While this is FALSE, an AI-generated draft is aggressively squeezed onto
  // its requested page count (default: 1) — the fitter may shrink the font
  // down to MIN_FIT_FONT_PT to make it fit.
  //
  // Once it becomes TRUE, the aggressive squeeze is disabled: the document
  // simply flows onto however many pages its content + chosen typography
  // require. Only a small overflow (≤ 20% of a page) is still absorbed onto
  // one page, so a lone spilling line or signature block is never orphaned.
  const hasUserEditedRef = useRef(false);

  const savedRangeRef = useRef<Range | null>(null);
  const suppressNextStyleSyncRef = useRef<boolean>(false);
  const historyStackRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const initialHtmlRef = useRef<string>("");

  /* ── Preview scale: fit the page width into the panel at any browser zoom ─ */
  const previewWrapRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);
  useEffect(() => {
    const el = previewWrapRef.current;
    if (!el) return;
    const pageW = PAGE_SIZES[pageSize].cssWidth;
    const update = () => {
      const available = el.clientWidth - 32;
      setPreviewScale(Math.max(0.3, Math.min(1, available / pageW)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pageSize, showEditor, view]);

  /* ── New lines in the editor become <p> (splittable), not <div> ───────── */
  useEffect(() => {
    if (view !== "editor") return;
    try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch {}
  }, [view]);

  /* ── Default Letterhead Bootstrap ─────────────────────────────────────── */
  const defaultsAppliedRef = useRef(false);
  useEffect(() => {
    if (defaultsAppliedRef.current) return;
    defaultsAppliedRef.current = true;

    let cancelled = false;
    (async () => {
      const [defHeader, defFooter] = await Promise.all([
        loadImageAssetFromUrl(DEFAULT_HEADER_URL),
        loadImageAssetFromUrl(DEFAULT_FOOTER_URL),
      ]);
      if (cancelled) return;
      if (defHeader) setHeaderImage((prev) => prev ?? defHeader);
      if (defFooter) setFooterImage((prev) => prev ?? defFooter);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(e.target as Node)) setShowFontDropdown(false);
    };
    if (showFontDropdown) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showFontDropdown]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (isApplyingExternalHtmlRef.current) return;
    if (el.innerHTML !== masterHtml) {
      isApplyingExternalHtmlRef.current = true;
      el.innerHTML = masterHtml;
      isApplyingExternalHtmlRef.current = false;
    }
  }, [masterHtml, view, showEditor]);

  /* ── Preview pagination (fully re-run from scratch each time) ─────────── */
  const computePreviewFragments = (sourceHtml?: string) => {
    const fullHtml = sourceHtml ?? masterHtml;
    if (!fullHtml || !fullHtml.trim()) {
      setFit(null);
      setPreviewFragments([""]);
      return;
    }

    const cfg = PAGE_SIZES[pageSize];
    const hasHeader = !!headerImage;
    const hasFooter = !!footerImage;

    const contentAreaHeight = getContentAreaHeight(cfg.cssHeight, hasHeader, hasFooter);
    const effectiveContentHeight = Math.max(80, contentAreaHeight - PAGE_FIT_SAFETY_PX);
    const contentAreaWidth = getContentAreaWidth(cfg.cssWidth);
    const baseLineHeight = parseFloat(lineSpacing) || 1.5;

    // Build a fresh measure container for THIS run.
    const measure = document.createElement("div");
    measure.className = "wysiwyg-content";
    measure.style.cssText = `
      position: absolute;
      visibility: hidden;
      top: -99999px;
      left: -99999px;
      width: ${contentAreaWidth}px;
      font-family: ${FONT_CONFIG[docFont].css};
      font-size: ${docFontSize}pt;
      color: #111827;
      box-sizing: border-box;
      overflow: hidden;
    `;
    // Line-height is written ONCE here and never changed by the fitter.
    measure.style.setProperty("--doc-line-height", String(baseLineHeight));
    measure.innerHTML = fullHtml;
    document.body.appendChild(measure);

    // AI drafts get squeezed onto their requested page count — but ONLY for
    // the initial draft, before the user has typed anything OR changed the
    // line spacing / page size. Once the user has customized the document,
    // it flows at whatever size it naturally needs.
    const honourAiPageTarget = entryMode === "ai" && !hasUserEditedRef.current;
    let targetPageCount: number | null = honourAiPageTarget ? parseTargetPageCount(prompt) : null;
    if (!honourAiPageTarget && measure.offsetHeight <= effectiveContentHeight * SMALL_OVERFLOW_FIT_RATIO) {
      targetPageCount = 1;
    }

    // 1. Fit / shrink to the target page count. The fitter only touches
    //    margins and font size — NEVER line-height.
    if (targetPageCount === 1) {
      aggressiveFitToOnePage(measure, effectiveContentHeight, docFontSize);
    } else if (targetPageCount !== null && targetPageCount > 1) {
      const wasteBuffer = (targetPageCount - 1) * 60;
      const maxTotalHeight = Math.max(
        effectiveContentHeight,
        effectiveContentHeight * targetPageCount - wasteBuffer
      );
      moderateShrinkForMultiPage(measure, maxTotalHeight, docFontSize);
    }

    // Remember what the fitter did: pages must be drawn with it. Line-height
    // is unchanged from what we set above.
    const fitFontPt = parseFloat(measure.style.fontSize) || docFontSize;
    const fitLineHeight = String(baseLineHeight);

    // 2. Keep trailing signature block as a single unit
    wrapTrailingSignatureBlock(measure, effectiveContentHeight);

    // 3. Split into fragments
    let fragments = splitHtmlIntoFragments(measure, effectiveContentHeight);

    // 4. Retry once for a 1-page target if the first pass still yielded >1 page.
    if (targetPageCount === 1 && fragments.length > 1) {
      const retry = document.createElement("div");
      retry.className = "wysiwyg-content";
      retry.style.cssText = measure.style.cssText;
      retry.style.setProperty("--doc-line-height", String(baseLineHeight));
      retry.innerHTML = fullHtml;
      document.body.appendChild(retry);

      aggressiveFitToOnePage(retry, effectiveContentHeight, docFontSize);
      reduceExplicitFontSizes(retry, 0.5);
      reduceExplicitFontSizes(retry, 0.5);
      wrapTrailingSignatureBlock(retry, effectiveContentHeight);

      const retryFragments = splitHtmlIntoFragments(retry, effectiveContentHeight);
      if (retryFragments.length > 0 && retryFragments.length < fragments.length) {
        fragments = retryFragments;
      }

      document.body.removeChild(retry);
    }

    document.body.removeChild(measure);

    // 5. Strip trailing empty fragments (no leftover blank pages)
    while (fragments.length > 1) {
      const last = fragments[fragments.length - 1];
      const text = last.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
      if (text.length === 0) fragments.pop();
      else break;
    }

    const finalFragments = fragments.length > 0 ? fragments : [fullHtml];
    setFit({ fontPt: fitFontPt, lineHeight: fitLineHeight });
    setPreviewFragments(finalFragments);
  };

  const previewDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const schedulePreviewRebuild = (sourceHtml?: string) => {
    if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    previewDebounceRef.current = setTimeout(() => computePreviewFragments(sourceHtml), 40);
  };

  const rebuildPreviewNow = (sourceHtml?: string) => {
    if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    previewDebounceRef.current = null;
    computePreviewFragments(sourceHtml);
  };

  // Recompute whenever anything that affects pagination changes
  useEffect(() => {
    schedulePreviewRebuild();
    return () => { if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masterHtml, pageSize, docFont, docFontSize, lineSpacing, docAlign, headerImage, footerImage, view, entryMode]);

  useEffect(() => {
    if (view === "editor") schedulePreviewRebuild();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  useEffect(() => {
    const text = (masterHtml || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ");
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);
  }, [masterHtml]);

  /* ── History ──────────────────────────────────────────────────────────── */
  const saveHistorySnapshot = (html?: string) => {
    const snapshot = html ?? masterHtml;
    if (!snapshot) return;
    if (historyIndexRef.current >= 0 && historyStackRef.current[historyIndexRef.current] === snapshot) return;
    historyStackRef.current = historyStackRef.current.slice(0, historyIndexRef.current + 1);
    historyStackRef.current.push(snapshot);
    historyIndexRef.current = historyStackRef.current.length - 1;
  };

  const applyExternalHtml = (html: string) => {
    const el = editorRef.current;
    if (el) {
      isApplyingExternalHtmlRef.current = true;
      el.innerHTML = html;
      isApplyingExternalHtmlRef.current = false;
    }
    setMasterHtml(html);
    setPreviewFragments((prev) => (prev.length ? prev : [html]));
    savedRangeRef.current = null;
    // A freshly-loaded document (new AI draft, template, undo/redo target)
    // starts clean — the aggressive one-page fit is allowed to run again.
    hasUserEditedRef.current = false;
  };

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      applyExternalHtml(historyStackRef.current[historyIndexRef.current]);
      rebuildPreviewNow(historyStackRef.current[historyIndexRef.current]);
    }
  };

  const handleRedo = () => {
    if (historyIndexRef.current < historyStackRef.current.length - 1) {
      historyIndexRef.current++;
      applyExternalHtml(historyStackRef.current[historyIndexRef.current]);
      rebuildPreviewNow(historyStackRef.current[historyIndexRef.current]);
    }
  };

  const placeCaretAtStart = (node: Node) => {
    const r = document.createRange();
    r.setStart(node, 0);
    r.collapse(true);
    const s = window.getSelection();
    if (s) { s.removeAllRanges(); s.addRange(r); }
  };

  /**
   * Enter inside a heading must never create another heading (which would draw
   * another underline). Blank lines and the text after the caret become <p>.
   * Returns true when the key press was handled.
   */
  const handleEnterInHeading = (e: React.KeyboardEvent<HTMLDivElement>): boolean => {
    const ed = editorRef.current;
    const sel = window.getSelection();
    if (!ed || !sel || sel.rangeCount === 0 || !sel.isCollapsed) return false;

    const anchor = sel.anchorNode;
    const anchorEl = anchor instanceof Element ? anchor : anchor?.parentElement;
    const heading = anchorEl?.closest("h1, h2, h3") as HTMLElement | null;
    if (!heading || !ed.contains(heading)) return false;

    e.preventDefault();
    const range = sel.getRangeAt(0);
    const before = document.createRange();
    before.selectNodeContents(heading);
    before.setEnd(range.startContainer, range.startOffset);
    const after = document.createRange();
    after.selectNodeContents(heading);
    after.setStart(range.startContainer, range.startOffset);
    const atStart = before.toString().length === 0;
    const atEnd = after.toString().length === 0;

    const p = document.createElement("p");
    if (atStart && atEnd) {
      p.innerHTML = "<br>";
      heading.replaceWith(p);
      placeCaretAtStart(p);
    } else if (atStart) {
      p.innerHTML = "<br>";
      heading.before(p);
    } else if (atEnd) {
      p.innerHTML = "<br>";
      heading.after(p);
      placeCaretAtStart(p);
    } else {
      const tail = document.createRange();
      tail.setStart(range.startContainer, range.startOffset);
      tail.setEnd(heading, heading.childNodes.length);
      p.appendChild(tail.extractContents());
      heading.after(p);
      placeCaretAtStart(p);
    }

    const html = ed.innerHTML;
    setMasterHtml(html);
    saveHistorySnapshot(html);
    rebuildPreviewNow(html);
    return true;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && !e.nativeEvent.isComposing) {
      if (handleEnterInHeading(e)) return;
    }
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo(); else handleUndo();
      } else if (e.key === "y" || e.key === "Y") {
        e.preventDefault();
        handleRedo();
      }
    }
  };

  /* ── Selection ────────────────────────────────────────────────────────── */
  const getActiveLiveRange = (): Range | null => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      if (!range.collapsed && range.toString().trim().length > 0) return range;
    }
    if (savedRangeRef.current && !savedRangeRef.current.collapsed && savedRangeRef.current.toString().trim().length > 0) {
      return savedRangeRef.current;
    }
    return null;
  };

  const saveCurrentSelection = () => {
    const sel = window.getSelection();
    const ed = editorRef.current;
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed && sel.toString().trim().length > 0 && ed && ed.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const ed = editorRef.current;
    if (ed) ed.focus();
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      if (sel) { try { sel.removeAllRanges(); sel.addRange(savedRangeRef.current.cloneRange()); } catch {} }
    }
  };

  const updateActiveSelectionStyles = () => {
    if (suppressNextStyleSyncRef.current) { suppressNextStyleSyncRef.current = false; return; }
    try {
      const sel = window.getSelection();
      const ed = editorRef.current;
      if (!ed) return;

      if (sel && sel.rangeCount > 0 && ed.contains(sel.anchorNode)) {
        if (!sel.isCollapsed && sel.toString().trim().length > 0) {
          savedRangeRef.current = sel.getRangeAt(0).cloneRange();
        } else if (sel.isCollapsed) {
          savedRangeRef.current = null;
        }
      }

      if (sel && sel.rangeCount > 0 && ed.contains(sel.anchorNode)) {
        let isBold = document.queryCommandState("bold");
        let isItalic = document.queryCommandState("italic");
        let isUnderline = document.queryCommandState("underline");
        const isStrike = document.queryCommandState("strikeThrough");
        const isUl = document.queryCommandState("insertUnorderedList");
        const isOl = document.queryCommandState("insertOrderedList");

        let node: Node | null = sel.anchorNode;
        if (node && node.nodeType === Node.TEXT_NODE) node = node.parentNode;

        let detectedFont: DocFont = docFont;
        let detectedSize: number = docFontSize;

        if (node && node instanceof HTMLElement) {
          const fs = window.getComputedStyle(node);
          const ff = fs.fontFamily.toLowerCase();
          if (ff.includes("times")) detectedFont = "serif";
          else if (ff.includes("arial") || ff.includes("calibri") || ff.includes("sans-serif")) detectedFont = "sans";
          else if (ff.includes("georgia")) detectedFont = "georgia";
          else if (ff.includes("courier")) detectedFont = "mono";

          if (!isBold && (fs.fontWeight === "bold" || parseInt(fs.fontWeight) >= 600 || node.closest("b, strong"))) isBold = true;
          if (!isItalic && (fs.fontStyle === "italic" || node.closest("i, em"))) isItalic = true;
          if (!isUnderline && (fs.textDecoration.includes("underline") || node.closest("u"))) isUnderline = true;

          const px = parseFloat(fs.fontSize);
          if (px) detectedSize = Math.round((px * 72) / 96);
        }

        setActiveStyles({
          bold: isBold, italic: isItalic, underline: isUnderline, strike: isStrike,
          ul: isUl, ol: isOl,
          alignLeft: document.queryCommandState("justifyLeft") || docAlign === "left",
          alignCenter: document.queryCommandState("justifyCenter") || docAlign === "center",
          alignRight: document.queryCommandState("justifyRight") || docAlign === "right",
          alignJustify: document.queryCommandState("justifyFull") || docAlign === "justify",
          font: detectedFont,
        });
        setDisplayedFontSize(detectedSize);
      }
    } catch {}
  };

  useEffect(() => {
    const handler = () => { if (view === "editor") updateActiveSelectionStyles(); };
    document.addEventListener("selectionchange", handler);
    return () => document.removeEventListener("selectionchange", handler);
  }, [view, docAlign]);

  const handleEditorInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (isApplyingExternalHtmlRef.current) return;
    const html = e.currentTarget.innerHTML;
    hasUserEditedRef.current = true;
    setMasterHtml(html);
    saveHistorySnapshot(html);
    updateActiveSelectionStyles();
  };

  /* ── Layout ribbon handlers ────────────────────────────────────────────
   * Changing line spacing or page size counts as a user customization. Once
   * the user has done so, the aggressive "force onto the requested page
   * count" fit is disabled — the document flows at whatever size it needs
   * at the chosen typography, instead of shrinking the font to force it
   * back onto one page. (See the comment on `hasUserEditedRef` above.)
   */
  const handleLineSpacingChange = (ls: LineSpacing) => {
    hasUserEditedRef.current = true;
    setLineSpacing(ls);
  };

  const handlePageSizeChange = (ps: PageSize) => {
    hasUserEditedRef.current = true;
    setPageSize(ps);
  };

  /* ── Image upload ─────────────────────────────────────────────────────── */
  const handleHeaderUpload = async (file: File | undefined) => {
    if (!file) return;
    setHeaderError(null);
    try { setHeaderImage(await fileToImageAsset(file)); }
    catch (err) { setHeaderError(err instanceof Error ? err.message : "Could not process image."); }
  };

  const handleFooterUpload = async (file: File | undefined) => {
    if (!file) return;
    setFooterError(null);
    try { setFooterImage(await fileToImageAsset(file)); }
    catch (err) { setFooterError(err instanceof Error ? err.message : "Could not process image."); }
  };

  const removeHeaderLetterhead = () => { setHeaderImage(null); setHeaderError(null); };
  const removeFooterLetterhead = () => { setFooterImage(null); setFooterError(null); };

  const resolveFileNameBase = (): string => {
    if (entryMode === "template" && activeTemplateId) {
      const tpl = getTemplateById(activeTemplateId);
      if (tpl) return tpl.fileName;
    }
    return sanitizeFileName(prompt);
  };

  /* ── Load template ────────────────────────────────────────────────────── */
  const loadTemplate = (tpl: DocumentTemplate) => {
    historyStackRef.current = [tpl.html];
    historyIndexRef.current = 0;
    initialHtmlRef.current = tpl.html;

    setPageSize(tpl.pageSize);
    setLineSpacing(tpl.lineSpacing);
    setPrompt(tpl.title);
    setEntryMode("template");
    setActiveTemplateId(tpl.id);
    setStatus("success");
    setShowEditor(true);

    applyExternalHtml(tpl.html);
    setView("editor");
    setTimeout(() => rebuildPreviewNow(tpl.html), 30);
  };

  /* ── Generate ─────────────────────────────────────────────────────────── */
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setStatus("generating");
    setErrorMessage(null);

    try {
      let rawContent = "";
      const headerFooterInfo: string[] = [];
      if (headerImage) headerFooterInfo.push("Header letterhead image attached.");
      if (footerImage) headerFooterInfo.push("Footer letterhead image attached.");

      const targetPages = parseTargetPageCount(prompt);
      const WORDS_PER_PAGE = 275;
      let pagePromptInstruction = "";
      if (targetPages === 1) {
        pagePromptInstruction =
          "CRITICAL: The generated text MUST FIT ON EXACTLY ONE (1) PAGE. " +
          "Aim for 250–300 words total, no more. Be concise and executive — " +
          "every extra word risks spilling onto a second page.";
      } else if (targetPages !== null && targetPages > 1) {
        const targetWords = targetPages * WORDS_PER_PAGE;
        pagePromptInstruction =
          `PAGE LIMIT: Produce content of approximately ${targetPages} pages ` +
          `(~250–300 words per page, ~${targetWords} words total). Do not exceed this.`;
      }

      const fullPromptPayload = `${prompt}\n\n${pagePromptInstruction} ${headerFooterInfo.join(" ")}`.trim();

      try {
        const response = await fetch("/api/generate-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: fullPromptPayload, targetPages }),
        });
        if (response.ok) {
          const data = await response.json();
          rawContent = data.content ?? "";
        } else throw new Error("Server returned error status");
      } catch {
        rawContent = `# ${prompt.toUpperCase()}\n\n**DOCUMENT REF NO.:** CTU-ARG-DOC-2026-001\n**DATE:** ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}\n\n## 1.0 PURPOSE AND SCOPE\nThis document outlines official guidelines and procedural terms regarding ${prompt}.\n\n## 2.0 DIRECTIVES AND PROVISIONS\n- All concerned personnel shall adhere to university governance standards.\n- Regular compliance reports must be submitted to the Office of the Dean.\n\n## 3.0 SIGNATORIES\n\n**Prepared by:**\n____________________________________\nFaculty Member / Proponent\n\n**Approved by:**\n____________________________________\nCampus Director`;
      }

      const parsedHtml = markdownToHtml(rawContent);

      historyStackRef.current = [parsedHtml];
      historyIndexRef.current = 0;
      initialHtmlRef.current = parsedHtml;

      setEntryMode("ai");
      setActiveTemplateId(null);
      setStatus("success");
      setShowEditor(true);

      applyExternalHtml(parsedHtml);
      setView("editor");
      setTimeout(() => rebuildPreviewNow(parsedHtml), 30);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to draft document.");
      setStatus("error");
    }
  };

  /* ── Formatting ───────────────────────────────────────────────────────── */
  const applyFontToSelection = (fontKey: DocFont): boolean => {
    restoreSelection();
    const ed = editorRef.current;
    if (!ed) return false;
    const range = getActiveLiveRange();
    if (!range || range.collapsed) return false;

    const fontCss = FONT_CONFIG[fontKey].css;
    ed.focus();
    const sel = window.getSelection();
    if (sel) { sel.removeAllRanges(); sel.addRange(range); }

    try {
      const span = document.createElement("span");
      span.style.fontFamily = fontCss;
      const fragment = range.extractContents();
      fragment.querySelectorAll("*").forEach((c) => {
        if (c instanceof HTMLElement) {
          if (c.style.fontFamily) c.style.fontFamily = fontCss;
          if (c.tagName === "FONT") { c.removeAttribute("face"); c.style.fontFamily = fontCss; }
        }
      });
      span.appendChild(fragment);
      range.insertNode(span);

      const nr = document.createRange();
      nr.selectNode(span);
      suppressNextStyleSyncRef.current = true;
      if (sel) { sel.removeAllRanges(); sel.addRange(nr); }
      savedRangeRef.current = nr.cloneRange();
      setActiveStyles((prev) => ({ ...prev, font: fontKey }));

      const newHtml = ed.innerHTML;
      setMasterHtml(newHtml);
      saveHistorySnapshot(newHtml);
      restoreSelection();
      rebuildPreviewNow(newHtml);
      return true;
    } catch { return false; }
  };

  const applyFontSizeToSelection = (deltaOrSize: number, isAbsolute = false): boolean => {
    restoreSelection();
    const ed = editorRef.current;
    if (!ed) return false;
    const range = getActiveLiveRange();
    if (!range || range.collapsed) return false;

    const targetPt = isAbsolute
      ? Math.max(8, Math.min(124, deltaOrSize))
      : Math.max(8, Math.min(124, displayedFontSize + deltaOrSize));

    ed.focus();
    const sel = window.getSelection();
    if (sel) { sel.removeAllRanges(); sel.addRange(range); }

    try {
      const span = document.createElement("span");
      span.style.fontSize = `${targetPt}pt`;
      const fragment = range.extractContents();
      fragment.querySelectorAll("*").forEach((c) => {
        if (c instanceof HTMLElement && c.style.fontSize) c.style.fontSize = `${targetPt}pt`;
      });
      span.appendChild(fragment);
      range.insertNode(span);

      const nr = document.createRange();
      nr.selectNode(span);
      suppressNextStyleSyncRef.current = true;
      if (sel) { sel.removeAllRanges(); sel.addRange(nr); }
      savedRangeRef.current = nr.cloneRange();
      setDisplayedFontSize(targetPt);

      const newHtml = ed.innerHTML;
      setMasterHtml(newHtml);
      saveHistorySnapshot(newHtml);
      restoreSelection();
      rebuildPreviewNow(newHtml);
      return true;
    } catch { return false; }
  };

  const applyFormattingCommand = (command: string, value?: string) => {
    restoreSelection();
    const ed = editorRef.current;
    if (!ed) return;
    const range = getActiveLiveRange();
    if (!range) return;

    ed.focus();
    const sel = window.getSelection();
    if (sel) { sel.removeAllRanges(); sel.addRange(range); }

    document.execCommand(command, false, value);

    const newHtml = ed.innerHTML;
    setMasterHtml(newHtml);
    saveHistorySnapshot(newHtml);
    updateActiveSelectionStyles();
    rebuildPreviewNow(newHtml);
  };

  const handleFontFamilyChange = (newFont: DocFont) => {
    if (applyFontToSelection(newFont)) restoreSelection();
    setShowFontDropdown(false);
  };

  const handleFontSizeChange = (deltaOrSize: number, isAbsolute = false) => {
    if (applyFontSizeToSelection(deltaOrSize, isAbsolute)) restoreSelection();
  };

  const handleAlignmentChange = (align: DocAlign) => {
    const cmd =
      align === "center" ? "justifyCenter" :
      align === "right"  ? "justifyRight" :
      align === "justify" ? "justifyFull" :
      "justifyLeft";
    applyFormattingCommand(cmd);
  };

  const insertSignatureBlank = () => {
    const ed = editorRef.current;
    if (!ed) return;
    ed.focus();
    document.execCommand("insertText", false, "____________________________________");
    const newHtml = ed.innerHTML;
    setMasterHtml(newHtml);
    saveHistorySnapshot(newHtml);
    rebuildPreviewNow(newHtml);
  };

  const insertDateStamp = () => {
    const ed = editorRef.current;
    if (!ed) return;
    ed.focus();
    const dateStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    document.execCommand("insertText", false, dateStr);
    const newHtml = ed.innerHTML;
    setMasterHtml(newHtml);
    saveHistorySnapshot(newHtml);
    rebuildPreviewNow(newHtml);
  };

  /* ── Print / PDF ──────────────────────────────────────────────────────── */
  const handlePrint = () => {
    const fragments = previewFragments.length ? previewFragments : [masterHtml];
    const cfg = PAGE_SIZES[pageSize];

    const pagesHtml = fragments
      .map((frag, idx) =>
        buildSinglePageHtml({
          fragment: frag,
          pageNum: idx + 1,
          totalPages: fragments.length,
          cfg,
          fontCss: FONT_CONFIG[docFont].css,
          fontSizePt: fit?.fontPt ?? docFontSize,
          lineSpacing: fit?.lineHeight ?? lineSpacing,
          alignment: docAlign,
          headerUrl: headerImage ? headerImage.dataUrl : null,
          footerUrl: footerImage ? footerImage.dataUrl : null,
        })
      )
      .join("");

    const printWindow = window.open("", "_blank", "width=900,height=750");
    if (!printWindow) return setErrorMessage("Please allow pop-ups to print the document.");

    printWindow.document.write(`<!DOCTYPE html><html><head>
      <title>${resolveFileNameBase()}</title>
      <style>
        @page { size: ${cfg.cssWidth}px ${cfg.cssHeight}px; margin: 0; }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: #ffffff; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .print-pages { display: flex; flex-direction: column; align-items: center; }
        ${CONTENT_STYLES}
      </style>
    </head><body><div class="print-pages">${pagesHtml}</div></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 400);
  };

  /* ── DOCX ─────────────────────────────────────────────────────────────── */
  const handleDownloadDocx = async () => {
    setDownloading("docx");
    setErrorMessage(null);
    try {
      const docxBlob = await buildDocxBlobFromHtml(
        masterHtml, docFont, Math.round((fit?.fontPt ?? docFontSize) * 2) / 2, pageSize, docAlign,
        headerImage, !headerImage, footerImage, !footerImage
      );
      saveAs(docxBlob, `${sanitizeFileName(prompt)}_${new Date().toISOString().slice(0, 10)}.docx`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to generate DOCX.");
    } finally { setDownloading(null); }
  };

  const handleDownloadPdf = () => handlePrint();

  /* ========================================================================
   * RENDER: CHOOSER
   * ====================================================================== */
  if (view === "chooser") {
    return (
      <ChooserScreen
        onPickAI={() => { setEntryMode("ai"); setActiveTemplateId(null); setView("compose"); }}
        onPickTemplate={() => setView("templates")}
      />
    );
  }

  if (view === "templates") {
    return <TemplatesScreen onBack={() => setView("chooser")} onSelect={(tpl) => loadTemplate(tpl)} />;
  }

  /* ========================================================================
   * RENDER: EDITOR
   * ====================================================================== */
  if (view === "editor") {
    const cfg = PAGE_SIZES[pageSize];
    const fragments = previewFragments.length ? previewFragments : [masterHtml];

    return (
      <div className="space-y-4">
        {errorMessage && (
          <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
            <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-rose-700">{errorMessage}</p>
          </div>
        )}

        <style dangerouslySetInnerHTML={{ __html: CONTENT_STYLES }} />

        {/* ── TOOLBAR ─────────────────────────────────────────────────────── */}
        <div className="sticky top-16 z-30 space-y-3 bg-[#F3F4F6] pt-2 pb-3 shadow-md -mx-4 px-4 sm:-mx-6 sm:px-6">
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setView(entryMode === "template" ? "templates" : "compose")}
                  className="flex items-center gap-2 px-3.5 py-2 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-xs font-bold text-[#374151] transition-all shadow-sm active:scale-95"
                >
                  <ArrowLeft className="h-4 w-4 text-[#dd7230]" />
                  <span>{entryMode === "template" ? "Choose Another" : "New Prompt"}</span>
                </button>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#dd7230] flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI DOCUMENT GENERATOR
                  </span>
                  <p className="text-sm font-semibold text-[#1F2937] truncate max-w-[260px] sm:max-w-md">
                    {prompt || "Institutional Document"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setShowEditor((v) => !v)}
                  className="flex items-center gap-2 px-3.5 py-2.5 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-xs font-bold text-[#374151] transition-all active:scale-95"
                  title={showEditor ? "Hide the editable panel" : "Show the editable panel"}
                >
                  {showEditor
                    ? <PanelLeftClose className="h-4 w-4 text-[#dd7230]" />
                    : <PanelLeftOpen className="h-4 w-4 text-[#dd7230]" />}
                  <span>{showEditor ? "Hide Editor" : "Show Editor"}</span>
                </button>

                <button
                  onClick={handleDownloadDocx}
                  disabled={downloading !== null}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  {downloading === "docx" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  <span>Download DOCX</span>
                </button>

                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
                >
                  <FileText className="h-4 w-4" />
                  <span>Download PDF</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#1D6FA3] hover:bg-[#0B3C5D] text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print</span>
                </button>
              </div>
            </div>
          </div>

          {/* Ribbon */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm relative z-20">
            <div className="flex items-center border-b border-[#E5E7EB] bg-[#F9FAFB] px-3 pt-1 gap-1">
              {(["home", "layout", "insert"] as RibbonTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveRibbonTab(tab)}
                  className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all ${
                    activeRibbonTab === tab
                      ? "bg-white text-[#dd7230] border-t-2 border-t-[#dd7230] shadow-sm"
                      : "text-[#6B7280] hover:text-[#1F2937]"
                  }`}
                >
                  {tab === "home" ? "Home & Font" : tab === "layout" ? "Page Layout & Size" : "Letterhead & Inserts"}
                </button>
              ))}
            </div>

            <div className="p-3 sm:p-4 bg-white flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
              {activeRibbonTab === "home" && (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">History</span>
                    <div className="flex items-center rounded-lg border border-[#E5E7EB] overflow-hidden bg-[#F9FAFB] p-0.5 gap-0.5">
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); handleUndo(); }} className="p-1.5 rounded hover:bg-[#E5E7EB] text-[#374151] hover:text-[#dd7230]">
                        <Undo className="h-4 w-4" />
                      </button>
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); handleRedo(); }} className="p-1.5 rounded hover:bg-[#E5E7EB] text-[#374151] hover:text-[#dd7230]">
                        <Redo className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="h-8 w-px bg-[#E5E7EB] hidden sm:block" />

                  <div className="flex flex-col gap-1 relative" ref={fontDropdownRef}>
                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Font Family</span>
                    <div className="relative">
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); setShowFontDropdown((v) => !v); }}
                        className="px-3 py-1.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-xs font-bold text-[#1F2937] hover:bg-[#F3F4F6] flex items-center justify-between gap-3 min-w-[168px]"
                      >
                        <span className={getActiveLiveRange() ? "text-[#dd7230]" : ""}>{FONT_CONFIG[activeStyles.font || docFont].name}</span>
                        <ChevronDown className="h-3.5 w-3.5 text-[#6B7280]" />
                      </button>
                      {showFontDropdown && (
                        <div className="absolute top-full left-0 mt-1.5 w-56 bg-white border border-[#E5E7EB] rounded-xl shadow-2xl z-50 py-1.5">
                          {(Object.keys(FONT_CONFIG) as DocFont[]).map((fKey) => (
                            <button
                              key={fKey}
                              type="button"
                              onMouseDown={(e) => { e.preventDefault(); handleFontFamilyChange(fKey); }}
                              className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-[#FFF4E5] hover:text-[#dd7230] flex items-center justify-between ${
                                (activeStyles.font || docFont) === fKey ? "bg-[#FFF4E5] text-[#dd7230] font-bold" : "text-[#374151]"
                              }`}
                            >
                              <span>{FONT_CONFIG[fKey].name}</span>
                              {(activeStyles.font || docFont) === fKey && <Check className="h-3.5 w-3.5 text-[#dd7230]" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="h-8 w-px bg-[#E5E7EB] hidden sm:block" />

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Font Size (8–124)</span>
                    <div className="flex items-center rounded-lg border border-[#E5E7EB] overflow-hidden bg-[#F9FAFB]">
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); handleFontSizeChange(-1, false); }} className="px-2 py-1.5 hover:bg-[#E5E7EB] text-[#6B7280] hover:text-[#dd7230] border-r border-[#E5E7EB]">
                        <Minus className="h-3 w-3" />
                      </button>
                      <div className="flex items-center px-1">
                        <input
                          type="number" min={8} max={124} value={displayedFontSize}
                          onMouseDown={(e) => { e.preventDefault(); saveCurrentSelection(); }}
                          onFocus={() => { saveCurrentSelection(); }}
                          onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) setDisplayedFontSize(v); }}
                          onBlur={(e) => {
                            let v = parseInt(e.target.value, 10);
                            if (isNaN(v) || v < 8) v = 8;
                            if (v > 124) v = 124;
                            setDisplayedFontSize(v);
                            handleFontSizeChange(v, true);
                          }}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
                          className="w-10 text-center py-1 text-xs font-extrabold text-[#1F2937] focus:text-[#dd7230] outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-[10px] font-bold text-gray-400 select-none mr-1">pt</span>
                      </div>
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); handleFontSizeChange(1, false); }} className="px-2 py-1.5 hover:bg-[#E5E7EB] text-[#6B7280] hover:text-[#dd7230] border-l border-[#E5E7EB]">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <div className="h-8 w-px bg-[#E5E7EB] hidden sm:block" />

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Text Style (Selection Only)</span>
                    <div className="flex items-center rounded-lg border border-[#E5E7EB] overflow-hidden bg-[#F9FAFB] p-0.5 gap-0.5">
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormattingCommand("bold"); }} className={`p-1.5 rounded ${activeStyles.bold ? "text-[#dd7230] font-black" : "text-[#374151] hover:text-[#dd7230]"}`}>
                        <Bold className={`h-4 w-4 ${activeStyles.bold ? "stroke-[3.4]" : "stroke-[2]"}`} />
                      </button>
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormattingCommand("italic"); }} className={`p-1.5 rounded ${activeStyles.italic ? "text-[#dd7230] font-bold" : "text-[#374151] hover:text-[#dd7230]"}`}>
                        <Italic className={`h-4 w-4 ${activeStyles.italic ? "stroke-[3.4]" : "stroke-[2]"}`} />
                      </button>
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormattingCommand("underline"); }} className={`p-1.5 rounded ${activeStyles.underline ? "text-[#dd7230] font-bold" : "text-[#374151] hover:text-[#dd7230]"}`}>
                        <UnderlineIcon className={`h-4 w-4 ${activeStyles.underline ? "stroke-[3.4]" : "stroke-[2]"}`} />
                      </button>
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormattingCommand("strikeThrough"); }} className={`p-1.5 rounded ${activeStyles.strike ? "text-[#dd7230] font-bold" : "text-[#374151] hover:text-[#dd7230]"}`}>
                        <Strikethrough className={`h-4 w-4 ${activeStyles.strike ? "stroke-[3.4]" : "stroke-[2]"}`} />
                      </button>
                    </div>
                  </div>

                  <div className="h-8 w-px bg-[#E5E7EB] hidden sm:block" />

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Alignment</span>
                    <div className="flex items-center rounded-lg border border-[#E5E7EB] overflow-hidden bg-[#F9FAFB] p-0.5 gap-0.5">
                      {([
                        { key: "left", Icon: AlignLeft, active: activeStyles.alignLeft },
                        { key: "center", Icon: AlignCenter, active: activeStyles.alignCenter },
                        { key: "right", Icon: AlignRight, active: activeStyles.alignRight },
                        { key: "justify", Icon: AlignJustify, active: activeStyles.alignJustify },
                      ] as const).map(({ key, Icon, active }) => (
                        <button key={key} type="button" onMouseDown={(e) => { e.preventDefault(); handleAlignmentChange(key); }} className={`p-1.5 rounded ${active ? "text-[#dd7230] font-bold" : "text-[#374151] hover:text-[#dd7230]"}`}>
                          <Icon className={`h-4 w-4 ${active ? "stroke-[3]" : "stroke-[2]"}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-8 w-px bg-[#E5E7EB] hidden sm:block" />

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Lists</span>
                    <div className="flex items-center rounded-lg border border-[#E5E7EB] overflow-hidden bg-[#F9FAFB]">
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormattingCommand("insertUnorderedList"); }} className={`p-2 border-r border-[#E5E7EB] ${activeStyles.ul ? "text-[#dd7230] font-bold" : "text-[#374151] hover:text-[#dd7230]"}`}>
                        <List className={`h-3.5 w-3.5 ${activeStyles.ul ? "stroke-[3]" : "stroke-[2]"}`} />
                      </button>
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormattingCommand("insertOrderedList"); }} className={`p-2 ${activeStyles.ol ? "text-[#dd7230] font-bold" : "text-[#374151] hover:text-[#dd7230]"}`}>
                        <ListOrdered className={`h-3.5 w-3.5 ${activeStyles.ol ? "stroke-[3]" : "stroke-[2]"}`} />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeRibbonTab === "layout" && (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Page Size / Paper</span>
                    <div className="flex items-center gap-2">
                      {(["short", "a4", "long"] as PageSize[]).map((psKey) => {
                        const c = PAGE_SIZES[psKey];
                        const isSelected = pageSize === psKey;
                        return (
                          <button
                            key={psKey}
                            type="button"
                            onClick={() => handlePageSizeChange(psKey)}
                            className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2.5 ${
                              isSelected
                                ? "bg-[#FFF4E5] border-[#dd7230] text-[#dd7230] shadow-sm ring-1 ring-[#dd7230]"
                                : "bg-[#F9FAFB] border-[#E5E7EB] text-[#374151] hover:bg-[#F3F4F6]"
                            }`}
                          >
                            <FileSpreadsheet className={`h-4 w-4 ${isSelected ? "text-[#dd7230]" : "text-[#6B7280]"}`} />
                            <div>
                              <span className="block leading-none">{c.label}</span>
                              <span className="text-[10px] font-normal text-[#6B7280] block mt-0.5">{c.subLabel}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="h-8 w-px bg-[#E5E7EB] hidden sm:block" />
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Line Spacing</span>
                    <div className="flex items-center gap-1.5">
                      {(["1.15", "1.5", "2.0"] as const).map((ls) => (
                        <button
                          key={ls}
                          type="button"
                          onClick={() => handleLineSpacingChange(ls)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                            lineSpacing === ls
                              ? "bg-[#FFF4E5] text-[#dd7230] border-[#dd7230] font-extrabold"
                              : "bg-[#F9FAFB] border-[#E5E7EB] text-[#374151] hover:bg-[#F3F4F6]"
                          }`}
                        >
                          {ls}x
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-[#9CA3AF] mt-0.5">
                      Changing spacing disables auto-fit — the document flows at its natural size.
                    </span>
                  </div>
                </>
              )}

              {activeRibbonTab === "insert" && (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Header Letterhead</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => headerInputRef.current?.click()}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
                          headerImage ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-bold" : "bg-[#F9FAFB] border-[#E5E7EB] text-[#374151] hover:bg-[#F3F4F6]"
                        }`}
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span>{headerImage ? "Header Attached" : "Upload Header"}</span>
                      </button>
                      {headerImage && (
                        <button type="button" onClick={removeHeaderLetterhead} className="px-2.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold flex items-center gap-1">
                          <Trash2 className="h-3.5 w-3.5" /><span>Remove</span>
                        </button>
                      )}
                      <input ref={headerInputRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="hidden"
                        onChange={(e) => { handleHeaderUpload(e.target.files?.[0]); e.target.value = ""; }} />
                    </div>
                  </div>
                  <div className="h-8 w-px bg-[#E5E7EB] hidden sm:block" />
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Footer Letterhead</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => footerInputRef.current?.click()}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
                          footerImage ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-bold" : "bg-[#F9FAFB] border-[#E5E7EB] text-[#374151] hover:bg-[#F3F4F6]"
                        }`}
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span>{footerImage ? "Footer Attached" : "Upload Footer"}</span>
                      </button>
                      {footerImage && (
                        <button type="button" onClick={removeFooterLetterhead} className="px-2.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold flex items-center gap-1">
                          <Trash2 className="h-3.5 w-3.5" /><span>Remove</span>
                        </button>
                      )}
                      <input ref={footerInputRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="hidden"
                        onChange={(e) => { handleFooterUpload(e.target.files?.[0]); e.target.value = ""; }} />
                    </div>
                  </div>
                  <div className="h-8 w-px bg-[#E5E7EB] hidden sm:block" />
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Signatories &amp; Stamps</span>
                    <div className="flex items-center gap-2">
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); insertSignatureBlank(); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#374151] font-semibold">
                        <PenTool className="h-3.5 w-3.5" /><span>+ Signature Line</span>
                      </button>
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); insertDateStamp(); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#374151] font-semibold">
                        <Calendar className="h-3.5 w-3.5" /><span>+ Date Stamp</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── SPLIT VIEW ──────────────────────────────────────────────────── */}
        <div
          className="flex flex-col lg:flex-row gap-4"
          style={{ height: "calc(100vh - 320px)", minHeight: "560px" }}
        >
          {/* LEFT: editor (hidden when showEditor === false) */}
          {showEditor && (
            <div className="rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden bg-white flex-1 min-w-0 flex flex-col min-h-0">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E5E7EB] bg-[#F9FAFB] flex-shrink-0">
                <div className="flex items-center gap-2">
                  <PenTool className="h-3.5 w-3.5 text-[#dd7230]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#374151]">
                    Editable Content
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-[#9CA3AF]">{wordCount} words</span>
              </div>

              <div className="flex-1 min-h-0 overflow-auto" style={{ backgroundColor: "#FAFAFA" }}>
                <div
                  style={{
                    maxWidth: `${cfg.cssWidth}px`,
                    margin: "20px auto",
                    backgroundColor: "#ffffff",
                    border: "1px solid #E5E7EB",
                    borderRadius: "4px",
                    padding: `${PAGE_PADDING_TOP}px ${PAGE_PADDING_RIGHT}px ${PAGE_PADDING_BOTTOM}px ${PAGE_PADDING_LEFT}px`,
                    fontFamily: FONT_CONFIG[docFont].css,
                    fontSize: `${docFontSize}pt`,
                    color: "#111827",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  }}
                >
                  <div
                    ref={editorRef}
                    className="wysiwyg-content outline-none focus:ring-1 focus:ring-[#dd7230]/40 transition-all"
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                    onInput={handleEditorInput}
                    onKeyUp={() => { saveCurrentSelection(); updateActiveSelectionStyles(); }}
                    onMouseUp={() => { saveCurrentSelection(); updateActiveSelectionStyles(); }}
                    onKeyDown={handleKeyDown}
                    style={{
                      minHeight: `${getContentAreaHeight(cfg.cssHeight, !!headerImage, !!footerImage)}px`,
                      ...cssVars({ "--doc-line-height": lineSpacing }),
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* RIGHT: paginated preview — takes full width when editor is hidden */}
          <div className="rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden bg-white flex-1 min-w-0 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E5E7EB] bg-[#F9FAFB] flex-shrink-0">
              <div className="flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-[#dd7230]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#374151]">
                  Live Output Preview
                </span>
              </div>
              <span className="text-[10px] font-semibold text-[#9CA3AF]">
                {fragments.length} {fragments.length === 1 ? "page" : "pages"} · {cfg.label}
              </span>
            </div>

            <div ref={previewWrapRef} className="flex-1 min-h-0 overflow-auto" style={{ backgroundColor: "#D4D9E2" }}>
              <div className="py-6 flex flex-col items-center gap-6">
                {fragments.map((frag, idx) => {
                  const pageHtml = buildSinglePageHtml({
                    fragment: frag,
                    pageNum: idx + 1,
                    totalPages: fragments.length,
                    cfg,
                    fontCss: FONT_CONFIG[docFont].css,
                    fontSizePt: fit?.fontPt ?? docFontSize,
                    lineSpacing: fit?.lineHeight ?? lineSpacing,
                    alignment: docAlign,
                    headerUrl: headerImage ? headerImage.dataUrl : null,
                    footerUrl: footerImage ? footerImage.dataUrl : null,
                  });
                  return (
                    <div key={idx} className="flex flex-col items-center flex-shrink-0">
                      <div
                        className="shadow-2xl border border-[#C5CBD5] bg-white"
                        style={{
                          width: cfg.cssWidth * previewScale,
                          height: cfg.cssHeight * previewScale,
                          boxSizing: "content-box",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: cfg.cssWidth,
                            height: cfg.cssHeight,
                            transform: `scale(${previewScale})`,
                            transformOrigin: "top left",
                          }}
                          dangerouslySetInnerHTML={{ __html: pageHtml }}
                        />
                      </div>
                      <div className="text-[10px] font-bold text-[#6B7280] mt-2 uppercase tracking-wider">
                        Page {idx + 1} of {fragments.length}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── STATUS BAR ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-4 flex flex-wrap items-center justify-between text-xs text-[#6B7280]">
          <div className="flex items-center gap-4">
            <span className="font-extrabold text-[#1F2937] flex items-center gap-1.5 bg-[#FFF4E5] text-[#dd7230] px-3 py-1 rounded-lg border border-[#dd7230]/30">
              <Layers className="h-4 w-4 text-[#dd7230]" />
              {fragments.length} {fragments.length === 1 ? "Page" : "Pages"}
            </span>
            <span>·</span>
            <span className="font-semibold text-[#374151]">Paper: {cfg.label} ({cfg.subLabel})</span>
            <span>·</span>
            <span>{wordCount} Words</span>
            <span>·</span>
            <span>Line spacing: {lineSpacing}×</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#9CA3AF]">
            <span>Cebu Technological University · CTU DOCUMENT</span>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================================
   * RENDER: COMPOSE (AI Prompt)
   * ====================================================================== */
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setView("chooser")}
          className="flex items-center gap-2 px-3.5 py-2 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-xs font-bold text-[#374151] transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 text-[#dd7230]" />
          <span>Back</span>
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-[#1F2937]">Draft with AI</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Describe the institutional document you need and the AI will draft it for you.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
          <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-rose-700">{errorMessage}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-[#E5E7EB] border-l-4 border-l-[#dd7230]">
          <h2 className="text-base font-semibold text-[#1F2937]">Describe Your Document</h2>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Specify the document type, purpose, target office/audience, and specific sections needed.
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#dd7230] focus:border-transparent transition-shadow resize-none"
              placeholder="Example: Draft an Official Campus Memorandum announcing the schedule for Midterm Examinations..."
              disabled={status === "generating"}
            />
            <div className="flex justify-between items-center mt-1.5 text-xs text-[#9CA3AF]">
              <span>Use standard academic terms or describe specific sections</span>
              <span>{prompt.length} characters</span>
            </div>
          </div>

          <div className="border border-[#E5E7EB] rounded-xl p-4 bg-[#F9FAFB]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-[#dd7230]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#374151]">
                  Official Letterhead &amp; Seals
                </span>
              </div>
              <span className="text-xs text-[#9CA3AF]">Default CTU letterhead pre-loaded · drag &amp; drop to replace</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ImageUploadField
                label="Header Image"
                helperText="Default CTU Argao header is pre-loaded. Drag & drop a PNG/JPG here to replace it."
                image={headerImage}
                error={headerError}
                inputRef={headerInputRef}
                onFileSelected={handleHeaderUpload}
                onRemove={removeHeaderLetterhead}
              />
              <ImageUploadField
                label="Footer Image"
                helperText="Default CTU Argao footer is pre-loaded. Drag & drop a PNG/JPG here to replace it."
                image={footerImage}
                error={footerError}
                inputRef={footerInputRef}
                onFileSelected={handleFooterUpload}
                onRemove={removeFooterLetterhead}
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={status === "generating" || !prompt.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#dd7230] text-white rounded-lg font-bold text-sm transition-all hover:bg-[#c4612a] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-[0.99]"
          >
            {status === "generating" ? (
              <><RefreshCw className="h-5 w-5 animate-spin" />Drafting Institutional Document…</>
            ) : (
              <><Sparkles className="h-5 w-5" />Generate Document with AI</>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-[#E5E7EB] flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#1F2937]">Institutional &amp; Academic Templates</h2>
            <p className="text-xs text-[#6B7280] mt-0.5">Click any template to populate the drafting prompt</p>
          </div>
          <button
            onClick={() => setShowAllPrompts((v) => !v)}
            className="flex items-center gap-1 text-xs font-semibold text-[#dd7230] hover:text-[#c4612a]"
          >
            {showAllPrompts ? <>Show Less <ChevronUp className="h-3.5 w-3.5" /></> : <>Show All ({QUICK_PROMPTS.length}) <ChevronDown className="h-3.5 w-3.5" /></>}
          </button>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(showAllPrompts ? QUICK_PROMPTS : QUICK_PROMPTS.slice(0, 4)).map((t, idx) => (
            <button
              key={idx}
              onClick={() => setPrompt(t.prompt)}
              className="p-3.5 text-left rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] hover:bg-[#FFF4E5] hover:border-[#dd7230] transition-all group"
            >
              <span className="text-xs font-bold text-[#1F2937] group-hover:text-[#dd7230] block">{t.title}</span>
              <p className="text-[11px] text-[#6B7280] mt-1 line-clamp-2 leading-relaxed">{t.prompt}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * SUBCOMPONENT: Chooser Screen
 * ==========================================================================*/
function ChooserScreen(props: { onPickAI: () => void; onPickTemplate: () => void }) {
  const { onPickAI, onPickTemplate } = props;
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#dd7230] rounded-xl flex items-center justify-center shadow-sm">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[#1F2937]">CTU DOCUMENT Studio</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Choose how you&apos;d like to begin your institutional document.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <button onClick={onPickAI} className="group text-left p-6 bg-white border border-[#E5E7EB] hover:border-[#dd7230] hover:shadow-lg rounded-2xl transition-all">
          <div className="w-12 h-12 rounded-xl bg-[#FFF4E5] flex items-center justify-center mb-4 group-hover:bg-[#dd7230] transition-colors">
            <Sparkles className="h-6 w-6 text-[#dd7230] group-hover:text-white transition-colors" />
          </div>
          <h2 className="text-lg font-bold text-[#1F2937] mb-1">Draft with AI</h2>
          <p className="text-sm text-[#6B7280] leading-relaxed">
            Describe the memorandum, proposal, syllabus, or letter you need. The AI will draft a complete institutional document.
          </p>
        </button>

        <button onClick={onPickTemplate} className="group text-left p-6 bg-white border border-[#E5E7EB] hover:border-[#dd7230] hover:shadow-lg rounded-2xl transition-all">
          <div className="w-12 h-12 rounded-xl bg-[#FFF4E5] flex items-center justify-center mb-4 group-hover:bg-[#dd7230] transition-colors">
            <FolderOpen className="h-6 w-6 text-[#dd7230] group-hover:text-white transition-colors" />
          </div>
          <h2 className="text-lg font-bold text-[#1F2937] mb-1">Open Existing Document</h2>
          <p className="text-sm text-[#6B7280] leading-relaxed">
            Start from a pre-authored institutional document. Edit, reprint, or export exactly as it was originally issued.
          </p>
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
 * SUBCOMPONENT: Templates Screen
 * ==========================================================================*/
function TemplatesScreen(props: { onBack: () => void; onSelect: (tpl: DocumentTemplate) => void }) {
  const { onBack, onSelect } = props;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-xs font-bold text-[#374151] transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft className="h-4 w-4 text-[#dd7230]" />
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-xl font-semibold text-[#1F2937]">Institutional Documents</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">Select a document to open in the editor.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {DOCUMENT_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => onSelect(tpl)}
            className="group text-left p-5 bg-white border border-[#E5E7EB] hover:border-[#dd7230] hover:shadow-lg rounded-2xl transition-all"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#dd7230] bg-[#FFF4E5] px-2 py-1 rounded">{tpl.category}</span>
              <span className="text-[10px] font-semibold text-[#9CA3AF]">{PAGE_SIZES[tpl.pageSize].label}</span>
            </div>
            <h3 className="text-base font-bold text-[#1F2937] mb-1.5 group-hover:text-[#dd7230] transition-colors">{tpl.title}</h3>
            <p className="text-xs text-[#6B7280] leading-relaxed line-clamp-3">{tpl.description}</p>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-[#dd7230]">
              <FileText className="h-3.5 w-3.5" />
              <span>Open in Editor →</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
 * SUBCOMPONENT: Image Upload Field
 * ==========================================================================*/
function ImageUploadField(props: {
  label: string;
  helperText: string;
  image: ImageAsset | null;
  error: string | null;
  inputRef: RefObject<HTMLInputElement | null>;
  onFileSelected: (file: File | undefined) => void;
  onRemove: () => void;
}) {
  const { label, helperText, image, error, inputRef, onFileSelected, onRemove } = props;
  const [dragActive, setDragActive] = useState(false);

  const preventDefaults = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };

  return (
    <div
      onDragEnter={(e) => { preventDefaults(e); setDragActive(true); }}
      onDragOver={(e) => { preventDefaults(e); if (!dragActive) setDragActive(true); }}
      onDragLeave={(e) => {
        preventDefaults(e);
        const related = e.relatedTarget as Node | null;
        if (related && (e.currentTarget as Node).contains(related)) return;
        setDragActive(false);
      }}
      onDrop={(e) => {
        preventDefaults(e); setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFileSelected(file);
      }}
      className={`border rounded-xl overflow-hidden bg-white transition-all ${dragActive ? "border-[#dd7230] ring-2 ring-[#dd7230]/40 shadow-md" : "border-[#E5E7EB]"}`}
    >
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#F9FAFB] border-b border-[#E5E7EB]">
        <span className="text-xs font-bold text-[#374151]">{label}</span>
        {image && <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Active</span>}
      </div>

      <div className="p-3">
        <p className="text-[11px] text-[#9CA3AF] mb-2">{helperText}</p>
        {error && <p className="text-xs text-rose-500 mb-2">{error}</p>}

        {!image ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`w-full flex flex-col items-center justify-center gap-1.5 py-4 border-2 border-dashed rounded-lg transition-colors ${
              dragActive ? "border-[#dd7230] bg-[#FFF4E5] text-[#dd7230]" : "border-[#E5E7EB] text-[#9CA3AF] hover:text-[#6B7280] hover:border-[#dd7230]"
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            <span className="text-xs font-medium">{dragActive ? "Drop image here" : "Drag & drop or click to upload PNG/JPG"}</span>
          </button>
        ) : (
          <div className="relative inline-block">
            <img src={image.dataUrl} alt={`${label} preview`} className="max-h-16 rounded border border-[#E5E7EB] p-1 bg-white" />
            <button
              type="button"
              onClick={onRemove}
              aria-label="Remove image"
              className="absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center rounded-full bg-rose-500 text-white shadow"
            >
              <X className="h-3 w-3" />
            </button>
            <div className={`mt-2 text-[10px] font-semibold ${dragActive ? "text-[#dd7230]" : "text-[#9CA3AF]"}`}>
              {dragActive ? "Drop to replace" : "Drag & drop a new image here to replace"}
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          className="hidden"
          onChange={(e) => { onFileSelected(e.target.files?.[0]); e.target.value = ""; }}
        />
      </div>
    </div>
  );
}