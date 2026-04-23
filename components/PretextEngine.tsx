"use client";

import { useEffect } from "react";
import type {
  PreparedTextWithSegments,
  LayoutCursor,
  LayoutLineRange,
} from "@chenglou/pretext";
import {
  getWrapHull,
  transformWrapPoints,
  getPolygonIntervalForBand,
  getRectIntervalsForBand,
  carveTextLineSlots,
  type Point,
  type Interval,
  type Rect,
} from "./wrap-geometry";

const BODY_FONT = "400 16px 'Libre Baskerville', Georgia, serif";
const LINE_HEIGHT = 23;
const GAP = 20;
const MIN_REGION_WIDTH = 110;
const PARA_GAP = 14;
const HEADING_HEIGHT = 44;
const HEADING_GAP_ABOVE = 20;
const HEADING_GAP_BELOW = 14;

type PtFns = {
  prepareWithSegments: (t: string, f: string) => PreparedTextWithSegments;
  layoutNextLineRange: (p: PreparedTextWithSegments, c: LayoutCursor, w: number) => LayoutLineRange | null;
  materializeLineRange: (p: PreparedTextWithSegments, r: LayoutLineRange) => { text: string };
};

// ─── module-level state ───────────────────────────────────────────────────────
let ptFns: PtFns | null = null;
let prepared: (PreparedTextWithSegments | null)[] = [];
const hullCache = new Map<string, Point[][]>();

// Per-column DOM pools so we update existing nodes instead of rebuilding.
const linePools = new WeakMap<HTMLElement, HTMLDivElement[]>();
// Last committed projection per column — diffed before writing to DOM.
const committedByColumn = new WeakMap<HTMLElement, ColumnProjection>();

// ─── article content ──────────────────────────────────────────────────────────
type Item = { kind: "p"; text: string } | { kind: "h"; text: string };

const ARTICLE: Item[] = [
  { kind: "p", text: `or years, I prided myself on being resilient. As a founder and a neuroscientist, I wore my capacity to endure like a badge of honor. I learned to push myself further, work longer hours, and absorb pressure without showing cracks. Each time I hit a wall, I adapted, trying to become tougher — until my body stopped cooperating.` },
  { kind: "p", text: `While working at Google, I developed a blood clot in my arm — a condition that, in someone my age at the time, doctors associated with chronic stress. It forced an uncomfortable question: What if my resilience wasn't protecting me, but delaying the moment I had to admit something was wrong?` },
  { kind: "p", text: `We tend to treat resilience as an unqualified good. We praise the quality in entrepreneurs, caregivers, students, and leaders. Resiliency has become a moral injunction — a signal of maturity and strength. But a growing body of research suggests that resilience, when applied blindly, can do real harm to our health and our ability to change broken systems.` },

  { kind: "h", text: "When grit becomes a trap" },
  { kind: "p", text: `Psychologist George Bonanno, one of the leading researchers on resilience, has argued that resilience is not a fixed trait but a pattern of regulatory flexibility — the ability to choose different strategies depending on context. The paradox appears when resilience gets mistaken for a single strategy: to endure and keep going.` },
  { kind: "p", text: `This turns resilience into a rigid form of grit. In several studies, people with higher grit were more likely to persist at tasks that were objectively unwinnable. They played longer, invested more effort, and lost more money. The same quality that helps those people finish hard things also makes them slower to abandon unworkable ones.` },
  { kind: "p", text: `A similar misreading happens in how we interpret adversity. One of the most widely cited findings in psychology is a U-shaped curve: People who have experienced some adversity report better long-term well-being than those who've experienced none or a lot. This nuance is often flattened into a slogan — "what doesn't kill you makes you stronger" — which ignores the steep drop-off in well-being at high levels of adversity.` },
  { kind: "p", text: `Even more dangerous is when organizations take a descriptive finding and turn it into a prescription. Adversity is character-building. The data doesn't say that. At the physiological level, the costs of rigid grit can be severe. Resilience stops being a positive when it keeps people tolerating what should be fixed.` },

  { kind: "h", text: "Resilience as strategy" },
  { kind: "p", text: `Resilience is not a virtue but a strategy, and like all strategies, it has failure modes. Instead of applying it blindly and rigidly, here are five evidence-based ways to practice resilience without letting it backfire.` },
  { kind: "p", text: `1. Distinguish between challenges and traps. Challenges are temporary obstacles with clear pathways forward; traps are situations where more effort yields diminishing or negative returns. Before doubling down, ask: if I keep going like this, is the situation likely to improve?` },
  { kind: "p", text: `2. Monitor your body's veto power. Chronic fatigue, persistent anxiety, or recurring illness aren't signs you need more resilience; they're signs you need different strategies.` },
  { kind: "p", text: `3. Practice strategic quitting. Changing paths when costs outweigh benefits is a core component of emotional agility.` },
  { kind: "p", text: `4. Separate your worth from your resilience. Your value isn't measured by how much you can bear.` },
  { kind: "p", text: `5. Look for systemic solutions. Sometimes, the most effective response to adversity is working to eliminate its source rather than learning to tolerate it better.` },
];

