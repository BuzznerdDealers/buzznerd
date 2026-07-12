/**
 * build-vercel-json.mjs — generate vercel.json from the handoff's
 * deploy/_redirects (Netlify/static-host format: "source  destination  code").
 * Vercel's redirect `source` uses path-to-regexp, not shell globs — a
 * trailing "/*" (e.g. "/category/*") must become "/category/:path*".
 */
import { readFileSync, writeFileSync } from "node:fs";

const DC =
  "/tmp/claude-0/-home-user-astra-start/921c426a-a779-5f68-a225-af3123476db7/scratchpad/zip7/design_handoff_buzznerd_site";
const ROOT = "/home/user/astra-start";

function toVercelSource(source) {
  // "/foo/*" (shell glob, matches the segment and anything after) -> "/foo/:path*"
  if (source.endsWith("/*")) return source.slice(0, -2) + "/:path*";
  return source;
}

const txt = readFileSync(`${DC}/deploy/_redirects`, "utf8");
const seen = new Set();
const redirects = [];
for (const line of txt.split("\n")) {
  const s = line.trim();
  if (!s || s.startsWith("#")) continue;
  const parts = s.split(/\s+/);
  if (parts.length < 2) continue;
  const [source, destination, code] = parts;
  const vSource = toVercelSource(source);
  if (seen.has(vSource)) continue; // the handoff _redirects has one exact duplicate line
  seen.add(vSource);
  redirects.push({ source: vSource, destination, permanent: (code || "301") === "301" });
}

const vercel = {
  $schema: "https://openapi.vercel.sh/vercel.json",
  cleanUrls: true,
  trailingSlash: false,
  redirects,
};
writeFileSync(`${ROOT}/vercel.json`, JSON.stringify(vercel, null, 2) + "\n");
console.log("wrote vercel.json with", redirects.length, "redirects");
