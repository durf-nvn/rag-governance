import type { DocumentTemplate } from "./types";
import { memorandum0225 } from "./memorandum0225";
import { memorandumPG21 } from "./memorandumPG21";

export type { DocumentTemplate, PageSize, DocFont } from "./types";

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  memorandum0225,
  memorandumPG21,
];

export function getTemplateById(id: string): DocumentTemplate | undefined {
  return DOCUMENT_TEMPLATES.find((t) => t.id === id);
}