interface FlowState { pIdx: number; cursor: LayoutCursor }

// ─── projection types ─────────────────────────────────────────────────────────

type ProjectedLine = {
  kind: "p" | "h";
  top: number;
  left: number;
  width: number;
  text: string;
};

type ColumnProjection = {
  lines: ProjectedLine[];
  height: number;
  dropCapTop: number | null;
};

// ─── image hull sampling (uses wrap-geometry) ─────────────────────────────────

const HULL_OPTIONS = { smoothRadius: 6, mode: "envelope" as const, convexify: false };

async function preloadHull(src: string): Promise<void> {
  if (hullCache.has(src)) return;
  try {
    const points = await getWrapHull(src, HULL_OPTIONS);
    hullCache.set(src, points);
  } catch (err) {
    console.warn(`Skipping wrap hull for ${src}:`, err);
    hullCache.set(src, []);
  }
}

function getTransformAngle(el: HTMLElement): number {
  const t = getComputedStyle(el).transform;
  if (!t || t === "none") return 0;
  const m = t.match(/matrix\(([-\d.eE+,\s]+)\)/);
  if (!m) return 0;
  const v = m[1].split(",").map(s => parseFloat(s.trim()));
  return Math.atan2(v[1] || 0, v[0] || 1);
}

// ─── layout (pure — returns a projection, no DOM writes) ──────────────────────

interface TextRegion { start: number; end: number }

function getTextRegions(
  y: number,
  colW: number,
  polygons: Point[][],
  rects: Rect[],
): TextRegion[] {
  const bandTop = y;
  const bandBottom = y + LINE_HEIGHT;

  const blocked: Interval[] = [];
  for (const poly of polygons) {
    const iv = getPolygonIntervalForBand(poly, bandTop, bandBottom, GAP, 0);
    if (iv !== null) blocked.push(iv);
  }
  for (const iv of getRectIntervalsForBand(rects, bandTop, bandBottom, GAP, 0)) {
    blocked.push(iv);
  }

  const slots = carveTextLineSlots({ left: 0, right: colW }, blocked);
  return slots
    .filter(s => s.right - s.left >= MIN_REGION_WIDTH)
    .map(s => ({ start: Math.max(0, s.left), end: Math.min(colW, s.right) }));
}

