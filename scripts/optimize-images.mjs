/**
 * optimize-images.mjs — one-time batch fix for Lighthouse's "Improve image
 * delivery" flag (est. 3.6-3.75 MB savings on Home). Assets were shipped at
 * raw source resolution (e.g. OEM logos at 1448x1086 displayed at ~40px
 * tall; team/before-after photos at full camera resolution displayed at
 * ~500-900px). Resize to real display size (with 2x retina headroom) and
 * recompress. Re-run any time source assets change.
 *
 * PNG "after" photos (pure photographic content, no alpha) are converted to
 * JPEG for proper photographic compression. build-site.mjs has its own
 * matching PNG_TO_JPG_RENAME list to rewrite references in generated HTML —
 * keep the two in sync if this list changes.
 */
import sharp from "sharp";
import { readdirSync, statSync, unlinkSync, existsSync } from "node:fs";
import { join, extname, basename } from "node:path";

const ROOT = "/home/user/astra-start";
const ASSETS = join(ROOT, "assets");

// Before/after pairs get real responsive images: two WebP widths (640w for
// mobile, 1000w for desktop) via srcset. A single 1000w-sized file was still
// "larger than needed" on PageSpeed's mobile run, which renders these at
// ~623px CSS width, not the ~900px desktop container width.
// Exported so build-site.mjs knows which base names to rewrite to srcset.
export const RESPONSIVE_PHOTOS = [
  "photos/before-frontqtr",
  "photos/before-frontqtr2",
  "photos/before-side",
  "photos/after-frontqtr",
  "photos/after-frontqtr2",
  "photos/after-side",
];

async function resizeInPlace(rel, { width, height, quality = 80, format } = {}) {
  const file = join(ASSETS, rel);
  const before = statSync(file).size;
  const img = sharp(file);
  const meta = await img.metadata();
  const resized = img.resize({ width, height, withoutEnlargement: true, fit: "inside" });
  const ext = (format || meta.format);
  let out;
  if (ext === "jpeg" || ext === "jpg") out = resized.jpeg({ quality, mozjpeg: true });
  else out = resized.png({ quality, palette: true, compressionLevel: 9 });
  const buf = await out.toBuffer();
  const fs = await import("node:fs");
  fs.writeFileSync(file, buf);
  const after = buf.length;
  console.log(
    `${rel}: ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB (${meta.width}x${meta.height} -> target ${width || "auto"}x${height || "auto"})`,
  );
}

async function makeResponsiveWebp(baseRel) {
  const base = join(ASSETS, baseRel);
  const existing = ["jpg", "jpeg", "png"].map((e) => `${base}.${e}`).find((f) => existsSync(f));
  if (!existing) {
    console.log(`${baseRel}: no source found (already converted?), skipping`);
    return;
  }
  const before = statSync(existing).size;
  const src = sharp(existing);
  const sizes = [
    [640, `${base}-640w.webp`],
    [1000, `${base}-1000w.webp`],
  ];
  let totalAfter = 0;
  for (const [width, outPath] of sizes) {
    const buf = await src.clone().resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
    const fs = await import("node:fs");
    fs.writeFileSync(outPath, buf);
    totalAfter += buf.length;
  }
  unlinkSync(existing);
  console.log(
    `${baseRel}: ${(before / 1024).toFixed(0)}KB -> 640w+1000w WebP, ${(totalAfter / 1024).toFixed(0)}KB combined (${basename(existing)} -> WebP)`,
  );
}

// Convert a PNG/JPEG to WebP in place (same basename, new extension) —
// smaller than either at equivalent quality, and keeps alpha if present.
// Exported so build-site.mjs can rewrite references for the fixed set below.
export const WEBP_CONVERTED = ["buzznerd-logo-trim.png", "buzznerd-hero-character.png"];

async function convertToWebp(rel, { resize } = {}) {
  const file = join(ASSETS, rel);
  if (!existsSync(file)) {
    console.log(`${rel}: already converted, skipping`);
    return;
  }
  const before = statSync(file).size;
  let img = sharp(file);
  if (resize) img = img.resize({ ...resize, withoutEnlargement: true });
  const buf = await img.webp({ quality: 82 }).toBuffer();
  const outPath = file.replace(/\.(png|jpe?g)$/i, ".webp");
  const fs = await import("node:fs");
  fs.writeFileSync(outPath, buf);
  unlinkSync(file);
  console.log(`${rel} -> ${basename(outPath)}: ${(before / 1024).toFixed(0)}KB -> ${(buf.length / 1024).toFixed(0)}KB`);
}

async function main() {
  // OEM + integration logos: displayed at 34-48px tall, max-width 150-200px.
  // Tightened from an earlier 150px-height pass (still flagged as "larger
  // than needed" on mobile) to 100px (~2-2.5x max display height) + WebP.
  const logoFiles = readdirSync(ASSETS).filter((f) => /^logo-/.test(f) && /\.(png|jpg|jpeg)$/i.test(f));
  for (const f of logoFiles) {
    await convertToWebp(f, { resize: { height: 100 } });
  }
  // Header/footer brand logo: shown on every page at 36-40px tall.
  await convertToWebp("buzznerd-logo-trim.png", { resize: { height: 120 } });

  // Hero mascot (Home, the LCP element — fetchpriority=high): format-only
  // conversion, already close to its ~560px display size.
  await convertToWebp("buzznerd-hero-character.png");

  // Before/after photo-enhancement shots: two responsive WebP widths so
  // mobile (~623px rendered) doesn't download the desktop (~900px) size.
  for (const base of RESPONSIVE_PHOTOS) await makeResponsiveWebp(base);

  // Team photo (about-us): displayed in a 440px-tall card.
  await resizeInPlace("dave-fisher.jpeg", { width: 700, quality: 80 });

  // Character/mascot illustrations: already close to display size (~460-800px
  // known usage) — just recompress with palette quantization, no resize.
  const illustrations = [
    "buzznerd-mascot-charged.png",
    "buzznerd-team-heroes.png",
    "growth-hero.png",
    "workflows-character.png",
    "content-restructuring-character.png",
    "presence-score-character.png",
  ];
  for (const f of illustrations) {
    if (!existsSync(join(ASSETS, f))) continue; // already processed
    const meta = await sharp(join(ASSETS, f)).metadata();
    await resizeInPlace(f, { width: meta.width, quality: 82 }); // recompress only
  }

  console.log("\ndone");
}

main();
