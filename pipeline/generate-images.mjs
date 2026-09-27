// Optional: generate recipe images via Gemini image models.
// The shared free-tier API key currently has 0 image quota — the primary workflow
// is Google Antigravity (see pipeline/IMAGE_TASKS.md). This script exists so the
// pipeline can also run fully automated once a quota-enabled key is set in .env.local.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { generateImage } from "./lib/gemini.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "images", "recipes");

async function main() {
  const dir = path.join(ROOT, "content", "recipes");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let made = 0;
  for (const f of files) {
    const { data } = matter(fs.readFileSync(path.join(dir, f), "utf-8"));
    const prompts = data.imagePrompts || {};
    for (const kind of ["hero", "detail"]) {
      const outFile = path.join(OUT_DIR, `${data.slug}-${kind}.jpg`);
      if (fs.existsSync(outFile)) continue;
      if (!prompts[kind]) continue;
      const full = `${prompts[kind]}, photorealistic professional food photography, warm natural window light, no text, no logos, no people, no hands`;
      try {
        await generateImage({ prompt: full, outFile });
        made++;
        console.log(`✓ ${data.slug}-${kind}.jpg`);
      } catch (e) {
        console.error(`✗ ${data.slug}-${kind}: ${e.message.slice(0, 140)}`);
      }
    }
  }
  console.log(`Done: ${made} images generated.`);
}

main();
