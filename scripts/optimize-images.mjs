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

// Photographic PNGs with no alpha channel -> convert to JPEG (same basename).
// Exported so build-site.mjs can rewrite references in generated HTML.
export const PHOTO_PNG_TO_JPG = [
  "photos/after-frontqtr.png",
  "photos/after-frontqtr2.png",
  "photos/after-side.png",
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

async function convertPngPhotoToJpg(rel) {
  const file = join(ASSETS, rel);
  if (!existsSync(file)) {
    console.log(`${rel}: already converted, skipping`);
    return;
  }
  const before = statSync(file).size;
  const buf = await sharp(file)
    .resize({ width: 1000, withoutEnlargement: true, fit: "inside" })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
  const jpgPath = file.replace(/\.png$/i, ".jpg");
  const fs = await import("node:fs");
  fs.writeFileSync(jpgPath, buf);
  unlinkSync(file);
  console.log(`${rel} -> ${basename(jpgPath)}: ${(before / 1024).toFixed(0)}KB -> ${(buf.length / 1024).toFixed(0)}KB (PNG->JPEG)`);
}

async function main() {
  // OEM + integration logos: displayed at 34-48px tall, max-width 150-200px.
  // Target height 150px (~3x max display height) preserves crispness with
  // generous retina headroom while cutting oversized source dimensions.
  const logoFiles = readdirSync(ASSETS).filter((f) => /^logo-/.test(f) && /\.(png|jpg|jpeg)$/i.test(f));
  for (const f of logoFiles) {
    await resizeInPlace(f, { height: 150, quality: 82 });
  }
  // Header/footer brand logo: shown on every page at 36-40px tall.
  await resizeInPlace("buzznerd-logo-trim.png", { height: 150, quality: 85 });

  // Before/after photo-enhancement shots: displayed max-width ~900px.
  await resizeInPlace("photos/before-frontqtr.jpg", { width: 1000, quality: 80 });
  await resizeInPlace("photos/before-frontqtr2.jpg", { width: 1000, quality: 80 });
  await resizeInPlace("photos/before-side.jpg", { width: 1000, quality: 80 });
  for (const rel of PHOTO_PNG_TO_JPG) await convertPngPhotoToJpg(rel);

  // Team photo (about-us): displayed in a 440px-tall card.
  await resizeInPlace("dave-fisher.jpeg", { width: 700, quality: 80 });

  // Character/mascot illustrations: already close to display size (~460-800px
  // known usage) — just recompress with palette quantization, no resize.
  const illustrations = [
    "buzznerd-mascot-charged.png",
    "buzznerd-hero-character.png",
    "buzznerd-team-heroes.png",
    "growth-hero.png",
    "workflows-character.png",
    "content-restructuring-character.png",
    "presence-score-character.png",
  ];
  for (const f of illustrations) {
    const meta = await sharp(join(ASSETS, f)).metadata();
    await resizeInPlace(f, { width: meta.width, quality: 82 }); // recompress only
  }

  console.log("\ndone");
}

main();