function evaluateColumn(
  col: HTMLElement,
  pageEl: HTMLElement,
  state: FlowState,
): { projection: ColumnProjection; next: FlowState } {
  const emptyProjection: ColumnProjection = { lines: [], height: 0, dropCapTop: null };
  if (!ptFns || prepared.length === 0) return { projection: emptyProjection, next: state };

  const ft = col.querySelector<HTMLElement>(".flow-text");
  if (!ft) return { projection: emptyProjection, next: state };

  const ftRect = ft.getBoundingClientRect();
  const colW = ft.clientWidth;
  const availH = col.clientHeight || ft.clientHeight || 9999;

  // The .paged-article may have a CSS `transform: scale(s)` applied for fit-
  // to-viewport. getBoundingClientRect() returns post-transform (viewport)
  // pixels, while offsetLeft/clientWidth return pre-transform (layout) pixels.
  // Convert client-rect deltas into layout pixels via the current scale so
  // obstacles line up with the unscaled coordinate system pretext uses.
  const scaleS = ftRect.width > 0 && ft.clientWidth > 0 ? ftRect.width / ft.clientWidth : 1;
  const inv = scaleS === 0 ? 1 : 1 / scaleS;

  // Dropcap top: measured from the cover-text-block, not rendered via pool.
  let dropCapTop: number | null = null;
  const dropCapEl = col.querySelector<HTMLElement>(".dropcap");
  if (dropCapEl) {
    const textBlock = col.querySelector<HTMLElement>(".cover-text-block");
    if (textBlock) {
      const tbRect = textBlock.getBoundingClientRect();
      dropCapTop = Math.max(0, (tbRect.bottom - ftRect.top) * inv + 36);
    }
  }

  // Collect image polygon obstacles (alpha hulls, with rotation).
  const pageRect = pageEl.getBoundingClientRect();
  const offX = (pageRect.left - ftRect.left) * inv;
  const offY = (pageRect.top - ftRect.top) * inv;

  const images = Array.from(pageEl.querySelectorAll<HTMLElement>(".spread-image"));
  const polygons: Point[][] = [];
  for (const img of images) {
    const src = img.getAttribute("data-img") || "";
    const hulls = src ? hullCache.get(src) : null;
    if (!hulls || hulls.length === 0) continue;
    const w = img.offsetWidth;
    const h = img.offsetHeight;
    if (w <= 0 || h <= 0) continue;
    const rect: Rect = {
      x: offX + img.offsetLeft,
      y: offY + img.offsetTop,
      width: w,
      height: h,
    };
    if (rect.x + rect.width <= 0 || rect.x >= colW) continue;
    const angle = getTransformAngle(img);
    for (const hull of hulls) polygons.push(transformWrapPoints(hull, rect, angle));
  }

  // Collect rectangular obstacles (title, byline, cover image, etc.).
  // Dropcap is handled separately using its computed target top so layout and
  // its DOM position stay in sync within a single frame.
  const obstacles = Array.from(col.querySelectorAll<HTMLElement>("[data-flow-obstacle]"))
    .filter(el => !el.classList.contains("dropcap"));
  const rects: Rect[] = obstacles.map(el => {
    const r = el.getBoundingClientRect();
    return {
      x: (r.left - ftRect.left) * inv,
      y: (r.top - ftRect.top) * inv,
      width: r.width * inv,
      height: r.height * inv,
    };
  }).filter(r => r.y + r.height > 0 && r.y < availH && r.x + r.width > 0 && r.x < colW);

  // Add dropcap as synthetic rect at its computed target position.
  if (dropCapEl && dropCapTop !== null) {
    rects.push({
      x: dropCapEl.offsetLeft,
      y: dropCapTop,
      width: dropCapEl.offsetWidth,
      height: dropCapEl.offsetHeight,
    });
  }

  const { layoutNextLineRange, materializeLineRange } = ptFns;
  let { pIdx, cursor } = state;
  let y = dropCapTop ?? 0;
  let maxY = 0;
  let safety = 0;
  const lines: ProjectedLine[] = [];

  while (safety++ < 3000) {
    if (pIdx >= ARTICLE.length) break;
    if (y + LINE_HEIGHT > availH) break;

    const item = ARTICLE[pIdx];

    if (item.kind === "h") {
      let headY = y + HEADING_GAP_ABOVE;
      let guard = 0;
      while (guard++ < 200) {
        if (headY + HEADING_HEIGHT > availH) { headY = availH + 1; break; }
        const regs = getTextRegions(headY, colW, polygons, rects);
        const widest = regs.reduce((m, r) => Math.max(m, r.end - r.start), 0);
        if (widest >= colW * 0.9) break;
        headY += LINE_HEIGHT;
      }
      if (headY + HEADING_HEIGHT > availH) break;

      lines.push({ kind: "h", top: headY, left: 0, width: colW, text: item.text });
      y = headY + HEADING_HEIGHT + HEADING_GAP_BELOW;
      maxY = y;
      pIdx++;
      continue;
    }

    const p = prepared[pIdx];
    if (!p) { pIdx++; continue; }

    const regions = getTextRegions(y, colW, polygons, rects);
    if (regions.length === 0) { y += LINE_HEIGHT; continue; }

    let anyRendered = false;
    let paragraphEnded = false;

    for (const region of regions) {
      const width = region.end - region.start;
      if (width < MIN_REGION_WIDTH) continue;

      const range = layoutNextLineRange(p, cursor, width);
      if (range === null) {
        paragraphEnded = true;
        pIdx++;
        cursor = { segmentIndex: 0, graphemeIndex: 0 };
        break;
      }

      const line = materializeLineRange(p, range);
      lines.push({ kind: "p", top: y, left: region.start, width, text: line.text });
      cursor = range.end;
      anyRendered = true;
    }

    y += LINE_HEIGHT;
    if (anyRendered) maxY = y;
    if (paragraphEnded && pIdx < ARTICLE.length) y += PARA_GAP;
  }

  return {
    projection: { lines, height: Math.max(maxY, availH), dropCapTop },
    next: { pIdx, cursor },
  };
}

