// server.js
// ---------------------------------------------------------------------------
// A tiny local backend for testing the AI Document Generator with Vite/CRA,
// which has no server of its own. This keeps your GROQ_API_KEY out of the
// browser — the React app calls this server, and this server calls Groq
// (a free, OpenAI-compatible API — no credit card required).
//
// SETUP
//   npm install express cors dotenv
//   Get a free key at https://console.groq.com/keys
//   Add GROQ_API_KEY=gsk_... to your .env file
//
// RUN
//   node server.js
//   (keep this running in its own terminal, alongside `npm run dev`)
// ---------------------------------------------------------------------------

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config(); // loads .env in project root

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const SYSTEM_PROMPT = `You are a professional document-drafting assistant embedded in an
institutional document generator.

RULES:
1. Generate ONLY the body content of the requested document (academic,
   business, legal, invoice, contract, report, proposal, letter, NDA,
   certificate, or any other document type the user describes).
2. NEVER generate, describe, or reference a header, footer, letterhead,
   logo, page-number block, or company seal. Those are controlled
   exclusively by the user's own image uploads outside of your output.
3. Do not wrap the response in markdown code fences.
4. Use clear structure, formatted like a formal printed document:
   - A single top-level title as the very first line, prefixed with "# ".
     Write it in Title Case (it will be centered and capitalized
     automatically) - keep it short, e.g. "# Property Management Agreement".
   - Section headings prefixed with "## ", short and in Title Case
     (e.g. "## Parties", "## Term", "## Responsibilities of the Agent").
     These render bold and underlined, matching standard legal/contract
     section headers - do not add numbering to them yourself.
   - For any information that must be filled in later by the user (names,
     dates, addresses, amounts, signatures), write a blank line using a
     run of underscores at least 15 characters long, e.g. "between
     ______________________ (the \"Owner\") and ______________________
     (the \"Agent\")". Do NOT use bracket placeholders like [Owner Name].
   - Use "- " for bulleted lists (e.g. responsibilities, clauses, line
     items). Use plain paragraphs for everything else. No HTML.
5. Match tone and formality to the document type requested (e.g. legal
   documents should read as formal legal prose with the blank-line
   convention above; invoices should use clean line-item structure;
   lesson plans should be structured and practical for an instructor).
6. Be complete and usable as a first draft - the user will review and
   edit before finalizing, but it should require minimal rewriting.`;

app.post("/api/generate-document", async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not set. Check your .env file.");
      return res
        .status(500)
        .json({ error: "The AI service is not configured. Please contact the site administrator." });
    }

    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "A prompt is required." });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI API error:", response.status, errText);
      return res
        .status(502)
        .json({ error: "The AI service could not generate this document. Please try again." });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    if (!content.trim()) {
      return res.status(502).json({ error: "The AI service returned an empty response." });
    }

    res.json({ content });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Unexpected server error." });
  }
});

app.listen(PORT, () => {
  console.log(`AI document server running at http://localhost:${PORT}`);
});