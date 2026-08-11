// scripts/redesign-screenshots.mjs
// Phase 4: Capture after-screenshots at 1440/834/390 for every changed page,
// and run a programmatic WCAG AA contrast check on key text/bg pairs.
//
// Usage: node scripts/redesign-screenshots.mjs <baseUrl> <outDir>
//   baseUrl defaults to http://localhost:3000
//   outDir defaults to docs/redesign-preview

import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.argv[2] || 'http://localhost:3000';
const OUT = process.argv[3] || path.resolve('docs/redesign-preview');

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet',  width: 834,  height: 1194 },
  { name: 'mobile',  width: 390,  height: 844 },
];

const PAGES = [
  { slug: 'landing',             route: '/' },
  { slug: 'home',                route: '/home' },
  { slug: 'timetable',           route: '/timetable' },
  { slug: 'timetable_custom',    route: '/timetable/custom' },
  { slug: 'timetable_optimizer', route: '/timetable/optimizer' },
  { slug: 'schedule',            route: '/schedule' },
  { slug: 'custom',              route: '/custom' },
  { slug: 'rooms',               route: '/rooms' },
  { slug: 'semester',            route: '/semester' },
  { slug: 'events',              route: '/events' },
  { slug: 'faculty',             route: '/faculty' },
  { slug: 'lost_found',          route: '/lost-found' },
  { slug: 'admin',               route: '/admin' },
];