// ─── projection diffing + DOM pool ────────────────────────────────────────────

function lineEqual(a: ProjectedLine, b: ProjectedLine): boolean {
  return a.kind === b.kind
    && a.top === b.top
    && a.left === b.left
    && a.width === b.width
    && a.text === b.text;
}

function projectionEqual(a: ColumnProjection | undefined, b: ColumnProjection): boolean {
  if (!a) return false;
  if (a.height !== b.height) return false;
  if (a.dropCapTop !== b.dropCapTop) return false;
  if (a.lines.length !== b.lines.length) return false;
  for (let i = 0; i < a.lines.length; i++) {
    if (!lineEqual(a.lines[i]!, b.lines[i]!)) return false;
  }
  return true;
}

function syncLinePool(ft: HTMLElement, length: number): HTMLDivElement[] {
  let pool = linePools.get(ft);
  if (!pool) { pool = []; linePools.set(ft, pool); }
  while (pool.length < length) {
    const el = document.createElement("div");
    pool.push(el);
    ft.appendChild(el);
  }
  while (pool.length > length) {
    pool.pop()!.remove();
  }
  return pool;
}

function projectColumn(col: HTMLElement, projection: ColumnProjection): void {
  const ft = col.querySelector<HTMLElement>(".flow-text");
  if (!ft) return;

  const dropCapEl = col.querySelector<HTMLElement>(".dropcap");
  if (dropCapEl && projection.dropCapTop !== null) {
    dropCapEl.style.top = projection.dropCapTop + "px";
  }

  const postBlock = col.querySelector<HTMLElement>(".post-text-block");
  if (postBlock) {
    const lastLine = projection.lines[projection.lines.length - 1];
    const textBottom = lastLine ? lastLine.top + LINE_HEIGHT : 0;
    const top = textBottom === 0 ? 0 : textBottom + 40;
    postBlock.style.top = top + "px";
  }

  const pool = syncLinePool(ft, projection.lines.length);
  for (let i = 0; i < projection.lines.length; i++) {
    const line = projection.lines[i]!;
    const el = pool[i]!;
    const className = line.kind === "h" ? "section-heading" : "flow-line";
    if (el.className !== className) el.className = className;
    const leadingNum = line.kind === "p" ? line.text.match(/^(\d+)\.\s+/) : null;
    if (leadingNum) {
      const rest = line.text.slice(leadingNum[0].length);
      const html = `<strong>${leadingNum[1]}.</strong> ${rest.replace(/&/g, "&amp;").replace(/</g, "&lt;")}`;
      if (el.innerHTML !== html) el.innerHTML = html;
    } else if (el.textContent !== line.text) {
      el.textContent = line.text;
    }
    const top = line.top + "px";
    const left = line.left + "px";
    const width = line.width + "px";
    if (el.style.top !== top) el.style.top = top;
    if (el.style.left !== left) el.style.left = left;
    if (el.style.width !== width) el.style.width = width;
  }

  const heightPx = projection.height + "px";
  if (ft.style.height !== heightPx) ft.style.height = heightPx;
  if (ft.classList.contains("loading")) ft.classList.remove("loading");
}

// ─── rAF-scheduled frame commit ───────────────────────────────────────────────

let scheduled = false;
let pending = false;

function scheduleFrame(): void {
  if (scheduled) { pending = true; return; }
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    commitFrame();
    if (pending) { pending = false; scheduleFrame(); }
  });
}

