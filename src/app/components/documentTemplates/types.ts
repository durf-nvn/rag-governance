// Shared types — defined HERE (not in DocumentGenerator) to avoid a
// circular import: DocumentGenerator imports documentTemplates,
// so documentTemplates must not import DocumentGenerator.

export type PageSize = "short" | "a4" | "long";
export type DocFont = "serif" | "sans" | "mono" | "georgia";

export interface DocumentTemplate {
  id: string;
  title: string;
  description: string;
  category: "Memorandum" | "Letter" | "MOA" | "Resolution" | "Certificate";
  fileName: string;
  pageSize: PageSize;
  font: DocFont;
  lineSpacing: "1.15" | "1.5" | "2.0";
  html: string;

  /** Optional public/ path to the letterhead image to auto-attach on load. */
  defaultHeaderUrl?: string;
  /** Optional public/ path to the footer / accreditation strip to auto-attach on load. */
  defaultFooterUrl?: string;
}