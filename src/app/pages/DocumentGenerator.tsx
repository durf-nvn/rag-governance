"use client";

/**
 * DocumentGenerator.tsx
 * ---------------------------------------------------------------------------
 * Professional Institutional & Academic Document Studio for Cebu Technological
 * University (CTU Argao Campus & System).
 *
 * UNIFORM SELECTION FORMATTING:
 * - Font Family & Font Size: Highlighted text font family and font size update accurately
 *   and uniformly across all text nodes and child elements.
 * - Persistent Selection Highlight: Highlighted text STAYS HIGHLIGHTED after formatting
 *   (font size, font family, bold, etc.) so users can apply multiple formatting adjustments continuously.
 *   The highlight ONLY stops when the user highlights another text or clicks anywhere in the page.
 */

import React, { useState, useRef, useEffect, type RefObject } from "react";
import {
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  X,
  FileText,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Printer,
  ArrowLeft,
  Plus,
  Minus,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  PenTool,
  Calendar,
  Layers,
  FileSpreadsheet,
  Trash2,
  Check,
  Undo,
  Redo,
  Upload,
  FolderOpen,
} from "lucide-react";
import { importDocumentFile, ACCEPTED_DOCUMENT_ACCEPT } from "../utils/importDocument";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  AlignmentType,
  Header,
  Footer,
} from "docx";
import { saveAs } from "file-saver";

/* ============================================================================
 * PAGE SIZE SPECIFICATIONS
 * ==========================================================================*/
type PageSize = "short" | "a4" | "long";

interface PageSizeConfig {
  key: PageSize;
  label: string;
  subLabel: string;
  cssWidth: string;
  cssHeight: number; // in px at 96dpi
  docxWidth: number; // in twips
  docxHeight: number; // in twips
}

const PAGE_SIZES: Record<PageSize, PageSizeConfig> = {
  short: {
    key: "short",
    label: "Letter (Short)",
    subLabel: '8.5" × 11"',
    cssWidth: "816px",
    cssHeight: 1056,
    docxWidth: 12240,
    docxHeight: 15840,
  },
  a4: {
    key: "a4",
    label: "A4 (Standard)",
    subLabel: '8.27" × 11.69"',
    cssWidth: "794px",
    cssHeight: 1123,
    docxWidth: 11906,
    docxHeight: 16838,
  },
  long: {
    key: "long",
    label: "Legal (Long)",
    subLabel: '8.5" × 13"',
    cssWidth: "816px",
    cssHeight: 1248,
    docxWidth: 12240,
    docxHeight: 18720,
  },
};

/* ============================================================================
 * FONT CONSTANTS
 * ==========================================================================*/
type DocFont = "serif" | "sans" | "mono" | "georgia";

const FONT_CONFIG: Record<DocFont, { name: string; css: string; docx: string; pdf: string }> = {
  serif: {
    name: "Times New Roman",
    css: "'Times New Roman', Times, serif",
    docx: "Times New Roman",
    pdf: "times",
  },
  sans: {
    name: "Arial / Calibri",
    css: "Arial, 'Helvetica Neue', sans-serif",
    docx: "Calibri",
    pdf: "helvetica",
  },
  georgia: {
    name: "Georgia",
    css: "Georgia, serif",
    docx: "Georgia",
    pdf: "times",
  },
  mono: {
    name: "Courier New",
    css: "'Courier New', Courier, monospace",
    docx: "Courier New",
    pdf: "courier",
  },
};


/* ============================================================================
 * SYSTEM PROMPT FOR REAL AI
 * ==========================================================================*/
export const SYSTEM_PROMPT = `You are a senior institutional and academic document drafting assistant for Cebu Technological University (CTU Argao Campus and System).

You generate professional, legally sound, and academic-grade documents (e.g., Memoranda, Office Orders, Activity Proposals, Course Syllabi, Endorsement Letters, Resolutions, Certificates, Policy Guidelines, Contracts, Terms of Reference, Minutes of Meeting).

RULES:
1. Generate ONLY the body content of the document. Do not generate graphic letterheads or institutional logos (those are attached via letterhead images).
2. Do not wrap the response in markdown code fences.
3. Maintain an executive, professional academic tone:
   - A top-level Title (# DOCUMENT TITLE) in UPPERCASE.
   - For Memoranda/Letters/Proposals, include institutional metadata block:
     **MEMORANDUM NO. / REF NO.:** __________, s. 2026
     **FOR / TO:** ___________________________________
     **THROUGH:** ___________________________________ (if applicable)
     **FROM:** _____________________________________
     **DATE:** _____________________________________
     **SUBJECT:** __________________________________
   - Use structured section headings (## 1.0 RATIONALE, ## 2.0 OBJECTIVES, ## 3.0 SCOPE & COVERAGE, ## 4.0 GUIDELINES / PROVISIONS, ## 5.0 TIMELINE & DELIVERABLES, ## 6.0 EFFECTIVITY).
   - For lists, use bulleted points ("- ") or numbered points ("1. ").
   - For blanks to be filled in later (names, amounts, dates, titles), use solid underline blanks: "________________________".
   - Always include formal university signature/concurrence blocks at the end:
     **Prepared by:**
     ____________________________________
     Faculty Member / Proponent

     **Reviewed & Endorsed by:**
     ____________________________________
     Department Chairperson / Dean

     **Approved by:**
     ____________________________________
     Campus Director / University President
4. Ensure the draft is complete, rich in institutional context, and ready for immediate printing.`;

/* ============================================================================
 * QUICK START TEMPLATES
 * ==========================================================================*/
const QUICK_PROMPTS = [
  {
    title: "Official Memorandum",
    prompt: "Draft an Official Campus Memorandum announcing the submission schedule and compliance guidelines for Midterm Grade Submissions and Instructional Materials for the current academic semester.",
  },
  {
    title: "Activity & Budget Proposal",
    prompt: "Create a formal Academic Activity and Budget Proposal for a 2-day Faculty Capability Training on AI and RAG Governance Tools at CTU Argao Campus.",
  },
  {
    title: "Course Syllabus (OBE)",
    prompt: "Generate an Outcomes-Based Education (OBE) Course Syllabus for IT 312: Advanced Database Systems, including Course Description, Intended Learning Outcomes, Assessment Tasks, and Grading Policy.",
  },
  {
    title: "Faculty Endorsement Letter",
    prompt: "Write a formal Endorsement Letter from the Department Chairperson to the Campus Director recommending faculty research paper presentation at an international conference.",
  },
  {
    title: "Academic Policy Resolution",
    prompt: "Draft an Academic Council Resolution approving the revised guidelines on Capstone Project Defense, Intellectual Property Rights, and Repository Archival for graduating BSIT students.",
  },
  {
    title: "Terms of Reference (TOR)",
    prompt: "Draft Terms of Reference (TOR) for the Campus Accreditation and Quality Assurance Working Committee, detailing committee composition, duties, reporting lines, and deliverables.",
  },
  {
    title: "Service Invoice / Contract",
    prompt: "Create a formal Service Invoice and Deliverable Sign-off for institutional IT infrastructure consulting and software development services.",
  },
  {
    title: "Certificate of Appreciation",
    prompt: "Draft a formal Certificate of Appreciation and Citation for a Keynote Resource Speaker at the Annual University IT Colloquium.",
  },
];

/* ============================================================================
 * TYPES
 * ==========================================================================*/
type ImageAsset = {
  dataUrl: string;
  base64: string;
  mimeType: "png" | "jpg" | "gif" | "bmp";
  width: number;
  height: number;
  fileName: string;
};

type GenerationStatus = "idle" | "generating" | "importing" | "success" | "error";
type DownloadTarget = "docx" | null;
type DocAlign = "left" | "center" | "right" | "justify";
type AppView = "chooser" | "compose" | "editor";
type RibbonTab = "home" | "layout" | "insert";

interface RunSpec {
  text: string;
  font: string;
  size: number;
  bold: boolean;
  italics: boolean;
  underline: boolean;
  strike: boolean;
}

/* ============================================================================
 * IMAGE CONSTANTS & HELPERS
 * ==========================================================================*/
const MAX_IMAGE_DIMENSION_PX = 1600;
const MAX_IMAGE_SIZE_MB = 5;
const HEADER_FOOTER_DISPLAY_HEIGHT_PX = 70;
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

    // Markdown Table handling
    if (line.startsWith("|")) {
      if (inList) { html += "</ul>"; inList = false; }

      if (/^[-:\s]+$/.test(line.replace(/\|/g, "").trim())) {
        if (inTable && isTableHeader) {
          html += "</thead><tbody>";
          isTableHeader = false;
        }
        continue;
      }

      const cells = line.split("|").filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map((c) => c.trim());

      if (!inTable) {
        inTable = true;
        isTableHeader = true;
        html += `<table style="width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 0.9em; page-break-inside: avoid;"><thead style="background-color: #f3f4f6;"><tr>`;
        cells.forEach((cell) => {
          html += `<th style="border: 1px solid #9ca3af; padding: 5px 8px; text-align: left; font-weight: 700;">${cell}</th>`;
        });
        html += `</tr>`;
      } else {
        const tag = isTableHeader ? "th" : "td";
        const style = isTableHeader
          ? "border: 1px solid #9ca3af; padding: 5px 8px; text-align: left; font-weight: 700;"
          : "border: 1px solid #d1d5db; padding: 5px 8px;";
        html += `<tr>`;
        cells.forEach((cell) => {
          html += `<${tag} style="${style}">${cell}</${tag}>`;
        });
        html += `</tr>`;
      }
      continue;
    } else if (inTable) {
      html += (isTableHeader ? "</thead>" : "</tbody>") + "</table>";
      inTable = false;
    }

    if (line.startsWith("# ")) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h1 style="text-align: center; margin: 0 0 14px 0; font-size: 1.45em; text-transform: uppercase; letter-spacing: 0.03em; font-weight: 700;">${line.slice(2)}</h1>`;
    } else if (line.startsWith("## ")) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h2 style="margin: 14px 0 6px 0; font-size: 1.15em; font-weight: 700; border-bottom: 1.5px solid #1f2937; padding-bottom: 2px;">${line.slice(3)}</h2>`;
    } else if (line.startsWith("### ")) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h3 style="margin: 10px 0 4px 0; font-size: 1.02em; font-weight: 700; border-bottom: 1px solid #6b7280; padding-bottom: 2px;">${line.slice(4)}</h3>`;
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!inList) {
        html += `<ul style="margin: 0 0 8px 0; padding-left: 24px; list-style-type: disc;">`;
        inList = true;
      }
      html += `<li style="margin-bottom: 4px; line-height: 1.45;">${line.slice(2)}</li>`;
    } else if (/^\d+\.\s/.test(line)) {
      if (inList) { html += "</ul>"; inList = false; }
      const text = line.replace(/^\d+\.\s/, "");
      html += `<p style="margin: 0 0 6px 0; line-height: 1.45;"><strong>${line.match(/^\d+\./)?.[0]}</strong> ${text}</p>`;
    } else {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<p style="margin: 0 0 6px 0; line-height: 1.45;">${line}</p>`;
    }
  }

  if (inList) html += "</ul>";
  if (inTable) html += (isTableHeader ? "</thead>" : "</tbody>") + "</table>";

  return html;
}

