import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = process.argv[2] ?? "shots";
mkdirSync(OUT, { recursive: true });

const PAGES = [
  ["landing", "http://localhost:3000/", 1280, 900],
  ["feed", "http://localhost:3000/preview", 1280, 1000],
  ["feed-mobile", "http://localhost:3000/preview", 390, 844],
  ["projects", "http://localhost:3000/preview/projects", 1280, 900],
];

const browser = await chromium.launch();
for (const [name, url, w, h] of PAGES) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log("captured", name);
  await page.close();
}
await browser.close();
