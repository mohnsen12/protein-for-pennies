// Minimal Gemini API helper for the content pipeline (Node 18+ / Node 24).
import fs from "fs";
import path from "path";

const ENV_PATHS = [
  path.join(process.cwd(), ".env.local"),
  path.join(process.cwd(), ".env"),
];

export function loadEnv() {
  for (const p of ENV_PATHS) {
    if (fs.existsSync(p)) {
      for (const line of fs.readFileSync(p, "utf-8").split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function generateText({ prompt, schema, maxRetries = 4 }) {
  loadEnv();
  const key = process.env.GEMINI_API_KEY;
  // Free tier quota is per-model — a fallback chain multiplies daily capacity.
  const models = (process.env.GEMINI_TEXT_MODELS || "gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!key) throw new Error("GEMINI_API_KEY missing (check .env.local)");

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.85,
      ...(schema
        ? { responseMimeType: "application/json", responseSchema: schema }
        : {}),
    },
  };

  let lastErr = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    for (const model of models) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      );
      if (res.ok) {
        const data = await res.json();
        const parts = data?.candidates?.[0]?.content?.parts || [];
        const text = parts.map((p) => p.text || "").join("").trim();
        if (!text) throw new Error("Empty Gemini response: " + JSON.stringify(data).slice(0, 300));
        return text;
      }
      const errText = await res.text();
      lastErr = new Error(`${model} ${res.status}: ${errText.slice(0, 140)}`);
      console.error(`  ${lastErr.message}`);
      // 429 = quota exhausted for this model → try next model in chain.
      // 503/5xx = temporary high demand → short wait, then continue chain.
      if (res.status === 503 || res.status >= 500) await sleep(10000);
      if (res.status !== 429 && res.status < 500 && res.status !== 503) throw lastErr;
    }
    if (attempt < maxRetries) await sleep(20000 * attempt);
  }
  throw lastErr || new Error("Gemini failed: all models exhausted");
}

export async function generateImage({ prompt, outFile }) {
  loadEnv();
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";
  if (!key) throw new Error("GEMINI_API_KEY missing");

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
  };
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
  );
  if (!res.ok) throw new Error(`Gemini image ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imgPart = parts.find((p) => p.inlineData);
  if (!imgPart) throw new Error("No inline image in response");
  const buf = Buffer.from(imgPart.inlineData.data, "base64");
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, buf);
  return outFile;
}