async function fileToImageAsset(file: File): Promise<ImageAsset> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Please upload a PNG, JPG, or WEBP image.");
  }
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    throw new Error(`Image must be smaller than ${MAX_IMAGE_SIZE_MB}MB.`);
  }

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

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
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
 * ---------------------------------------------------------------------------
 * These allow a block element that overflows the remaining space on a page
 * to be split into a "first" portion (kept on the current page) and a
 * "rest" portion (carried onto the next page) — the same way Word/Google
 * Docs/WPS fill each page completely instead of pushing a whole block down
 * and leaving a large blank gap.
 * ==========================================================================*/

/** Splits a <ul>/<ol> at the last <li> boundary that fits within maxHeight. */
function splitListAtHeight(listEl: HTMLElement, maxHeight: number): { firstHtml: string; restEl: HTMLElement } | null {
  const items = Array.from(listEl.children).filter((c) => c.tagName === "LI") as HTMLElement[];
  if (items.length < 2) return null;

  const listTop = listEl.getBoundingClientRect().top;
  let splitIndex = -1;
  for (let i = 0; i < items.length; i++) {
    const itemBottom = items[i].getBoundingClientRect().bottom;
    if (itemBottom - listTop <= maxHeight) {
      splitIndex = i;
    } else {
      break;
    }
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

/** Splits a text-bearing block (paragraph/heading) at the last line that fits within maxHeight. */
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
      if (remaining <= len) {
        range.setEnd(tn, Math.max(0, remaining));
        return range;
      }
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

  // If even a single character doesn't fit, this block can't be usefully split here.
  if (bottomAtOffset(1) - elTop > maxHeight) return null;

  let lo = 1;
  let hi = totalLen;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (bottomAtOffset(mid) - elTop <= maxHeight) lo = mid;
    else hi = mid - 1;
  }
  let splitOffset = lo;
  if (splitOffset >= totalLen - 1) return null; // nothing meaningful left to carry over

  // Snap back to the nearest word boundary so we don't cut a word in half.
  let combined = "";
  for (const tn of textNodes) combined += tn.textContent || "";
  let snapped = splitOffset;
  let guard = 0;
  while (snapped > 0 && guard < 60 && !/\s/.test(combined[snapped - 1] || "")) {
    snapped--;
    guard++;
  }
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

  // Trim a stray leading space left at the start of the carried-over remainder.
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
 * MAIN COMPONENT
 * ==========================================================================*/
export function DocumentGenerator() {
  const [view, setView] = useState<AppView>("chooser");
  const [prompt, setPrompt] = useState("");
  const [showAllPrompts, setShowAllPrompts] = useState(false);
  const [activeRibbonTab, setActiveRibbonTab] = useState<RibbonTab>("home");
  const [layoutLocked, setLayoutLocked] = useState(false);
  const layoutLockedRef = useRef(false);

  // Document Page Setup
  const [pageSize, setPageSize] = useState<PageSize>("short");
  const [docFont] = useState<DocFont>("serif");
  const [docFontSize] = useState(12);
  const [docAlign] = useState<DocAlign>("left");
  const [lineSpacing, setLineSpacing] = useState<"1.15" | "1.5" | "2.0">("1.5");

  // Selection Active Formatting States
  const [activeStyles, setActiveStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    ul: false,
    ol: false,
    alignLeft: true,
    alignCenter: false,
    alignRight: false,
    alignJustify: false,
    font: "serif" as DocFont,
  });

  const [displayedFontSize, setDisplayedFontSize] = useState(docFontSize);

  // Document Stats
  const [pageCount, setPageCount] = useState(1);
  const [wordCount, setWordCount] = useState(0);

  // Generation status
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<DownloadTarget>(null);

  // Letterhead Images
  const [headerImage, setHeaderImage] = useState<ImageAsset | null>(null);
  const [noHeader, setNoHeader] = useState(true);
  const [headerError, setHeaderError] = useState<string | null>(null);

  const [footerImage, setFooterImage] = useState<ImageAsset | null>(null);
  const [noFooter, setNoFooter] = useState(true);
  const [footerError, setFooterError] = useState<string | null>(null);

  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);
  const fontDropdownRef = useRef<HTMLDivElement>(null);
  const fontSizeDropdownRef = useRef<HTMLDivElement>(null);

  const headerInputRef = useRef<HTMLInputElement>(null);
  const footerInputRef = useRef<HTMLInputElement>(null);
  const documentFileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    layoutLockedRef.current = layoutLocked;
  }, [layoutLocked]);

  // Active range reference — preserved during formatting & ribbon clicks
  const savedRangeRef = useRef<Range | null>(null);
  const suppressNextStyleSyncRef = useRef<boolean>(false);

  // History stack for reliable Undo / Redo
  const historyStackRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);

  const initialHtmlRef = useRef<string>("");

  // Close dropdowns on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(e.target as Node)) {
        setShowFontDropdown(false);
      }
      if (fontSizeDropdownRef.current && !fontSizeDropdownRef.current.contains(e.target as Node)) {
        setShowFontSizeDropdown(false);
      }
    };
    if (showFontDropdown || showFontSizeDropdown) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showFontDropdown, showFontSizeDropdown]);

  const saveHistorySnapshot = () => {
    const html = getFullDocumentHtml();
    if (!html) return;
    if (historyIndexRef.current >= 0 && historyStackRef.current[historyIndexRef.current] === html) {
      return;
    }
    historyStackRef.current = historyStackRef.current.slice(0, historyIndexRef.current + 1);
    historyStackRef.current.push(html);
    historyIndexRef.current = historyStackRef.current.length - 1;
    setMasterHtml(html);
  };

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const html = historyStackRef.current[historyIndexRef.current];
      setMasterHtml(html);
      savedRangeRef.current = null;
      // Re-split and sync ALL pages from the restored snapshot
      computePageFragments(html);
      // Move caret to end of active page
      const activeEl = pageEditorRefs.current[lastActivePageIdxRef.current] || editorRef.current;
      if (activeEl) {
        const sel = window.getSelection();
        if (sel) {
          const r = document.createRange();
          r.selectNodeContents(activeEl);
          r.collapse(false);
          sel.removeAllRanges();
          sel.addRange(r);
        }
      }
    }
  };

  const handleRedo = () => {
    if (historyIndexRef.current < historyStackRef.current.length - 1) {
      historyIndexRef.current++;
      const html = historyStackRef.current[historyIndexRef.current];
      setMasterHtml(html);
      savedRangeRef.current = null;
      // Re-split and sync ALL pages from the restored snapshot
      computePageFragments(html);
      // Move caret to end of active page
      const activeEl = pageEditorRefs.current[lastActivePageIdxRef.current] || editorRef.current;
      if (activeEl) {
        const sel = window.getSelection();
        if (sel) {
          const r = document.createRange();
          r.selectNodeContents(activeEl);
          r.collapse(false);
          sel.removeAllRanges();
          sel.addRange(r);
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (e.key === "y" || e.key === "Y") {
        e.preventDefault();
        handleRedo();
      }
    }
  };

  const pageEditorRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const lastActivePageIdxRef = useRef(0);
  const isSyncingPagesRef = useRef(false);

  const getActiveEditor = (): HTMLDivElement | null => {
    const active = document.activeElement;
    for (const [idxStr, el] of Object.entries(pageEditorRefs.current)) {
      if (el && (el === active || el.contains(active))) {
        lastActivePageIdxRef.current = parseInt(idxStr, 10);
        return el;
      }
    }
    return pageEditorRefs.current[lastActivePageIdxRef.current] || editorRef.current;
  };

  const getActiveLiveRange = (): Range | null => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      if (!range.collapsed && range.toString().trim().length > 0) {
        return range;
      }
    }
    if (savedRangeRef.current && !savedRangeRef.current.collapsed && savedRangeRef.current.toString().trim().length > 0) {
      return savedRangeRef.current;
    }
    return null;
  };

  const [masterHtml, setMasterHtml] = useState("");
  const [pageHtmlFragments, setPageHtmlFragments] = useState<string[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const getFullDocumentHtml = (): string => {
    if (pageCount <= 1) {
      return pageEditorRefs.current[0]?.innerHTML || masterHtml || initialHtmlRef.current || "";
    }
    const parts: string[] = [];
    for (let i = 0; i < pageCount; i++) {
      const pageEl = pageEditorRefs.current[i];
      const content = pageEl ? pageEl.innerHTML : (pageHtmlFragments[i] || "");
      parts.push(content);
    }
    const combined = parts.join("");
    return combined || masterHtml || initialHtmlRef.current || "";
  };

  const computePageFragments = (sourceHtml?: string) => {
    const fullHtml = sourceHtml ?? getFullDocumentHtml();
    if (!fullHtml || !fullHtml.trim()) return;

    const currentConfig = PAGE_SIZES[pageSize];
    const headerHeight = !noHeader && headerImage ? 85 : 0;
    const footerHeight = !noFooter && footerImage ? 65 : 30;
    const usablePageHeight = currentConfig.cssHeight - 68 - headerHeight - footerHeight - 12;

    // Off-screen measurement container matching real canvas width, fonts, line-height & padding
    const tempContainer = document.createElement("div");
    tempContainer.style.cssText = `
      position: absolute;
      visibility: hidden;
      top: -9999px;
      left: -9999px;
      width: ${currentConfig.cssWidth};
      padding: 34px 48px;
      font-family: ${FONT_CONFIG[docFont].css};
      font-size: ${docFontSize}pt;
      line-height: ${lineSpacing};
      box-sizing: border-box;
      color: #111827;
    `;
    tempContainer.innerHTML = fullHtml;
    document.body.appendChild(tempContainer);

    const children = Array.from(tempContainer.children);
    let fragments: string[] = [];

    if (children.length === 0) {
      fragments = [fullHtml];
    } else {
      // A mutable queue so a split block's "rest" portion can be re-queued
      // for the next page (and split again if it's still too tall).
      const queue: HTMLElement[] = children as HTMLElement[];
      let qIndex = 0;
      let currentFragmentBlocks: string[] = [];
      let currentHeight = 0;
      const MIN_USEFUL_SPACE = 32; // px — below this, don't bother trying to split into the gap

      while (qIndex < queue.length) {
        const el = queue[qIndex];
        qIndex++;

        const tag = el.tagName.toLowerCase();
        const style = window.getComputedStyle(el);
        const marginTop = parseFloat(style.marginTop) || 0;
        const marginBottom = parseFloat(style.marginBottom) || 0;
        const blockHeight = (el.offsetHeight || 24) + marginTop + marginBottom;

        const spaceOnCurrentPage = usablePageHeight - currentHeight;

        // Fits entirely in whatever's left on the current page — keep going.
        if (blockHeight <= spaceOnCurrentPage) {
          currentFragmentBlocks.push(el.outerHTML);
          currentHeight += blockHeight;
          continue;
        }

        const isList = tag === "ul" || tag === "ol";
        const isParagraph = tag === "p";

        // Try to split the block so the page fills up instead of leaving a gap.
        const trySplit = (maxHeight: number) => {
          if (maxHeight < MIN_USEFUL_SPACE) return null;
          if (isList) return splitListAtHeight(el, maxHeight);
          if (isParagraph) return splitElementAtHeight(el, maxHeight);
          return null; // headings are kept intact — never split mid-title
        };

        const splitOnCurrentPage = currentFragmentBlocks.length > 0 ? trySplit(spaceOnCurrentPage) : null;

        if (splitOnCurrentPage) {
          currentFragmentBlocks.push(splitOnCurrentPage.firstHtml);
          fragments.push(currentFragmentBlocks.join(""));
          currentFragmentBlocks = [];
          currentHeight = 0;
          el.insertAdjacentElement("afterend", splitOnCurrentPage.restEl);
          queue.splice(qIndex, 0, splitOnCurrentPage.restEl);
          continue;
        }

        // Couldn't split into the remaining gap — start a fresh page.
        if (currentFragmentBlocks.length > 0) {
          fragments.push(currentFragmentBlocks.join(""));
          currentFragmentBlocks = [];
          currentHeight = 0;
        }

        // Even a full fresh page isn't tall enough — split against the full page height.
        if (blockHeight > usablePageHeight) {
          const splitOnFreshPage = trySplit(usablePageHeight);
          if (splitOnFreshPage) {
            fragments.push(splitOnFreshPage.firstHtml);
            el.insertAdjacentElement("afterend", splitOnFreshPage.restEl);
            queue.splice(qIndex, 0, splitOnFreshPage.restEl);
            continue;
          }
          // Can't split (e.g. a heading) — accept the overflow as its own page.
          fragments.push(el.outerHTML);
          continue;
        }

        // Fits a fresh page as a whole (just not the current one) — carry it over.
        currentFragmentBlocks.push(el.outerHTML);
        currentHeight += blockHeight;
      }

      if (currentFragmentBlocks.length > 0) {
        fragments.push(currentFragmentBlocks.join(""));
      }
    }

    document.body.removeChild(tempContainer);

    const finalFragments = fragments.length > 0 ? fragments : [fullHtml];
    setPageHtmlFragments(finalFragments);
    setPageCount(finalFragments.length);

    // Sync HTML fragments to un-focused page editor DOM nodes directly without React re-renders
    isSyncingPagesRef.current = true;
    try {
      const activeEl = document.activeElement;
      finalFragments.forEach((frag, idx) => {
        const pageEl = pageEditorRefs.current[idx];
        if (pageEl && pageEl !== activeEl && !pageEl.contains(activeEl)) {
          if (pageEl.innerHTML !== frag) pageEl.innerHTML = frag;
        }
      });
    } finally {
      isSyncingPagesRef.current = false;
    }
  };

  // Sync pageHtmlFragments to mounted DOM refs whenever pageHtmlFragments changes
  useEffect(() => {
    isSyncingPagesRef.current = true;
    try {
      const activeEl = document.activeElement;
      pageHtmlFragments.forEach((frag, idx) => {
        const pageEl = pageEditorRefs.current[idx];
        if (pageEl && pageEl !== activeEl && !pageEl.contains(activeEl)) {
          if (pageEl.innerHTML !== frag) pageEl.innerHTML = frag;
        }
      });
    } finally {
      isSyncingPagesRef.current = false;
    }
  }, [pageHtmlFragments]);

  const scheduleComputePageFragments = (sourceHtml?: string) => {
    if (layoutLockedRef.current) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => computePageFragments(sourceHtml), 180);
  };

  /**
   * Cancel any pending debounced recompute and read the latest live DOM state.
   * Call this at the start of every export (DOCX, PDF, Print) so that edits
   * typed within the 180ms debounce window are never silently dropped.
   */
  const flushPendingEdits = (): string => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    const html = getFullDocumentHtml();
    if (process.env.NODE_ENV !== "production") {
      if (html.length === 0 && initialHtmlRef.current.length > 0) {
        console.warn("[DocumentGenerator] flushPendingEdits returned empty HTML — check pageEditorRefs wiring.");
      }
    }
    setMasterHtml(html);
    return html;
  };

  const handlePageInput = (pageIdx: number, target: HTMLDivElement) => {
    if (isSyncingPagesRef.current) return;
    lastActivePageIdxRef.current = pageIdx;

    if (layoutLockedRef.current) {
      target.querySelectorAll<HTMLElement>(".pdf-t").forEach((span) => {
        const original = span.getAttribute("data-original") ?? "";
        if ((span.textContent || "") !== original) span.setAttribute("data-edited", "1");
        else span.removeAttribute("data-edited");
      });
      setPageHtmlFragments((prev) => {
        const next = prev.map((frag, i) => (i === pageIdx ? target.innerHTML : frag));
        return next;
      });
      setMasterHtml(getFullDocumentHtml());
      const text = target.innerText || "";
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
      updateActiveSelectionStyles();
      return;
    }

    const html = getFullDocumentHtml();
    setMasterHtml(html);

    const text = target.innerText || "";
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);

    scheduleComputePageFragments();
    updateActiveSelectionStyles();
  };

  // Recalculate Page Count & Word Count
  const updateStats = () => {
    const activeEd = getActiveEditor();
    if (!activeEd) return;
    const html = getFullDocumentHtml();
    setMasterHtml(html);

    const text = activeEd.innerText || "";
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);

    computePageFragments();
    updateActiveSelectionStyles();
  };

  const savedOffsetRef = useRef<{ pageIdx: number; start: number; end: number } | null>(null);

  const getSelectionOffsets = (container: HTMLElement): { start: number; end: number } | null => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
    const range = sel.getRangeAt(0);
    if (!container.contains(range.commonAncestorContainer)) return null;

    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(container);
    preCaretRange.setEnd(range.startContainer, range.startOffset);
    const start = preCaretRange.toString().length;

    return {
      start,
      end: start + range.toString().length,
    };
  };

  const setSelectionOffsets = (container: HTMLElement, start: number, end: number) => {
    const sel = window.getSelection();
    if (!sel) return;

    let charIndex = 0;
    const range = document.createRange();
    range.setStart(container, 0);
    range.collapse(true);

    const nodeStack: Node[] = [container];
    let node: Node | undefined;
    let foundStart = false;
    let foundEnd = false;

    while (!foundEnd && (node = nodeStack.pop())) {
      if (node.nodeType === Node.TEXT_NODE) {
        const nextCharIndex = charIndex + (node.textContent?.length || 0);
        if (!foundStart && start >= charIndex && start <= nextCharIndex) {
          range.setStart(node, start - charIndex);
          foundStart = true;
        }
        if (foundStart && end >= charIndex && end <= nextCharIndex) {
          range.setEnd(node, end - charIndex);
          foundEnd = true;
        }
        charIndex = nextCharIndex;
      } else {
        let i = node.childNodes.length;
        while (i--) {
          nodeStack.push(node.childNodes[i]);
        }
      }
    }

    if (foundStart) {
      if (!foundEnd) {
        range.setEnd(container, container.childNodes.length);
      }
      sel.removeAllRanges();
      sel.addRange(range);
      savedRangeRef.current = range.cloneRange();
    }
  };

  const saveCurrentSelection = () => {
    const sel = window.getSelection();
    const activeEd = getActiveEditor();
    if (
      sel &&
      sel.rangeCount > 0 &&
      !sel.isCollapsed &&
      sel.toString().trim().length > 0 &&
      activeEd &&
      activeEd.contains(sel.anchorNode)
    ) {
      const range = sel.getRangeAt(0);
      savedRangeRef.current = range.cloneRange();

      const pageEntry = Object.entries(pageEditorRefs.current).find(([_, el]) => el === activeEd);
      const pageIdx = pageEntry ? parseInt(pageEntry[0], 10) : 0;
      const offsets = getSelectionOffsets(activeEd);
      if (offsets) {
        savedOffsetRef.current = { pageIdx, start: offsets.start, end: offsets.end };
      }
    }
  };

  /** Restore the saved selection range so the highlight persists (Two-Layer Lock) */
  const restoreSelection = () => {
    const activeEd = getActiveEditor();
    if (activeEd) {
      activeEd.focus();
    }

    // Layer 1 (Primary): Live DOM Range Object
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      if (sel) {
        try {
          sel.removeAllRanges();
          sel.addRange(savedRangeRef.current.cloneRange());
          if (sel.rangeCount > 0 && !sel.isCollapsed) {
            return;
          }
        } catch {
          // Range is invalid after DOM changes, fall back to Layer 2
        }
      }
    }

    // Layer 2 (Fallback): Character offsets relative to page container
    if (savedOffsetRef.current) {
      const targetEd = pageEditorRefs.current[savedOffsetRef.current.pageIdx] || activeEd;
      if (targetEd) {
        try {
          setSelectionOffsets(targetEd, savedOffsetRef.current.start, savedOffsetRef.current.end);
        } catch {}
      }
    }
  };

  // Inspect selection formatting (Bold, Italic, Underline, Font Family, Font Size)
  const updateActiveSelectionStyles = () => {
    if (suppressNextStyleSyncRef.current) {
      suppressNextStyleSyncRef.current = false;
      return;
    }

    try {
      const sel = window.getSelection();
      const activeEl = getActiveEditor();

      if (sel && sel.rangeCount > 0 && activeEl?.contains(sel.anchorNode)) {
        if (!sel.isCollapsed && sel.toString().trim().length > 0) {
          savedRangeRef.current = sel.getRangeAt(0).cloneRange();
        } else if (sel.isCollapsed) {
          // Cleared ONLY when user explicitly clicks a single point inside the document editor
          savedRangeRef.current = null;
        }
      }

      if (sel && sel.rangeCount > 0 && activeEl?.contains(sel.anchorNode)) {
        let isBold = document.queryCommandState("bold");
        let isItalic = document.queryCommandState("italic");
        let isUnderline = document.queryCommandState("underline");
        let isStrike = document.queryCommandState("strikeThrough");
        let isUl = document.queryCommandState("insertUnorderedList");
        let isOl = document.queryCommandState("insertOrderedList");

        const range = sel.getRangeAt(0);
        let node: Node | null;
        if (
          range.startContainer === range.endContainer &&
          range.endOffset - range.startOffset === 1 &&
          range.startContainer.childNodes[range.startOffset]?.nodeType === Node.ELEMENT_NODE
        ) {
          // range selects a single whole element (our selectNode() case) — use that element
          node = range.startContainer.childNodes[range.startOffset];
        } else {
          node = sel.anchorNode;
          if (node?.nodeType === Node.TEXT_NODE) node = node.parentNode;
        }

        let detectedFont: DocFont = docFont;
        let detectedSize: number = docFontSize;

        if (node && node instanceof HTMLElement) {
          const fontStyle = window.getComputedStyle(node);
          const fontFamilyLower = fontStyle.fontFamily.toLowerCase();

          if (fontFamilyLower.includes("times")) detectedFont = "serif";
          else if (fontFamilyLower.includes("arial") || fontFamilyLower.includes("calibri") || fontFamilyLower.includes("sans-serif")) detectedFont = "sans";
          else if (fontFamilyLower.includes("georgia")) detectedFont = "georgia";
          else if (fontFamilyLower.includes("courier")) detectedFont = "mono";

          if (!isBold) {
            const weight = fontStyle.fontWeight;
            if (weight === "bold" || parseInt(weight) >= 600 || node.closest("b, strong")) {
              isBold = true;
            }
          }
          if (!isItalic) {
            if (fontStyle.fontStyle === "italic" || node.closest("i, em")) {
              isItalic = true;
            }
          }
          if (!isUnderline) {
            if (fontStyle.textDecoration.includes("underline") || node.closest("u")) {
              isUnderline = true;
            }
          }

          const parsedPx = parseFloat(fontStyle.fontSize);
          if (parsedPx) {
            detectedSize = Math.round((parsedPx * 72) / 96);
          }
        }

        setActiveStyles({
          bold: isBold,
          italic: isItalic,
          underline: isUnderline,
          strike: isStrike,
          ul: isUl,
          ol: isOl,
          alignLeft: document.queryCommandState("justifyLeft") || docAlign === "left",
          alignCenter: document.queryCommandState("justifyCenter") || docAlign === "center",
          alignRight: document.queryCommandState("justifyRight") || docAlign === "right",
          alignJustify: document.queryCommandState("justifyFull") || docAlign === "justify",
          font: detectedFont,
        });
        setDisplayedFontSize(detectedSize);
      }
    } catch {
      // ignore
    }
  };

  // Document-level selection listener
  useEffect(() => {
    const handleSelection = () => {
      if (view === "editor") {
        updateActiveSelectionStyles();
      }
    };
    document.addEventListener("selectionchange", handleSelection);
    return () => document.removeEventListener("selectionchange", handleSelection);
  }, [view, docAlign]);

  // Mount HTML into contentEditable when view first changes to editor and compute page fragments
  useEffect(() => {
    if (view !== "editor") return;

    if (layoutLockedRef.current) {
      setTimeout(() => updateActiveSelectionStyles(), 50);
      return;
    }

    // Use masterHtml if already set by handleGenerate; fall back to initialHtmlRef
    const initialHtml = masterHtml || initialHtmlRef.current || "";
    if (initialHtml) {
      if (pageEditorRefs.current[0]) {
        pageEditorRefs.current[0].innerHTML = initialHtml;
      }
      // Only reset history if it's empty (not already seeded by handleGenerate)
      if (historyStackRef.current.length === 0) {
        historyStackRef.current = [initialHtml];
        historyIndexRef.current = 0;
        setMasterHtml(initialHtml);
      }
      setTimeout(() => {
        computePageFragments(initialHtml);
        updateActiveSelectionStyles();
      }, 50);
    }
  }, [view]);

  // Recalculate page fragments when page size, font, line spacing, or letterheads change
  useEffect(() => {
    if (view === "editor" && !layoutLockedRef.current) {
      setTimeout(() => {
        computePageFragments();
      }, 50);
    }
  }, [pageSize, docFont, docFontSize, lineSpacing, headerImage, footerImage, noHeader, noFooter]);

  /* ── Image Upload Handlers ─────────────────────────────────────────────── */
  const handleHeaderUpload = async (file: File | undefined) => {
    if (!file) return;
    setHeaderError(null);
    try {
      const asset = await fileToImageAsset(file);
      setHeaderImage(asset);
      setNoHeader(false);
    } catch (err) {
      setHeaderError(err instanceof Error ? err.message : "Could not process image.");
    }
  };

  const handleFooterUpload = async (file: File | undefined) => {
    if (!file) return;
    setFooterError(null);
    try {
      const asset = await fileToImageAsset(file);
      setFooterImage(asset);
      setNoFooter(false);
    } catch (err) {
      setFooterError(err instanceof Error ? err.message : "Could not process image.");
    }
  };

  const removeHeaderLetterhead = () => {
    setHeaderImage(null);
    setNoHeader(true);
    setHeaderError(null);
  };

  const removeFooterLetterhead = () => {
    setFooterImage(null);
    setNoFooter(true);
    setFooterError(null);
  };

  /* ── Generate Document ─────────────────────────────────────────────────── */
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setStatus("generating");
    setErrorMessage(null);

    try {
      let rawContent = "";
      try {
        const response = await fetch("/api/generate-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });

        if (response.ok) {
          const data = await response.json();
          rawContent = data.content ?? "";
        } else {
          throw new Error("Server returned error status");
        }
      } catch {
        rawContent = `# ${prompt.toUpperCase()}\n\n**DOCUMENT REF NO.:** CTU-ARG-DOC-2026-001\n**DATE:** ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}\n\n---\n\n## 1.0 PURPOSE AND SCOPE\nThis document outlines the official guidelines, operational protocols, and procedural terms regarding ${prompt}.\n\n## 2.0 DIRECTIVES AND PROVISIONS\n- All concerned personnel shall adhere to university governance standards.\n- Regular compliance reports must be submitted to the Office of the Dean.\n\n## 3.0 SIGNATORIES\n\n**Prepared by:**\n____________________________________\nFaculty / Proponent\n\n**Approved by:**\n____________________________________\nCampus Director`;
      }

      const parsedHtml = markdownToHtml(rawContent);

      // ── Full reset of all document state ──────────────────────────────────
      // Clear all page editor DOM nodes so stale content never leaks across generations
      Object.values(pageEditorRefs.current).forEach((el) => {
        if (el) el.innerHTML = "";
      });
      pageEditorRefs.current = {};
      lastActivePageIdxRef.current = 0;
      savedRangeRef.current = null;
      historyStackRef.current = [parsedHtml];
      historyIndexRef.current = 0;

      // Authoritative document state
      initialHtmlRef.current = parsedHtml;
      setMasterHtml(parsedHtml);
      setPageHtmlFragments([parsedHtml]);
      setPageCount(1);
      setWordCount(parsedHtml.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length);

      setStatus("success");

      if (view === "editor") {
        // Already in editor view — useEffect([view]) won't re-fire.
        // Directly seed page 0 and compute fragments after a tick.
        setTimeout(() => {
          const el0 = pageEditorRefs.current[0];
          if (el0) el0.innerHTML = parsedHtml;
          computePageFragments(parsedHtml);
          updateActiveSelectionStyles();
        }, 50);
      } else {
        setView("editor");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to draft document.");
      setStatus("error");
    }
  };

  /* ── Targeted Selection Formatting (Strict Selection Range Isolation) ── */
  const applyFontToSelection = (fontKey: DocFont): boolean => {
    restoreSelection();
    const activeEd = getActiveEditor();
    if (!activeEd) return false;
    const range = getActiveLiveRange();
    if (!range || range.collapsed) return false;

    const fontCss = FONT_CONFIG[fontKey].css;

    activeEd.focus();
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }

    try {
      let span: HTMLElement;

      const commonContainer = range.commonAncestorContainer;
      let targetExisting: HTMLElement | null = null;
      if (commonContainer instanceof HTMLElement && commonContainer.getAttribute("data-fmt-span") === "1") {
        targetExisting = commonContainer;
      } else if (commonContainer.parentElement && commonContainer.parentElement.getAttribute("data-fmt-span") === "1") {
        targetExisting = commonContainer.parentElement;
      }

      if (targetExisting) {
        span = targetExisting;
        span.style.fontFamily = fontCss;
      } else {
        span = document.createElement("span");
        span.setAttribute("data-fmt-span", "1");
        span.style.fontFamily = fontCss;

        const fragment = range.extractContents();
        fragment.querySelectorAll("*").forEach((child) => {
          if (child instanceof HTMLElement) {
            if (child.style.fontFamily) child.style.fontFamily = fontCss;
            if (child.tagName === "FONT") {
              child.removeAttribute("face");
              child.style.fontFamily = fontCss;
            }
          }
        });

        span.appendChild(fragment);
        range.insertNode(span);
      }

      const newRange = document.createRange();
      newRange.selectNode(span);
      suppressNextStyleSyncRef.current = true;
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
      savedRangeRef.current = newRange.cloneRange();
      setActiveStyles((prev) => ({ ...prev, font: fontKey }));
      saveHistorySnapshot();
      restoreSelection();
      return true;
    } catch {
      return false;
    }
  };

  const applyFontSizeToSelection = (deltaOrSize: number, isAbsolute = false): boolean => {
    restoreSelection();
    const activeEd = getActiveEditor();
    if (!activeEd) return false;
    const range = getActiveLiveRange();
    if (!range || range.collapsed) return false;

    const targetPt = isAbsolute
      ? Math.max(8, Math.min(124, deltaOrSize))
      : Math.max(8, Math.min(124, displayedFontSize + deltaOrSize));

    activeEd.focus();
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }

    try {
      let span: HTMLElement;

      const commonContainer = range.commonAncestorContainer;
      let targetExisting: HTMLElement | null = null;
      if (commonContainer instanceof HTMLElement && commonContainer.getAttribute("data-fmt-span") === "1") {
        targetExisting = commonContainer;
      } else if (commonContainer.parentElement && commonContainer.parentElement.getAttribute("data-fmt-span") === "1") {
        targetExisting = commonContainer.parentElement;
      }

      if (targetExisting) {
        span = targetExisting;
        span.style.fontSize = `${targetPt}pt`;
      } else {
        span = document.createElement("span");
        span.setAttribute("data-fmt-span", "1");
        span.style.fontSize = `${targetPt}pt`;

        const fragment = range.extractContents();
        fragment.querySelectorAll("*").forEach((child) => {
          if (child instanceof HTMLElement && child.style.fontSize) {
            child.style.fontSize = `${targetPt}pt`;
          }
        });

        span.appendChild(fragment);
        range.insertNode(span);
      }

      const newRange = document.createRange();
      newRange.selectNode(span);
      suppressNextStyleSyncRef.current = true;
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
      savedRangeRef.current = newRange.cloneRange();
      setDisplayedFontSize(targetPt);
      saveHistorySnapshot();
      restoreSelection();
      return true;
    } catch {
      return false;
    }
  };

  // Applies text style formatting ONLY if text is currently highlighted
  const applyFormattingCommand = (command: string, value: string | undefined = undefined) => {
    restoreSelection();
    const activeEd = getActiveEditor();
    if (!activeEd) return;
    const range = getActiveLiveRange();
    if (!range) return;

    activeEd.focus();
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }

    document.execCommand(command, false, value);

    // Keep text highlighted after formatting!
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }

    saveHistorySnapshot();
    updateStats();

    // Restore selection so highlight persists for consecutive formatting
    restoreSelection();
  };

  const handleFontFamilyChange = (newFont: DocFont) => {
    const applied = applyFontToSelection(newFont);
    if (applied) {
      updateStats();
      restoreSelection();
    }
    setShowFontDropdown(false);
  };

  const handleFontSizeChange = (deltaOrSize: number, isAbsolute = false) => {
    const applied = applyFontSizeToSelection(deltaOrSize, isAbsolute);
    if (applied) {
      updateStats();
      restoreSelection();
    }
    setShowFontSizeDropdown(false);
  };

  const handleAlignmentChange = (align: DocAlign) => {
    restoreSelection();
    const activeEd = getActiveEditor();
    if (!activeEd) return;
    const range = getActiveLiveRange();
    if (!range) return;

    activeEd.focus();
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }

    const cmd = align === "center" ? "justifyCenter" : align === "right" ? "justifyRight" : align === "justify" ? "justifyFull" : "justifyLeft";
    document.execCommand(cmd);

    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }

    saveHistorySnapshot();
    updateStats();

    // Restore selection so highlight persists
    restoreSelection();
  };

  const insertSignatureBlank = () => {
    const activeEd = getActiveEditor();
    if (!activeEd) return;
    activeEd.focus();
    document.execCommand("insertText", false, "____________________________________");
    saveHistorySnapshot();
    updateStats();
  };

  const insertDateStamp = () => {
    const activeEd = getActiveEditor();
    if (!activeEd) return;
    activeEd.focus();
    const dateStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    document.execCommand("insertText", false, dateStr);
    saveHistorySnapshot();
    updateStats();
  };

  // NOTE: the previous approach fed ALL content into one continuous
  // <table> and let the *browser* decide where page breaks fall
  // (thead/tfoot with display:table-header-group/table-footer-group).
  // That's the standard trick for repeating a header/footer on every
  // printed page, but pinning the footer to the physical bottom margin
  // additionally requires the browser to stretch the content row to fill
  // 100% of "the page" — and browsers resolve that percentage once against
  // the whole flowed document, not per printed page, so it only reliably
  // lands on the bottom when a page happens to be completely full.
  //
  // Instead, we reuse the exact page split the on-screen editor already
  // computed (pageHtmlFragments / the live per-page DOM) and render each
  // page as its own fixed-size box: width/height pinned to the physical
  // paper size, laid out as a flex column with header, content, footer.
  // `justify-content: space-between` puts the header at the very top and
  // the footer at the very bottom of THAT box regardless of how much text
  // is on the page — there's no percentage math for the browser to get
  // wrong, and no dependency on the content happening to fill the page.
  const PAGE_INCHES: Record<PageSize, { width: number; height: number }> = {
    short: { width: 8.5, height: 11 },
    a4: { width: 8.27, height: 11.69 },
    long: { width: 8.5, height: 13 },
  };

  // Read the freshest per-page HTML straight off the live editor DOM
  // (falling back to the last computed fragment, then the joined
  // document) so print always matches what's on screen, page for page.
  const getLivePageFragments = (): string[] => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    const total = Math.max(pageCount, 1);
    const frags: string[] = [];
    for (let i = 0; i < total; i++) {
      const el = pageEditorRefs.current[i];
      frags.push(el ? el.innerHTML : pageHtmlFragments[i] || "");
    }
    const hasContent = frags.some((f) => f && f.trim().length > 0);
    if (!hasContent) {
      const combined = getFullDocumentHtml();
      return [combined || ""];
    }
    return frags;
  };

  const buildPrintStyles = (
    fontCss: string,
    fontSizePt: number,
    spacing: string,
    align: string,
    sizeKey: PageSize
  ): string => {
    const { width, height } = PAGE_INCHES[sizeKey];

    return `<style>
      /* margin: 0 — each .print-page manages its own margin via padding,
         so its box IS the full physical page and header/footer can be
         pinned to its literal top/bottom edges. */
      @page { size: ${width}in ${height}in; margin: 0; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; }
      body {
        font-family: ${fontCss};
        font-size: ${fontSizePt}pt;
        color: #111;
        line-height: ${spacing};
      }
      .print-page {
        width: ${width}in;
        height: ${height}in;
        padding: 0.35in 0.5in;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        overflow: hidden;
        page-break-after: always;
        break-after: page;
      }
      .print-page:last-child {
        page-break-after: auto;
        break-after: auto;
      }
      .print-header { flex: 0 0 auto; text-align: center; padding-bottom: 6px; }
      .print-header img { max-height: 75px; max-width: 100%; object-fit: contain; }
      .print-content { flex: 1 1 auto; overflow: hidden; text-align: ${align}; }
      .print-footer { flex: 0 0 auto; text-align: center; padding-top: 6px; }
      .print-footer img { max-height: 50px; max-width: 100%; object-fit: contain; }
      table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 0.9em; page-break-inside: avoid; }
      th, td { border: 1px solid #9ca3af; padding: 5px 8px; text-align: left; }
      th { background-color: #f3f4f6; font-weight: bold; }
      h1 { font-size: 1.45em; text-align: center; text-transform: uppercase; margin: 0 0 12px 0; }
      h2 { font-size: 1.15em; border-bottom: 1.5px solid #111; padding-bottom: 2px; margin: 14px 0 6px 0; }
      h3 { font-size: 1.02em; border-bottom: 1px solid #555; padding-bottom: 2px; margin: 10px 0 4px 0; }
      p { margin: 0 0 6px 0; line-height: 1.45; }
      ul, ol { margin: 0 0 8px 0; padding-left: 24px; }
      li { margin-bottom: 4px; line-height: 1.45; }
    </style>`;
  };

  /* ── Print Document ────────────────────────────────────────────────────── */
  const handlePrint = () => {
    flushPendingEdits(); // commits masterHtml + clears the debounce timer
    const fragments = getLivePageFragments();
    const fontConfig = FONT_CONFIG[docFont];
    const printWindow = window.open("", "_blank", "width=900,height=750");
    if (!printWindow) return setErrorMessage("Please allow pop-ups to print the document.");

    const showHeader = !noHeader && !!headerImage;
    const showFooter = !noFooter && !!footerImage;
    const headerHtml = showHeader
      ? `<div class="print-header"><img src="${headerImage!.dataUrl}" /></div>`
      : `<div class="print-header"></div>`;
    const footerHtml = showFooter
      ? `<div class="print-footer"><img src="${footerImage!.dataUrl}" /></div>`
      : `<div class="print-footer"></div>`;

    const styles = buildPrintStyles(fontConfig.css, docFontSize, lineSpacing, docAlign, pageSize);

    // Header repeats at the top and footer at the bottom of EVERY page —
    // each .print-page is a self-contained, fixed-size box, so placement
    // never depends on how much content that particular page holds.
    const pagesHtml = fragments
      .map(
        (frag) =>
          `<div class="print-page">${headerHtml}<div class="print-content">${frag}</div>${footerHtml}</div>`
      )
      .join("");

    printWindow.document.write(`<!DOCTYPE html><html><head><title>${sanitizeFileName(prompt)}</title>${styles}</head><body>${pagesHtml}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  /* ── DOCX Export ───────────────────────────────────────────────────────── */
  const handleDownloadDocx = async () => {
    setDownloading("docx");
    setErrorMessage(null);

    try {
      const liveHtml = flushPendingEdits();
      const temp = document.createElement("div");
      temp.innerHTML = liveHtml;
      const defaultFontName = FONT_CONFIG[docFont].docx;
      const baseHalfPt = docFontSize * 2;
      const currentSizeConfig = PAGE_SIZES[pageSize];
      const paragraphs: Paragraph[] = [];

      const extractTextRuns = (
        node: Node,
        inheritBold = false,
        inheritItalic = false,
        inheritUnderline = false,
        inheritStrike = false,
        inheritFont = defaultFontName,
        inheritSize = baseHalfPt
      ): RunSpec[] => {
        const specs: RunSpec[] = [];
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent ?? "";
          if (text) {
            specs.push({
              text,
              font: inheritFont,
              size: inheritSize,
              bold: inheritBold,
              italics: inheritItalic,
              underline: inheritUnderline,
              strike: inheritStrike,
            });
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const isBold = inheritBold || el.tagName === "STRONG" || el.tagName === "B" || el.style.fontWeight === "bold" || parseInt(el.style.fontWeight) >= 600;
          const isItalic = inheritItalic || el.tagName === "EM" || el.tagName === "I" || el.style.fontStyle === "italic";
          const isUnderline = inheritUnderline || el.tagName === "U" || el.style.textDecoration.includes("underline");
          const isStrike = inheritStrike || el.tagName === "STRIKE" || el.tagName === "S" || el.tagName === "DEL" || el.style.textDecoration.includes("line-through");

          let currentFont = inheritFont;
          if (el.style.fontFamily) {
            if (el.style.fontFamily.includes("Times")) currentFont = "Times New Roman";
            else if (el.style.fontFamily.includes("Arial") || el.style.fontFamily.includes("Calibri")) currentFont = "Calibri";
            else if (el.style.fontFamily.includes("Courier")) currentFont = "Courier New";
            else if (el.style.fontFamily.includes("Georgia")) currentFont = "Georgia";
          }

          let currentSize = inheritSize;
          if (el.style.fontSize) {
            const parsedPt = parseFontSizePt(el.style.fontSize, Math.round(inheritSize / 2));
            if (parsedPt) {
              currentSize = parsedPt * 2;
            }
          }

          for (const child of Array.from(el.childNodes)) {
            specs.push(...extractTextRuns(child, isBold, isItalic, isUnderline, isStrike, currentFont, currentSize));
          }
        }
        return specs;
      };

      for (const block of Array.from(temp.children)) {
        const el = block as HTMLElement;
        const tag = el.tagName.toLowerCase();

        if (tag === "h1") {
          paragraphs.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 140, after: 260 },
            children: extractTextRuns(el, true).map((r) => new TextRun({
              text: r.text.toUpperCase(),
              font: r.font || defaultFontName,
              bold: true,
              size: Math.round(baseHalfPt * 1.55),
            })),
          }));
        } else if (tag === "h2") {
          paragraphs.push(new Paragraph({
            spacing: { before: 240, after: 120 },
            children: extractTextRuns(el, true).map((r) => new TextRun({
              text: r.text,
              font: r.font || defaultFontName,
              bold: true,
              underline: {},
              size: Math.round(baseHalfPt * 1.2),
            })),
          }));
        } else if (tag === "h3") {
          paragraphs.push(new Paragraph({
            spacing: { before: 180, after: 100 },
            children: extractTextRuns(el, true).map((r) => new TextRun({
              text: r.text,
              font: r.font || defaultFontName,
              bold: true,
              underline: {},
              size: Math.round(baseHalfPt * 1.05),
            })),
          }));
        } else if (tag === "ul" || tag === "ol") {
          for (const li of Array.from(el.querySelectorAll("li"))) {
            paragraphs.push(new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 40, after: 40 },
              children: extractTextRuns(li).map((r) => new TextRun({
                text: r.text,
                font: r.font || defaultFontName,
                bold: r.bold,
                italics: r.italics,
                underline: r.underline ? {} : undefined,
                strike: r.strike,
                size: r.size || baseHalfPt,
              })),
            }));
          }
        } else {
          paragraphs.push(new Paragraph({
            alignment: docAlign === "center" ? AlignmentType.CENTER : docAlign === "right" ? AlignmentType.RIGHT : AlignmentType.LEFT,
            spacing: { before: 60, after: 100 },
            children: extractTextRuns(el).map((r) => new TextRun({
              text: r.text,
              font: r.font || defaultFontName,
              bold: r.bold,
              italics: r.italics,
              underline: r.underline ? {} : undefined,
              strike: r.strike,
              size: r.size || baseHalfPt,
            })),
          }));
        }
      }

      const headerContent = !noHeader && headerImage
        ? new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new ImageRun({
                    data: base64ToUint8Array(headerImage.base64),
                    transformation: scaledDocxDimensions(headerImage),
                    type: "png",
                  }),
                ],
              }),
            ],
          })
        : new Header({ children: [new Paragraph("")] });

      const footerContent = !noFooter && footerImage
        ? new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new ImageRun({
                    data: base64ToUint8Array(footerImage.base64),
                    transformation: scaledDocxDimensions(footerImage),
                    type: "png",
                  }),
                ],
              }),
            ],
          })
        : new Footer({ children: [new Paragraph("")] });

      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                size: {
                  width: currentSizeConfig.docxWidth,
                  height: currentSizeConfig.docxHeight,
                },
                margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
              },
            },
            headers: { default: headerContent },
            footers: { default: footerContent },
            children: paragraphs.length > 0 ? paragraphs : [new Paragraph({ text: "CTU Document" })],
          },
        ],
        styles: {
          default: {
            document: { run: { font: defaultFontName, size: baseHalfPt } },
          },
        },
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${sanitizeFileName(prompt)}_${new Date().toISOString().slice(0, 10)}.docx`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to generate DOCX.");
    } finally {
      setDownloading(null);
    }
  };

  /* ========================================================================
   * RENDER: PHASE 2 (CTU DOCUMENT STUDIO)
   * ====================================================================== */
  if (view === "editor") {
    const currentSizeConfig = PAGE_SIZES[pageSize];

    return (
      <div className="space-y-4">
        {/* Error Banner */}
        {errorMessage && (
          <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
            <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-rose-700">{errorMessage}</p>
          </div>
        )}

        {/* ── COMBINED STICKY TOOLBAR (HEADER + RIBBON) ────────────────────── */}
        <div className="sticky top-16 z-30 space-y-3 bg-[#F3F4F6] pt-2 pb-3 shadow-md -mx-4 px-4 sm:-mx-6 sm:px-6">
          {/* ── TOP HEADER & EXPORT ACTIONS ─────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Document Title & Branding */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setView("compose")}
                  className="flex items-center gap-2 px-3.5 py-2 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-xs font-bold text-[#374151] transition-all shadow-sm active:scale-95"
                >
                  <ArrowLeft className="h-4 w-4 text-[#dd7230]" />
                  <span>New Prompt</span>
                </button>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#dd7230] flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    CTU DOCUMENT
                  </span>
                  <p className="text-sm font-semibold text-[#1F2937] truncate max-w-[260px] sm:max-w-md">
                    {prompt || "Institutional Document"}
                  </p>
                </div>
              </div>

              {/* Top Primary Export Actions */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleDownloadDocx}
                  disabled={downloading !== null}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
                  title="Export as Microsoft Word (.docx)"
                >
                  {downloading === "docx" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  <span>DOCX</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#1D6FA3] hover:bg-[#0B3C5D] text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
                  title="Print Directly"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── CTU RIBBON TOOLBAR ─────────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm relative z-20">
          {/* Ribbon Tabs */}
          <div className="flex items-center border-b border-[#E5E7EB] bg-[#F9FAFB] px-3 pt-1 gap-1">
            <button
              onClick={() => setActiveRibbonTab("home")}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all ${
                activeRibbonTab === "home"
                  ? "bg-white text-[#dd7230] border-t-2 border-t-[#dd7230] shadow-sm"
                  : "text-[#6B7280] hover:text-[#1F2937]"
              }`}
            >
              Home &amp; Font
            </button>
            <button
              onClick={() => setActiveRibbonTab("layout")}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all ${
                activeRibbonTab === "layout"
                  ? "bg-white text-[#dd7230] border-t-2 border-t-[#dd7230] shadow-sm"
                  : "text-[#6B7280] hover:text-[#1F2937]"
              }`}
            >
              Page Layout &amp; Size
            </button>
            <button
              onClick={() => setActiveRibbonTab("insert")}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all ${
                activeRibbonTab === "insert"
                  ? "bg-white text-[#dd7230] border-t-2 border-t-[#dd7230] shadow-sm"
                  : "text-[#6B7280] hover:text-[#1F2937]"
              }`}
            >
              Letterhead &amp; Inserts
            </button>
          </div>

          {/* Ribbon Controls Area */}
          <div className="p-3 sm:p-4 bg-white flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
            {/* ── TAB 1: HOME & FONT ── */}
            {activeRibbonTab === "home" && (
              <>
                {/* Undo / Redo */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">History</span>
                  <div className="flex items-center rounded-lg border border-[#E5E7EB] overflow-hidden bg-[#F9FAFB] p-0.5 gap-0.5">
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleUndo();
                      }}
                      className="p-1.5 rounded hover:bg-[#E5E7EB] text-[#374151] hover:text-[#dd7230] transition-colors"
                      title="Undo (Ctrl+Z)"
                    >
                      <Undo className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleRedo();
                      }}
                      className="p-1.5 rounded hover:bg-[#E5E7EB] text-[#374151] hover:text-[#dd7230] transition-colors"
                      title="Redo (Ctrl+Y)"
                    >
                      <Redo className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="h-8 w-px bg-[#E5E7EB] hidden sm:block" />

                {/* Font Family Dropdown */}
                <div className="flex flex-col gap-1 relative" ref={fontDropdownRef}>
                  <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Font Family</span>
                  <div className="relative">
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setShowFontDropdown((v) => !v);
                      }}
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
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleFontFamilyChange(fKey);
                            }}
                            className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-[#FFF4E5] hover:text-[#dd7230] flex items-center justify-between transition-colors ${
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

                {/* Font Size Editable Input Control */}
                <div className="flex flex-col gap-1 relative">
                  <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Font Size (8–124)</span>
                  <div className="flex items-center rounded-lg border border-[#E5E7EB] overflow-hidden bg-[#F9FAFB] relative">
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleFontSizeChange(-1, false);
                      }}
                      className="px-2 py-1.5 hover:bg-[#E5E7EB] text-[#6B7280] hover:text-[#dd7230] transition-colors border-r border-[#E5E7EB]"
                      title="Decrease font size (-1pt)"
                    >
                      <Minus className="h-3 w-3" />
                    </button>

                    <div className="flex items-center px-1">
                      <input
                        type="number"
                        min={8}
                        max={124}
                        value={displayedFontSize}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          saveCurrentSelection();
                        }}
                        onFocus={() => {
                          saveCurrentSelection();
                        }}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            setDisplayedFontSize(val);
                          } else {
                            setDisplayedFontSize("" as any);
                          }
                        }}
                        onBlur={(e) => {
                          let val = parseInt(e.target.value, 10);
                          if (isNaN(val) || val < 8) val = 8;
                          if (val > 124) val = 124;
                          setDisplayedFontSize(val);
                          handleFontSizeChange(val, true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        className="w-10 text-center py-1 text-xs font-extrabold text-[#1F2937] focus:text-[#dd7230] outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        title="Type font size (8 to 124 pt) and press Enter"
                      />
                      <span className="text-[10px] font-bold text-gray-400 select-none mr-1">pt</span>
                    </div>

                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleFontSizeChange(1, false);
                      }}
                      className="px-2 py-1.5 hover:bg-[#E5E7EB] text-[#6B7280] hover:text-[#dd7230] transition-colors border-l border-[#E5E7EB]"
                      title="Increase font size (+1pt)"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="h-8 w-px bg-[#E5E7EB] hidden sm:block" />

                {/* Style Formatting (Bold, Italic, Underline, Strikethrough) */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Text Style (Selection Only)</span>
                  <div className="flex items-center rounded-lg border border-[#E5E7EB] overflow-hidden bg-[#F9FAFB] p-0.5 gap-0.5">
                    {/* Bold Button */}
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applyFormattingCommand("bold");
                      }}
                      className={`p-1.5 rounded transition-colors ${
                        activeStyles.bold
                          ? "text-[#dd7230] font-black"
                          : "text-[#374151] hover:text-[#dd7230]"
                      }`}
                      title="Bold (Ctrl+B)"
                    >
                      <Bold className={`h-4 w-4 ${activeStyles.bold ? "stroke-[3.4]" : "stroke-[2]"}`} />
                    </button>

                    {/* Italic Button */}
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applyFormattingCommand("italic");
                      }}
                      className={`p-1.5 rounded transition-colors ${
                        activeStyles.italic
                          ? "text-[#dd7230] font-bold"
                          : "text-[#374151] hover:text-[#dd7230]"
                      }`}
                      title="Italic (Ctrl+I)"
                    >
                      <Italic className={`h-4 w-4 ${activeStyles.italic ? "stroke-[3.4]" : "stroke-[2]"}`} />
                    </button>

                    {/* Underline Button */}
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applyFormattingCommand("underline");
                      }}
                      className={`p-1.5 rounded transition-colors ${
                        activeStyles.underline
                          ? "text-[#dd7230] font-bold"
                          : "text-[#374151] hover:text-[#dd7230]"
                      }`}
                      title="Underline (Ctrl+U)"
                    >
                      <UnderlineIcon className={`h-4 w-4 ${activeStyles.underline ? "stroke-[3.4]" : "stroke-[2]"}`} />
                    </button>

                    {/* Strikethrough Button */}
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applyFormattingCommand("strikeThrough");
                      }}
                      className={`p-1.5 rounded transition-colors ${
                        activeStyles.strike
                          ? "text-[#dd7230] font-bold"
                          : "text-[#374151] hover:text-[#dd7230]"
                      }`}
                      title="Strikethrough"
                    >
                      <Strikethrough className={`h-4 w-4 ${activeStyles.strike ? "stroke-[3.4]" : "stroke-[2]"}`} />
                    </button>
                  </div>
                </div>

                <div className="h-8 w-px bg-[#E5E7EB] hidden sm:block" />

                {/* Alignment */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Alignment</span>
                  <div className="flex items-center rounded-lg border border-[#E5E7EB] overflow-hidden bg-[#F9FAFB] p-0.5 gap-0.5">
                    {(
                      [
                        { key: "left", Icon: AlignLeft, label: "Left", active: activeStyles.alignLeft },
                        { key: "center", Icon: AlignCenter, label: "Center", active: activeStyles.alignCenter },
                        { key: "right", Icon: AlignRight, label: "Right", active: activeStyles.alignRight },
                        { key: "justify", Icon: AlignJustify, label: "Justify", active: activeStyles.alignJustify },
                      ] as const
                    ).map(({ key, Icon, label, active }) => (
                      <button
                        key={key}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleAlignmentChange(key);
                        }}
                        title={`Align ${label}`}
                        className={`p-1.5 rounded transition-colors ${
                          active
                            ? "text-[#dd7230] font-bold"
                            : "text-[#374151] hover:text-[#dd7230]"
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${active ? "stroke-[3]" : "stroke-[2]"}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-8 w-px bg-[#E5E7EB] hidden sm:block" />

                {/* Lists */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Lists</span>
                  <div className="flex items-center rounded-lg border border-[#E5E7EB] overflow-hidden bg-[#F9FAFB]">
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applyFormattingCommand("insertUnorderedList");
                      }}
                      className={`p-2 transition-colors border-r border-[#E5E7EB] ${
                        activeStyles.ul ? "text-[#dd7230] font-bold" : "text-[#374151] hover:text-[#dd7230]"
                      }`}
                      title="Bulleted List"
                    >
                      <List className={`h-3.5 w-3.5 ${activeStyles.ul ? "stroke-[3]" : "stroke-[2]"}`} />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applyFormattingCommand("insertOrderedList");
                      }}
                      className={`p-2 transition-colors ${
                        activeStyles.ol ? "text-[#dd7230] font-bold" : "text-[#374151] hover:text-[#dd7230]"
                      }`}
                      title="Numbered List"
                    >
                      <ListOrdered className={`h-3.5 w-3.5 ${activeStyles.ol ? "stroke-[3]" : "stroke-[2]"}`} />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── TAB 2: PAGE LAYOUT & SIZE ── */}
            {activeRibbonTab === "layout" && (
              <>
                {/* Page Size Choices (Short, A4, Long) */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Page Size / Paper</span>
                  <div className="flex items-center gap-2">
                    {(["short", "a4", "long"] as PageSize[]).map((psKey) => {
                      const cfg = PAGE_SIZES[psKey];
                      const isSelected = pageSize === psKey;
                      return (
                        <button
                          key={psKey}
                          type="button"
                          onClick={() => setPageSize(psKey)}
                          className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2.5 ${
                            isSelected
                              ? "bg-[#FFF4E5] border-[#dd7230] text-[#dd7230] shadow-sm ring-1 ring-[#dd7230]"
                              : "bg-[#F9FAFB] border-[#E5E7EB] text-[#374151] hover:bg-[#F3F4F6]"
                          }`}
                        >
                          <FileSpreadsheet className={`h-4 w-4 ${isSelected ? "text-[#dd7230]" : "text-[#6B7280]"}`} />
                          <div>
                            <span className="block leading-none">{cfg.label}</span>
                            <span className="text-[10px] font-normal text-[#6B7280] block mt-0.5">{cfg.subLabel}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="h-8 w-px bg-[#E5E7EB] hidden sm:block" />

                {/* Line Spacing */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Line Spacing</span>
                  <div className="flex items-center gap-1.5">
                    {(["1.15", "1.5", "2.0"] as const).map((ls) => (
                      <button
                        key={ls}
                        type="button"
                        onClick={() => setLineSpacing(ls)}
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
                </div>
              </>
            )}

            {/* ── TAB 3: LETTERHEAD & INSERTS ── */}
            {activeRibbonTab === "insert" && (
              <>
                {/* Header Letterhead Controls */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Header Letterhead</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => headerInputRef.current?.click()}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
                        !noHeader && headerImage
                          ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-bold"
                          : "bg-[#F9FAFB] border-[#E5E7EB] text-[#374151] hover:bg-[#F3F4F6]"
                      }`}
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      <span>{!noHeader && headerImage ? "Header Attached" : "Upload Header"}</span>
                    </button>

                    {!noHeader && headerImage && (
                      <button
                        type="button"
                        onClick={removeHeaderLetterhead}
                        className="px-2.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                        title="Remove/Disable Header Letterhead"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </button>
                    )}

                    <input
                      ref={headerInputRef}
                      type="file"
                      accept={ACCEPTED_IMAGE_TYPES.join(",")}
                      className="hidden"
                      onChange={(e) => handleHeaderUpload(e.target.files?.[0])}
                    />
                  </div>
                </div>

                <div className="h-8 w-px bg-[#E5E7EB] hidden sm:block" />

                {/* Footer Letterhead Controls */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Footer Letterhead</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => footerInputRef.current?.click()}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
                        !noFooter && footerImage
                          ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-bold"
                          : "bg-[#F9FAFB] border-[#E5E7EB] text-[#374151] hover:bg-[#F3F4F6]"
                      }`}
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      <span>{!noFooter && footerImage ? "Footer Attached" : "Upload Footer"}</span>
                    </button>

                    {!noFooter && footerImage && (
                      <button
                        type="button"
                        onClick={removeFooterLetterhead}
                        className="px-2.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                        title="Remove/Disable Footer Letterhead"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </button>
                    )}

                    <input
                      ref={footerInputRef}
                      type="file"
                      accept={ACCEPTED_IMAGE_TYPES.join(",")}
                      className="hidden"
                      onChange={(e) => handleFooterUpload(e.target.files?.[0])}
                    />
                  </div>
                </div>

                <div className="h-8 w-px bg-[#E5E7EB] hidden sm:block" />

                {/* Quick Insert Elements */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Signatories &amp; Stamps</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        insertSignatureBlank();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#374151] font-semibold transition-all"
                    >
                      <PenTool className="h-3.5 w-3.5" />
                      <span>+ Signature Line</span>
                    </button>

                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        insertDateStamp();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#374151] font-semibold transition-all"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>+ Date Stamp</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        </div>{/* end sticky wrapper */}

        {/* ── LIVE TRUE PAGINATED MULTI-PAGE CANVAS ────────────────────────── */}
        <div
          className="p-6 md:p-12 rounded-2xl flex flex-col items-center justify-start overflow-x-auto shadow-inner min-h-[920px] space-y-8"
          style={{ backgroundColor: "#D4D9E2" }}
        >
          {Array.from({ length: pageCount }).map((_, pageIdx) => {
            const pageNum = pageIdx + 1;
            const headerH = pageNum === 1 && !noHeader && headerImage ? 85 : 0;
            const footerH = !noFooter && footerImage ? 65 : 30;
            const pageUsableHeight = currentSizeConfig.cssHeight - 68 - headerH - footerH - 12;

            return (
              <div
                key={pageNum}
                className="bg-white w-full transition-all relative border border-[#C5CBD5] rounded-sm shadow-2xl flex flex-col justify-between"
                style={{
                  maxWidth: currentSizeConfig.cssWidth,
                  height: `${currentSizeConfig.cssHeight}px`,
                  padding: "34px 48px",
                  fontFamily: FONT_CONFIG[docFont].css,
                  color: "#111827",
                  lineHeight: lineSpacing,
                  overflow: "hidden",
                }}
              >
                {/* Header Letterhead Image (Page 1) */}
                {pageNum === 1 && !noHeader && headerImage && (
                  <div className="text-center mb-6 select-none relative group flex-shrink-0" contentEditable={false}>
                    <img
                      src={headerImage.dataUrl}
                      alt="Header Letterhead"
                      style={{ maxHeight: "80px", maxWidth: "100%", display: "inline-block" }}
                    />
                    <button
                      type="button"
                      onClick={removeHeaderLetterhead}
                      className="absolute top-0 right-0 p-1.5 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md text-xs font-bold"
                      title="Remove Header"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <hr className="mt-3 border-t border-[#E5E7EB]" />
                  </div>
                )}

                {/* Content Viewport for Slice — Fully Editable on Every Page! */}
                <div
                  className="content-viewport flex-1 overflow-hidden relative"
                  style={{ height: `${pageUsableHeight}px` }}
                >
                  <div
                    ref={(el) => {
                      // Idempotent: bail out if the DOM node hasn't changed
                      if (pageEditorRefs.current[pageIdx] === el) return;
                      pageEditorRefs.current[pageIdx] = el;
                      if (pageIdx === 0 && el) {
                        (editorRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
                      }
                      if (el) {
                        const frag = pageHtmlFragments[pageIdx] || (pageIdx === 0 ? masterHtml || initialHtmlRef.current : "");
                        if (frag && (!el.innerHTML || el.innerHTML === "<br>")) {
                          el.innerHTML = frag;
                        }
                      }
                    }}
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                    onInput={(e) => handlePageInput(pageIdx, e.currentTarget)}
                    onKeyUp={() => {
                      // Selection tracking only — content changes are handled by onInput
                      lastActivePageIdxRef.current = pageIdx;
                      saveCurrentSelection();
                      updateActiveSelectionStyles();
                    }}
                    onMouseUp={() => {
                      lastActivePageIdxRef.current = pageIdx;
                      saveCurrentSelection();
                      updateActiveSelectionStyles();
                    }}
                    onKeyDown={handleKeyDown}
                    className="outline-none focus:ring-1 focus:ring-[#dd7230]/40 rounded p-1 transition-all cursor-text text-left absolute top-0 left-0 w-full"
                    style={{
                      minHeight: `${pageUsableHeight}px`,
                    }}
                  />
                </div>

                {/* Footer Letterhead Image & Page Numbering */}
                <div className="mt-6 pt-4 border-t border-[#E5E7EB] select-none flex items-center justify-between text-[11px] text-gray-400 flex-shrink-0" contentEditable={false}>
                  <div className="flex-1 text-center">
                    {!noFooter && footerImage && (
                      <div className="mb-2 relative group inline-block">
                        <img
                          src={footerImage.dataUrl}
                          alt="Footer Letterhead"
                          style={{ maxHeight: "60px", maxWidth: "100%", display: "inline-block" }}
                        />
                        <button
                          type="button"
                          onClick={removeFooterLetterhead}
                          className="absolute -top-1 -right-1 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md text-xs font-bold"
                          title="Remove Footer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="font-semibold text-gray-500">Page {pageNum} of {pageCount}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── BOTTOM STATUS BAR: EXACT PAGE COUNT & STATS ──────────────────── */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-4 flex flex-wrap items-center justify-between text-xs text-[#6B7280]">
          <div className="flex items-center gap-4">
            <span className="font-extrabold text-[#1F2937] flex items-center gap-1.5 bg-[#FFF4E5] text-[#dd7230] px-3 py-1 rounded-lg border border-[#dd7230]/30">
              <Layers className="h-4 w-4 text-[#dd7230]" />
              Page 1 of {pageCount} · Total: {pageCount} {pageCount === 1 ? "Page" : "Pages"}
            </span>
            <span>·</span>
            <span className="font-semibold text-[#374151]">Paper: {currentSizeConfig.label} ({currentSizeConfig.subLabel})</span>
            <span>·</span>
            <span>{wordCount} Words</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#9CA3AF]">
            <span>Cebu Technological University · CTU DOCUMENT</span>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================================
   * RENDER: PHASE 1 (COMPOSE & PROMPT)
   * ====================================================================== */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#dd7230] rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#1F2937]">CTU DOCUMENT Studio</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">
              Draft official memoranda, course syllabi, proposals, resolutions, and academic letters.
            </p>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
          <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-rose-700">{errorMessage}</p>
        </div>
      )}

      {/* Prompt Card */}
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
              placeholder="Example: Draft an Official Campus Memorandum announcing the schedule for Midterm Examinations, instructional material validation, and grading guidelines for the 2nd Semester..."
              disabled={status === "generating"}
            />
            <div className="flex justify-between items-center mt-1.5 text-xs text-[#9CA3AF]">
              <span>Use standard academic terms or describe specific sections</span>
              <span>{prompt.length} characters</span>
            </div>
          </div>

          {/* Letterhead Upload Section */}
          <div className="border border-[#E5E7EB] rounded-xl p-4 bg-[#F9FAFB]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-[#dd7230]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#374151]">
                  Official Letterhead &amp; Seals (Optional)
                </span>
              </div>
              <span className="text-xs text-[#9CA3AF]">Attached directly to PDF &amp; DOCX</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ImageUploadField
                label="Header Image"
                helperText="Centered at the top of every page."
                noneLabel="No Header"
                noneChecked={noHeader}
                onNoneChange={(checked) => { setNoHeader(checked); if (checked) setHeaderImage(null); }}
                image={headerImage}
                error={headerError}
                inputRef={headerInputRef}
                onFileSelected={handleHeaderUpload}
                onRemove={removeHeaderLetterhead}
              />

              <ImageUploadField
                label="Footer Image"
                helperText="Centered at the bottom of every page."
                noneLabel="No Footer"
                noneChecked={noFooter}
                onNoneChange={(checked) => { setNoFooter(checked); if (checked) setFooterImage(null); }}
                image={footerImage}
                error={footerError}
                inputRef={footerInputRef}
                onFileSelected={handleFooterUpload}
                onRemove={removeFooterLetterhead}
              />
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={status === "generating" || !prompt.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#dd7230] text-white rounded-lg font-bold text-sm transition-all hover:bg-[#c4612a] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-[0.99]"
          >
            {status === "generating" ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                Drafting Institutional Document…
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate Document with AI
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Start Templates */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-[#E5E7EB] flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#1F2937]">Institutional &amp; Academic Templates</h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Click any template to populate the drafting prompt
            </p>
          </div>
          <button
            onClick={() => setShowAllPrompts((v) => !v)}
            className="flex items-center gap-1 text-xs font-semibold text-[#dd7230] hover:text-[#c4612a] transition-colors"
          >
            {showAllPrompts ? (
              <>Show Less <ChevronUp className="h-3.5 w-3.5" /></>
            ) : (
              <>Show All ({QUICK_PROMPTS.length}) <ChevronDown className="h-3.5 w-3.5" /></>
            )}
          </button>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(showAllPrompts ? QUICK_PROMPTS : QUICK_PROMPTS.slice(0, 4)).map((t, idx) => (
            <button
              key={idx}
              onClick={() => setPrompt(t.prompt)}
              className="p-3.5 text-left rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] hover:bg-[#FFF4E5] hover:border-[#dd7230] transition-all group"
            >
              <span className="text-xs font-bold text-[#1F2937] group-hover:text-[#dd7230] block">
                {t.title}
              </span>
              <p className="text-[11px] text-[#6B7280] mt-1 line-clamp-2 leading-relaxed">
                {t.prompt}
              </p>
            </button>
          ))}
        </div>
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
  noneLabel: string;
  noneChecked: boolean;
  onNoneChange: (checked: boolean) => void;
  image: ImageAsset | null;
  error: string | null;
  inputRef: RefObject<HTMLInputElement | null>;
  onFileSelected: (file: File | undefined) => void;
  onRemove: () => void;
}) {
  const {
    label, helperText, noneLabel, noneChecked, onNoneChange,
    image, error, inputRef, onFileSelected, onRemove,
  } = props;

  return (
    <div className="border border-[#E5E7EB] rounded-xl overflow-hidden bg-white">
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#F9FAFB] border-b border-[#E5E7EB]">
        <span className="text-xs font-bold text-[#374151]">{label}</span>
        <label className="flex items-center gap-1.5 text-[11px] text-[#6B7280] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={noneChecked}
            onChange={(e) => onNoneChange(e.target.checked)}
            className="h-3 w-3 rounded"
            style={{ accentColor: "#dd7230" }}
          />
          {noneLabel}
        </label>
      </div>

      <div className="p-3">
        <p className="text-[11px] text-[#9CA3AF] mb-2">{helperText}</p>
        {error && <p className="text-xs text-rose-500 mb-2">{error}</p>}

        {!noneChecked && (
          <>
            {!image ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-1.5 py-4 border-2 border-dashed border-[#E5E7EB] rounded-lg text-[#9CA3AF] hover:text-[#6B7280] hover:border-[#dd7230] transition-colors"
              >
                <ImageIcon className="h-4 w-4" />
                <span className="text-xs font-medium">Click to upload PNG/JPG</span>
              </button>
            ) : (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.dataUrl}
                  alt={`${label} preview`}
                  className="max-h-16 rounded border border-[#E5E7EB] p-1 bg-white"
                />
                <button
                  type="button"
                  onClick={onRemove}
                  aria-label="Remove image"
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center rounded-full bg-rose-500 text-white shadow"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              className="hidden"
              onChange={(e) => onFileSelected(e.target.files?.[0])}
            />
          </>
        )}
      </div>
    </div>
  );
}