// ── WCAG contrast helpers ──────────────────────────────────────────────
function srgbToLin(c) {
  c = c / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function relLum([r, g, b]) {
  return 0.2126 * srgbToLin(r) + 0.7152 * srgbToLin(g) + 0.0722 * srgbToLin(b);
}
function contrastRatio(rgb1, rgb2) {
  const L1 = relLum(rgb1), L2 = relLum(rgb2);
  const hi = Math.max(L1, L2), lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}
function parseRgb(str) {
  // handles "rgb(r, g, b)" and "rgba(r, g, b, a)"
  const m = str.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(',').map(s => parseFloat(s.trim()));
  return [parts[0], parts[1], parts[2]];
}
function hexToRgb(hex) {
  const m = hex.replace('#', '');
  return [parseInt(m.slice(0,2),16), parseInt(m.slice(2,4),16), parseInt(m.slice(4,6),16)];
}

const PAIRS = [
  // light mode pairs (from the token system)
  { name: 'ink-primary on bg (light)', fg: '#1A1A18', bg: '#FAFAF8' },
  { name: 'ink-primary on raised (light)', fg: '#1A1A18', bg: '#FFFFFF' },
  { name: 'ink-primary on subtle (light)', fg: '#1A1A18', bg: '#F2F1EE' },
  { name: 'primary-action-fg on primary-action (light)', fg: '#FAFAF8', bg: '#1A1A18' },
  { name: 'secondary text on bg (light)', fg: '#6B6B66', bg: '#FAFAF8' },
  { name: 'tertiary text on bg (light)', fg: '#A0A09A', bg: '#FAFAF8' },
  { name: 'today color on today-bg (light)', fg: '#1D4ED8', bg: '#EFF6FF' },
  { name: 'success-strong on success-bg (light)', fg: '#059669', bg: '#ECFDF5' },
  { name: 'urgent on white (light)', fg: '#E11D48', bg: '#FFFFFF' },
  { name: 'accent-cs (blue) on white (light)', fg: '#1D4ED8', bg: '#FFFFFF' },
  { name: 'accent-cs on accent-cs-bg (light)', fg: '#1D4ED8', bg: '#EFF6FF' },
  { name: 'accent-ba (gold) on white (light)', fg: '#CA8A04', bg: '#FFFFFF' },
  { name: 'accent-ft (fuchsia) on white (light)', fg: '#C026D3', bg: '#FFFFFF' },
  // dark mode pairs
  { name: 'ink-primary on bg (dark)', fg: '#F0EFEB', bg: '#111110' },
  { name: 'ink-primary on raised (dark)', fg: '#F0EFEB', bg: '#1C1C1A' },
  { name: 'primary-action-fg on primary-action (dark)', fg: '#111110', bg: '#F0EFEB' },
  { name: 'secondary text on bg (dark)', fg: '#8C8C86', bg: '#111110' },
  { name: 'today on today-bg (dark)', fg: '#60A5FA', bg: '#1e2d57' },
  { name: 'success-strong on success-bg (dark)', fg: '#34D399', bg: '#064e3b' },
  { name: 'urgent on raised (dark)', fg: '#FB7185', bg: '#1C1C1A' },
];

function checkWcag() {
  const results = [];
  for (const p of PAIRS) {
    const fg = p.fg.startsWith('#') ? hexToRgb(p.fg) : parseRgb(p.fg);
    const bg = p.bg.startsWith('#') ? hexToRgb(p.bg) : parseRgb(p.bg);
    const ratio = contrastRatio(fg, bg);
    const passAA = ratio >= 4.5;   // normal text
    const passAALarge = ratio >= 3; // large text (>=18px or >=14px bold)
    results.push({ ...p, ratio: Math.round(ratio * 100) / 100, passAA, passAALarge });
  }
  return results;
}

// ── Main ───────────────────────────────────────────────────────────────
(async () => {
  console.log(`Base: ${BASE}\nOut:  ${OUT}\n`);
  await mkdir(OUT, { recursive: true });

  // WCAG check (static — doesn't need a browser)
  console.log('─ WCAG AA contrast check (design tokens) ─');
  const wcag = checkWcag();
  let pass = 0, fail = 0;
  for (const r of wcag) {
    const status = r.passAA ? 'PASS' : (r.passAALarge ? 'pass(large)' : 'FAIL');
    console.log(`  ${status.padEnd(12)} ${r.ratio.toFixed(2).padStart(6)}  ${r.name}`);
    if (r.passAA) pass++; else fail++;
  }
  console.log(`  → ${pass} pass, ${fail} fail (AA normal-text threshold 4.5:1)\n`);
  await writeFile(path.join(OUT, 'wcag-contrast.json'), JSON.stringify(wcag, null, 2));

  // Screenshots
  const browser = await chromium.launch();
  const context = await browser.newContext({ ignoreHTTPSErrors: true });

  const summary = [];
  for (const { slug, route } of PAGES) {
    const pageDir = path.join(OUT, slug);
    await mkdir(pageDir, { recursive: true });
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      const url = BASE + route;
      try {
        // networkidle can hang on long-polling; use 'load' + settle
        await page.goto(url, { waitUntil: 'load', timeout: 45000 });
        await page.waitForTimeout(2500); // settle for fonts/animations
        const file = path.join(pageDir, `${vp.name}.png`);
        await page.screenshot({ path: file, fullPage: true });
        const title = await page.title().catch(() => '');
        summary.push({ slug, route, viewport: vp.name, status: 'ok', title });
        console.log(`  ✓ ${slug.padEnd(22)} ${vp.name.padEnd(8)} ${url}`);
      } catch (e) {
        summary.push({ slug, route, viewport: vp.name, status: 'error', error: String(e).slice(0,200) });
        console.log(`  ✗ ${slug.padEnd(22)} ${vp.name.padEnd(8)} ERROR: ${String(e).slice(0,160)}`);
      }
      await page.close();
    }
  }

  await writeFile(path.join(OUT, 'screenshot-summary.json'), JSON.stringify(summary, null, 2));
  await browser.close();
  const ok = summary.filter(s => s.status === 'ok').length;
  const err = summary.filter(s => s.status === 'error').length;
  console.log(`\nDone: ${ok} screenshots captured, ${err} errors.`);
  process.exit(err > 0 ? 1 : 0);
})();
