/**
 * extract-dc.mjs — render each Buzznerd *.dc.html with a real React runtime
 * (what the design tool provides), so support.js resolves <sc-if>/<sc-for>/{{..}}
 * into their static DOM, then capture the resolved #dc-root HTML per page.
 * Output: build/<comp>.body.html (raw resolved body, pre-cleanup).
 */
import { chromium } from "playwright-core";
import { writeFileSync, mkdirSync } from "node:fs";

const BASE = "http://localhost:8099";
mkdirSync("build", { recursive: true });

const PAGES = [
  ["Buzznerd Home.dc.html", "home"],
  ["Buzznerd Solutions.dc.html", "solutions"],
  ["Buzznerd Products.dc.html", "products"],
  ["Buzznerd Services.dc.html", "services"],
  ["Buzznerd AI Websites.dc.html", "ai-websites"],
  ["Buzznerd AI E-Commerce.dc.html", "ai-ecommerce"],
  ["Buzznerd AI Platform.dc.html", "ai-platform"],
  ["Buzznerd AI Marketing.dc.html", "ai-driven-marketing"],
  ["Buzznerd Content Restructuring.dc.html", "content-restructuring-for-aio"],
  ["Buzznerd Workflows.dc.html", "custom-workflows-integrations"],
  ["Buzznerd AI Presence Score.dc.html", "ai-presence-score"],
  ["Buzznerd About.dc.html", "about-us"],
  ["Buzznerd Careers.dc.html", "careers"],
  ["Buzznerd Contact.dc.html", "contact"],
  ["Buzznerd Privacy.dc.html", "privacy"],
  ["Buzznerd Terms.dc.html", "terms"],
];

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });

// Inject React/ReactDOM UMD before support.js so the prototype runtime boots.
await page.route("**/*.dc.html", async (route) => {
  const r = await route.fetch();
  let html = await r.text();
  html = html.replace(
    '<script src="./support.js"></script>',
    '<script src="/vendor-react.js"></script><script src="/vendor-react-dom.js"></script><script src="./support.js"></script>',
  );
  await route.fulfill({ response: r, body: html, headers: { ...r.headers(), "content-type": "text/html; charset=utf-8" } });
});

for (const [file, comp] of PAGES) {
  const url = `${BASE}/${encodeURIComponent(file)}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  // Wait for the runtime to mount and resolve the template.
  await page.waitForFunction(
    () => {
      const el = document.getElementById("dc-root");
      return el && el.innerHTML.length > 4000;
    },
    { timeout: 60000 },
  );
  await page.waitForTimeout(400);
  const body = await page.evaluate(() => document.getElementById("dc-root").innerHTML);
  writeFileSync(`build/${comp}.body.html`, body);
  console.log("extracted", comp, `(${body.length} chars)`);
}

await browser.close();
console.log("done");
