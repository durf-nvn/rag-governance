// server.js
// ---------------------------------------------------------------------------
// Local backend for the AI Document Generator with Vite/CRA.
//
// Responsibilities
//   1. /api/generate-document            — Groq AI drafting proxy
//   2. /api/repository-documents         — proxy → main.py /documents
//   3. /api/repository-documents/:n/content
//                                        — proxy → main.py /documents/:n/content
//   4. /api/models                       — diagnostic: list Groq models your key can use
//
// SETUP
//   Add GROQ_API_KEY=gsk_... to your .env file
//   Optionally add GROQ_MODEL=<id>            (override the first model tried)
//   Optionally add REPOSITORY_BACKEND_URL=http://localhost:8000  (default)
//
// RUN
//   node server.js
// ---------------------------------------------------------------------------

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const REPOSITORY_BACKEND_URL =
  process.env.REPOSITORY_BACKEND_URL || "http://localhost:8000";

app.use(cors());
app.use(express.json());

/* ============================================================================
 * SYSTEM PROMPT
 * ==========================================================================*/
const SYSTEM_PROMPT = `You are a senior institutional and academic document drafting assistant for higher education institutions (such as Cebu Technological University - CTU Argao Campus and partner organizations).

You generate professional, legally sound, and academic-grade documents (e.g., Memoranda, Office Orders, Activity Proposals, Course Syllabi, Endorsement Letters, Resolutions, Certificates, Policy Guidelines, Contracts, Terms of Reference, Minutes of Meeting).

STRICT WORD-COUNT RULE (MANDATORY, NON-NEGOTIABLE):
- Every page of the printed output holds roughly 250-300 words of BODY TEXT once the institutional header/footer letterheads, metadata block, section headings, and signature blocks are accounted for. These structural elements (labels, blanks, headings) take up full lines but contain few words, so they eat into the budget disproportionately.
- You will be told the exact maximum word count to target for this request in the user message (e.g. "MAXIMUM WORD COUNT: 280 words"). Treat that number as a hard ceiling, not a suggestion. Undershooting slightly is fine; overshooting is not.
- Count every word you write, including headings, labels, and signature-block text, toward that ceiling.
- Never pad content to "fill space." A shorter, well-structured document that fits cleanly is always preferred over a longer one that spills a few lines onto an otherwise-empty extra page.

STRICT PAGE LIMIT RULE:
- By default, or unless the user explicitly requests a multi-page document (e.g. "3 pages", "detailed 5-page proposal"), the document MUST BE CONCISE AND FIT ON EXACTLY 1 PAGE.
- Account for space taken by institutional header and footer letterheads. Keep all body sections (Rationale, Directives, Signatures) crisp, well-structured, and executive so that the entire text fits onto a single page without spilling over.

RULES:
1. Generate ONLY the body content of the document. Do not generate or simulate graphic letterheads or institutional logos (those are attached via letterhead images).
2. Do not wrap the response in markdown code fences (\`\`\`markdown or \`\`\`).
3. Maintain an executive, professional academic tone with pristine formatting:
   - A top-level Title (# DOCUMENT TITLE) in UPPERCASE.
   - For Memoranda/Letters/Proposals, include institutional metadata block:
     **MEMORANDUM NO. / REF NO.:** __________, s. 2026
     **FOR / TO:** ___________________________________
     **THROUGH:** ___________________________________ (if applicable)
     **FROM:** _____________________________________
     **DATE:** _____________________________________
     **SUBJECT:** __________________________________
   - Use structured section headings (## 1.0 RATIONALE, ## 2.0 OBJECTIVES, ## 3.0 GUIDELINES / PROVISIONS, ## 4.0 SIGNATORIES) appropriate for the document type.
   - For lists, use standard bulleted points ("- ") or numbered points ("1. ").
   - For blanks to be filled in later (names, amounts, dates, titles), use solid underline blanks: "________________________". Do NOT use bracket placeholders like [Name].
   - Always include formal university signature/concurrence blocks at the end:
     **Prepared by:**
     ____________________________________
     Faculty Member / Proponent

     **Approved by:**
     ____________________________________
     Campus Director / University President
4. Ensure the draft is complete, rich in institutional context, coherent, and ready for immediate review and printing without missing standard sections.`;

/* ============================================================================
 * MODEL FALLBACK CHAIN
 * ==========================================================================*/
const REASONING_MODEL_IDS = new Set([
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.6-27b",
  "qwen/qwen3.8-27b",
]);

const MODELS_TO_TRY = [
  process.env.GROQ_MODEL,
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.6-27b",
  "groq/compound",
  "groq/compound-mini",
].filter(Boolean);

const WORDS_PER_PAGE_MIN = 250;
const WORDS_PER_PAGE_MAX = 300;
const WORDS_PER_PAGE_TARGET = 275;
const OVERSHOOT_TOLERANCE = 1.1;
const MAX_TARGET_PAGES = 5;