function commitFrame(): void {
  if (!ptFns || prepared.length === 0) return;

  const allCols = Array.from(document.querySelectorAll<HTMLElement>("[data-text]"));
  let state: FlowState = { pIdx: 0, cursor: { segmentIndex: 0, graphemeIndex: 0 } };
  const perCol: { col: HTMLElement; projection: ColumnProjection }[] = [];
  let endingCol: HTMLElement | null = null;

  for (const col of allCols) {
    const pageEl = col.closest<HTMLElement>(".page-spread");
    if (!pageEl) continue;
    const beforePIdx = state.pIdx;
    const { projection, next } = evaluateColumn(col, pageEl, state);
    state = next;
    perCol.push({ col, projection });
    if (
      beforePIdx < ARTICLE.length &&
      state.pIdx >= ARTICLE.length &&
      projection.lines.length > 0
    ) {
      endingCol = col;
    }
  }

  // Place .post-text-block in the column article text ends in, or the next
  // empty column if it doesn't fit below the last line.
  const postBlock = document.querySelector<HTMLElement>(".post-text-block");
  let movedInto: HTMLElement | null = null;
  let startAtTop = false;
  if (postBlock && endingCol) {
    const endingIdx = perCol.findIndex(p => p.col === endingCol);
    const endingProj = perCol[endingIdx]!.projection;
    const lastLine = endingProj.lines[endingProj.lines.length - 1];
    const textBottom = lastLine ? lastLine.top + LINE_HEIGHT : 0;
    const colH = endingCol.clientHeight;
    const blockH = postBlock.offsetHeight || 0;
    const GAP_ABOVE = 40;
    const fits = textBottom + GAP_ABOVE + blockH <= colH;

    let target: HTMLElement = endingCol;
    if (!fits) {
      const next = perCol[endingIdx + 1];
      if (next && next.projection.lines.length === 0) {
        target = next.col;
        startAtTop = true;
      }
    }
    if (postBlock.parentElement !== target) {
      target.appendChild(postBlock);
      movedInto = target;
    } else if (postBlock.parentElement === endingCol && !fits) {
      // Already in endingCol but doesn't fit — still mark for reposition
      movedInto = endingCol;
    }
  }

  for (const { col, projection } of perCol) {
    const prev = committedByColumn.get(col);
    const needsWrite = !projectionEqual(prev, projection) || col === movedInto;
    if (needsWrite) {
      projectColumn(col, projection);
      committedByColumn.set(col, projection);
    }
  }

  // Count columns that received at least one line of article text. The column
  // holding .post-text-block is also considered used even if no lines landed
  // in it. Report so ArticleContent can grow the page count to fit overflow.
  let colsUsed = 0;
  for (let i = 0; i < perCol.length; i++) {
    const { col, projection } = perCol[i];
    const hasText = projection.lines.length > 0;
    const holdsPostBlock = !!col.querySelector(":scope > .post-text-block");
    if (hasText || holdsPostBlock) colsUsed = i + 1;
  }
  const cb = (window as unknown as { __onArticleColsUsed?: (n: number) => void }).__onArticleColsUsed;
  if (cb) cb(colsUsed);
}

// ─── async init ───────────────────────────────────────────────────────────────

async function initialize(isCancelled: () => boolean): Promise<void> {
  const mod = await import("@chenglou/pretext");
  if (isCancelled()) return;

  ptFns = {
    prepareWithSegments: mod.prepareWithSegments,
    layoutNextLineRange: mod.layoutNextLineRange,
    materializeLineRange: mod.materializeLineRange,
  };

  await document.fonts.ready;
  if (isCancelled()) return;

  prepared = ARTICLE.map(item =>
    item.kind === "p" ? ptFns!.prepareWithSegments(item.text, BODY_FONT) : null
  );

  if (isCancelled()) return;

  const images = Array.from(document.querySelectorAll<HTMLElement>(".spread-image"));
  const srcs = Array.from(new Set(images.map(i => i.getAttribute("data-img") || "").filter(Boolean)));
  await Promise.all(srcs.map(preloadHull));

  if (isCancelled()) return;

  scheduleFrame();
}

// ─── component ────────────────────────────────────────────────────────────────

export default function PretextEngine() {
  useEffect(() => {
    let cancelled = false;

    document.querySelectorAll<HTMLElement>(".flow-text").forEach(el => {
      el.innerHTML = "";
      el.classList.add("loading");
    });

    initialize(() => cancelled)
      .catch(err => console.error("Pretext render failed:", err));

    const onReflow = () => { if (!cancelled) scheduleFrame(); };
    const onResize = () => { if (!cancelled) scheduleFrame(); };
    window.addEventListener("pretext-reflow", onReflow);
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      window.removeEventListener("pretext-reflow", onReflow);
      window.removeEventListener("resize", onResize);
      ptFns = null;
      prepared = [];
      hullCache.clear();
    };
  }, []);

  return null;
}
