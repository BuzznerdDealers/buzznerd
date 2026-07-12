/**
 * setup-fonts.mjs — self-host the two brand fonts so the site makes ZERO
 * requests to fonts.googleapis.com / fonts.gstatic.com. The media=print +
 * display=optional Google Fonts approach still left the cross-origin
 * css2 -> woff2 chain in Lighthouse's LCP dependency tree (kept flagging
 * "render-blocking" / "avoid chaining critical requests" on mobile). With the
 * woff2 served same-origin from /assets/fonts and the @font-face inlined in
 * <head>, there is no external font request left to flag.
 *
 * Uses the variable (wght-axis, latin) woff2 from @fontsource-variable, which
 * cover every weight the design uses (Bricolage 600-800, Plus Jakarta 400-700)
 * in one small file each. Run once (re-run to refresh the copied files).
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = "/home/user/astra-start";
const FONT_DIR = join(ROOT, "assets/fonts");
mkdirSync(FONT_DIR, { recursive: true });

const SRC = join(ROOT, "node_modules");
const files = [
  [
    "@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2",
    "bricolage-grotesque.woff2",
  ],
  [
    "@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2",
    "plus-jakarta-sans.woff2",
  ],
];
for (const [src, dest] of files) {
  copyFileSync(join(SRC, src), join(FONT_DIR, dest));
  console.log("copied", dest);
}
console.log("done — fonts self-hosted in assets/fonts/");