function computeWordBudget(targetPages) {
  const pages = Number.isFinite(targetPages) && targetPages >= 1
    ? Math.min(Math.round(targetPages), MAX_TARGET_PAGES)
    : 1;
  return {
    pages,
    minWords: pages * WORDS_PER_PAGE_MIN,
    maxWords: pages * WORDS_PER_PAGE_MAX,
    targetWords: pages * WORDS_PER_PAGE_TARGET,
  };
}

function countWords(text) {
  const stripped = (text || "")
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .replace(/[_#*|`]/g, " ")
    .replace(/-{3,}/g, " ");
  const matches = stripped.match(/[A-Za-z0-9][A-Za-z0-9'-]*/g);
  return matches ? matches.length : 0;
}

const SIG_BLOCK_REGEX =
  /\b(prepared\s+by|reviewed\s+by|approved\s+by|recommending\s+approval|recommended\s+by|noted\s+by|attested\s+by|conforme|submitted\s+by|respectfully\s+submitted)\b/i;

const METADATA_LINE_REGEX = /^\*\*[A-Z0-9 /.]+:\*\*/;

function hardTrimToWordBudget(content, maxWords) {
  const blocks = content.replace(/\r\n/g, "\n").split(/\n\s*\n/).filter((b) => b.trim());
  if (blocks.length === 0) return content;

  let headEnd = 0;
  while (
    headEnd < blocks.length &&
    (/^#(?!#)/.test(blocks[headEnd].trim()) || METADATA_LINE_REGEX.test(blocks[headEnd].trim()))
  ) {
    headEnd++;
  }
  headEnd = Math.max(headEnd, blocks.length > 0 ? 1 : 0);

  let tailStart = blocks.length;
  for (let i = blocks.length - 1; i >= headEnd; i--) {
    if (SIG_BLOCK_REGEX.test(blocks[i])) tailStart = Math.max(headEnd, i - 1);
  }

  const head = blocks.slice(0, headEnd);
  const tail = blocks.slice(tailStart);
  const body = blocks.slice(headEnd, tailStart);

  const headWords = head.reduce((sum, b) => sum + countWords(b), 0);
  const tailWords = tail.reduce((sum, b) => sum + countWords(b), 0);
  let remaining = Math.max(0, maxWords - headWords - tailWords);

  const keptBody = [];
  for (const block of body) {
    const w = countWords(block);
    if (w <= remaining) {
      keptBody.push(block);
      remaining -= w;
    } else if (remaining > 15) {
      const sentences = block.match(/[^.!?]+[.!?]+|\S+$/g) || [block];
      let partial = "";
      let used = 0;
      for (const s of sentences) {
        const sw = countWords(s);
        if (used + sw > remaining) break;
        partial += s;
        used += sw;
      }
      if (partial.trim()) {
        keptBody.push(partial.trim());
        remaining -= used;
      }
      break;
    } else {
      break;
    }
  }

  return [...head, ...keptBody, ...tail].join("\n\n");
}

/* ============================================================================
 * GROQ CALL  (reasoning-aware)
 * ==========================================================================*/
async function callGroq(model, systemPrompt, userPrompt) {
  const isReasoning = REASONING_MODEL_IDS.has(model);

  const body = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt },
    ],
    temperature: 0.7,
    max_completion_tokens: 4096,
  };

  if (isReasoning) {
    body.reasoning_effort = "low";
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq model ${model} failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  let rawContent = choice?.message?.content ?? "";

  if (!rawContent && choice?.message?.reasoning) {
    rawContent = choice.message.reasoning;
  }

  rawContent = rawContent.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  return rawContent;
}

async function generateWithFallback(systemPrompt, userPrompt) {
  const failures = [];
  for (const model of MODELS_TO_TRY) {
    try {
      const content = await callGroq(model, systemPrompt, userPrompt);
      if (content && content.trim().length > 0) {
        return { content, model };
      }
      const msg = `${model}: returned empty content`;
      console.warn(msg);
      failures.push(msg);
    } catch (err) {
      console.warn(err.message);
      failures.push(err.message);
    }
  }
  throw new Error(
    `All ${MODELS_TO_TRY.length} model(s) failed:\n  - ${failures.join("\n  - ")}`
  );
}

/* ============================================================================
 * DIAGNOSTIC: list Groq models your key can call
 * ==========================================================================*/
app.get("/api/models", async (_req, res) => {
  if (!process.env.GROQ_API_KEY) {
    return res
      .status(500)
      .json({ error: "GROQ_API_KEY is not set. Check your .env file." });
  }
  try {
    const upstream = await fetch("https://api.groq.com/openai/v1/models", {
      method: "GET",
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    });
    const text = await upstream.text();
    res.status(upstream.status);
    res.set(
      "Content-Type",
      upstream.headers.get("content-type") || "application/json"
    );
    return res.send(text);
  } catch (err) {
    console.error("[/api/models] upstream failed:", err.message);
    return res.status(502).json({ error: err.message });
  }
});

/* ============================================================================
 * AI DOCUMENT GENERATION
 * ==========================================================================*/
app.post("/api/generate-document", async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not set. Check your .env file.");
      return res
        .status(500)
        .json({ error: "The AI service is not configured. Please add GROQ_API_KEY in .env." });
    }

    const { prompt, targetPages } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "A prompt is required." });
    }

    const budget = computeWordBudget(targetPages);
    const budgetInstruction =
      `\n\nMAXIMUM WORD COUNT: ${budget.maxWords} words total across the whole document ` +
      `(target ${budget.targetWords}, minimum ${budget.minWords}). This is a hard ceiling — ` +
      `do not exceed it, and do not pad content to reach it.`;
    const userPrompt = `${prompt}${budgetInstruction}`;

    let content;
    try {
      const result = await generateWithFallback(SYSTEM_PROMPT, userPrompt);
      content = result.content;
    } catch (err) {
      console.error("All models failed. Details:\n" + err.message);
      return res.status(502).json({
        error:
          "The AI service could not generate this document. " +
          "Check the server console for per-model failure details, " +
          "or open /api/models to see which Groq models your key can access.",
      });
    }

    let wordCount = countWords(content);
    const MAX_SHORTEN_ATTEMPTS = 2;
    for (
      let attempt = 1;
      attempt <= MAX_SHORTEN_ATTEMPTS &&
      wordCount > budget.maxWords * OVERSHOOT_TOLERANCE;
      attempt++
    ) {
      try {
        const shortenPrompt =
          `The document below is ${wordCount} words, which is over the ${budget.maxWords}-word limit. ` +
          `Rewrite it to fit within ${budget.maxWords} words (target ${budget.targetWords}) while keeping ` +
          `every required section, heading, metadata field, and the full signature block. Cut sentences and ` +
          `trim wording — do not just summarize the ending. Do not add commentary or explanation — output ` +
          `only the revised document in the same format.\n\n---\n${content}`;
        const shortened = await generateWithFallback(SYSTEM_PROMPT, shortenPrompt);
        const shortenedCount = countWords(shortened.content);
        if (shortened.content && shortenedCount < wordCount) {
          content = shortened.content;
          wordCount = shortenedCount;
        } else {
          break;
        }
      } catch (shortenErr) {
        console.warn(`Shorten attempt ${attempt} failed:`, shortenErr.message);
        break;
      }
    }

    if (wordCount > budget.maxWords) {
      content = hardTrimToWordBudget(content, budget.maxWords);
      wordCount = countWords(content);
    }

    res.json({ content, wordCount, wordBudget: budget });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Unexpected server error." });
  }
});

