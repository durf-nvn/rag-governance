// server.js
// ---------------------------------------------------------------------------
// A tiny local backend for testing the AI Document Generator with Vite/CRA.
// Keeps your GROQ_API_KEY secure on the server side.
//
// SETUP
//   Add GROQ_API_KEY=gsk_... to your .env file
//
// RUN
//   node server.js
// ---------------------------------------------------------------------------

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config(); // loads .env in project root

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const SYSTEM_PROMPT = `You are a senior institutional and academic document drafting assistant for higher education institutions (such as Cebu Technological University - CTU Argao Campus and partner organizations).

You generate professional, legally sound, and academic-grade documents (e.g., Memoranda, Office Orders, Activity Proposals, Course Syllabi, Endorsement Letters, Resolutions, Certificates, Policy Guidelines, Contracts, Terms of Reference, Minutes of Meeting).

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

// Candidate models in order of priority
const MODELS_TO_TRY = [
  process.env.GROQ_MODEL,
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.6-27b",
  "groq/compound",
].filter(Boolean);

app.post("/api/generate-document", async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not set. Check your .env file.");
      return res
        .status(500)
        .json({ error: "The AI service is not configured. Please add GROQ_API_KEY in .env." });
    }

    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "A prompt is required." });
    }

    let lastError = null;
    let content = "";

    // Try candidate models
    for (const model of MODELS_TO_TRY) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: prompt },
            ],
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`Groq model ${model} failed (${response.status}):`, errText);
          lastError = errText;
          continue; // try next model
        }

        const data = await response.json();
        let rawContent = data.choices?.[0]?.message?.content ?? "";

        // Strip any thinking tags if present in model output
        rawContent = rawContent.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

        if (rawContent) {
          content = rawContent;
          break; // Success!
        }
      } catch (modelErr) {
        console.warn(`Error connecting with model ${model}:`, modelErr.message);
        lastError = modelErr.message;
      }
    }

    if (!content.trim()) {
      console.error("All models failed. Last error:", lastError);
      return res
        .status(502)
        .json({ error: "The AI service could not generate this document. Please try again." });
    }

    res.json({ content });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Unexpected server error." });
  }
});

// Drive Upload & Native Document Conversion endpoint for AI Document Generator
app.post("/api/drive/upload-doc", async (req, res) => {
  try {
    const { docxBase64, fileName = "Generated_Document" } = req.body;

    if (!docxBase64) {
      return res.status(400).json({ error: "Missing docxBase64 data." });
    }

    const driveToken = process.env.GOOGLE_DRIVE_ACCESS_TOKEN || process.env.GOOGLE_ACCESS_TOKEN;

    // Graceful fallback if Drive access token/credentials are not configured
    if (!driveToken) {
      console.warn("Drive access token is not configured in .env. Falling back to local download.");
      return res.json({
        success: false,
        fallback: true,
        message: "Drive is not configured. Falling back to local file download.",
      });
    }

    const docxBuffer = Buffer.from(docxBase64, "base64");
    const boundary = "-------314159265358979323846";
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: fileName,
      mimeType: "application/vnd.google-apps.document", // Convert .docx to native document on import
    };

    let multipartBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document\r\n' +
      'Content-Transfer-Encoding: base64\r\n\r\n' +
      docxBuffer.toString("base64") +
      closeDelimiter;

    const driveResponse = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${driveToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      }
    );

    if (!driveResponse.ok) {
      const errText = await driveResponse.text();
      console.warn("Drive API upload failed:", errText);
      return res.json({
        success: false,
        fallback: true,
        message: `Drive API upload error: ${driveResponse.statusText}`,
      });
    }

    const driveFile = await driveResponse.json();
    const fileId = driveFile.id;
    const webViewLink = driveFile.webViewLink || `https://docs.google.com/document/d/${fileId}/edit`;

    // Make file accessible (writer role for anyone with link)
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${driveToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "writer",
          type: "anyone",
        }),
      });
    } catch (permErr) {
      console.warn("Warning: Could not set public permission on Drive file:", permErr);
    }

    return res.json({
      success: true,
      fallback: false,
      fileId,
      webViewLink,
      exportLinks: {
        docx: `https://docs.google.com/document/d/${fileId}/export?format=docx`,
        pdf: `https://docs.google.com/document/d/${fileId}/export?format=pdf`,
        print: `https://docs.google.com/document/d/${fileId}/print`,
      },
    });
  } catch (err) {
    console.error("Drive upload handler error:", err);
    return res.json({
      success: false,
      fallback: true,
      message: err instanceof Error ? err.message : "Unexpected Drive error",
    });
  }
});

// Drive Export Proxy endpoint
app.get("/api/drive/export/:fileId", async (req, res) => {
  const { fileId } = req.params;
  const format = req.query.format === "pdf" ? "pdf" : "docx";
  const driveToken = process.env.GOOGLE_DRIVE_ACCESS_TOKEN || process.env.GOOGLE_ACCESS_TOKEN;

  if (driveToken) {
    try {
      const mimeType = format === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      
      const exportResp = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(mimeType)}`,
        {
          headers: { Authorization: `Bearer ${driveToken}` },
        }
      );

      if (exportResp.ok) {
        const arrayBuf = await exportResp.arrayBuffer();
        res.setHeader("Content-Type", mimeType);
        res.setHeader("Content-Disposition", `attachment; filename="document.${format}"`);
        return res.send(Buffer.from(arrayBuf));
      }
    } catch (e) {
      console.warn("Export proxy fetch failed:", e);
    }
  }

  // Direct redirect fallback
  const redirectUrl = `https://docs.google.com/document/d/${fileId}/export?format=${format}`;
  return res.redirect(redirectUrl);
});

app.listen(PORT, () => {
  console.log(`AI document server running at http://localhost:${PORT}`);
});