/* ============================================================================
 * KNOWLEDGE REPOSITORY PROXY
 * ==========================================================================*/
async function proxyJson(res, url) {
  try {
    const upstream = await fetch(url, { method: "GET" });
    const text = await upstream.text();
    res.status(upstream.status);
    const ct = upstream.headers.get("content-type") || "";
    res.set("Content-Type", ct.includes("application/json") ? ct : "application/json");
    return res.send(text);
  } catch (err) {
    console.error(`[proxy] upstream ${url} failed:`, err.message);
    return res.status(502).json({
      error: "Knowledge Repository backend is unreachable.",
      detail: err.message,
    });
  }
}

/**
 * GET /api/repository-documents?category=…&status=…
 *
 * Forwards both filters to main.py. Defaults:
 *   category = "Accreditation Evidence"
 *   status   = "Active"
 *
 * The picker's only consumer is the DocumentGenerator "Open Existing
 * Document" grid, which always wants Active accreditation evidence.
 */
app.get("/api/repository-documents", async (req, res) => {
  const category = req.query.category || "Accreditation Evidence";
  const status   = req.query.status   || "Active";
  const url =
    `${REPOSITORY_BACKEND_URL}/documents` +
    `?category=${encodeURIComponent(category)}` +
    `&status=${encodeURIComponent(status)}`;
  return proxyJson(res, url);
});

/**
 * GET /api/repository-documents/:name/content
 */
app.get("/api/repository-documents/:name/content", async (req, res) => {
  const url = `${REPOSITORY_BACKEND_URL}/documents/${encodeURIComponent(req.params.name)}/content`;
  return proxyJson(res, url);
});

app.listen(PORT, () => {
  console.log(`AI document server running at http://localhost:${PORT}`);
  console.log(`Repository backend proxied to ${REPOSITORY_BACKEND_URL}`);
  console.log(
    `Model fallback chain (${MODELS_TO_TRY.length} entries): ${MODELS_TO_TRY.join(" → ")}`
  );
  console.log(`Diagnostic endpoint: http://localhost:${PORT}/api/models`);
});