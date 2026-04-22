"use client";

import { useEffect, useRef } from "react";
import type {
  PreparedTextWithSegments,
  LayoutCursor,
  LayoutLineRange,
} from "@chenglou/pretext";

const BODY_FONT = "400 19px 'Libre Baskerville', Georgia, serif";
const LINE_HEIGHT = 30;

type LayoutFn = (
  p: PreparedTextWithSegments,
  c: LayoutCursor,
  w: number
) => LayoutLineRange | null;

type MaterializeFn = (
  p: PreparedTextWithSegments,
  r: LayoutLineRange
) => { text: string };

function flowLines(
  prepared: PreparedTextWithSegments,
  widthFn: (y: number) => number,
  xOffsetFn: (y: number) => number,
  startY: number,
  container: HTMLElement,
  layoutNextLineRange: LayoutFn,
  materializeLineRange: MaterializeFn
): number {
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
  let y = startY;
  let maxY = startY;
  let safety = 0;

  while (safety++ < 600) {
    const width = widthFn(y);
    const xOffset = xOffsetFn(y);

    if (width <= 40) {
      y += LINE_HEIGHT;
      continue;
    }

    const range = layoutNextLineRange(prepared, cursor, width);
    if (range === null) break;

    const line = materializeLineRange(prepared, range);
    const el = document.createElement("div");
    el.className = "flow-line";
    el.style.top = y + "px";
    el.style.left = xOffset + "px";
    el.style.width = width + "px";
    el.textContent = line.text;
    container.appendChild(el);

    cursor = range.end;
    y += LINE_HEIGHT;
    maxY = y;
  }
  return maxY;
}

async function sampleImageRightEdge(
  imgSrc: string,
  width: number,
  height: number
): Promise<number[]> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imgSrc;
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = rej;
  });

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);

  const data = ctx.getImageData(0, 0, width, height).data;
  const edges: number[] = new Array(height).fill(0);
  for (let row = 0; row < height; row++) {
    let rightmost = 0;
    for (let x = width - 1; x >= 0; x--) {
      if (data[(row * width + x) * 4 + 3] > 30) {
        rightmost = x;
        break;
      }
    }
    edges[row] = rightmost;
  }
  return edges;
}

async function sampleSilhouetteRightEdge(
  svgEl: SVGElement,
  width: number,
  height: number
): Promise<number[]> {
  const svgString = new XMLSerializer().serializeToString(svgEl);
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const edges = await sampleImageRightEdge(url, width, height);
  URL.revokeObjectURL(url);
  return edges;
}

async function renderOpening(
  prepareWithSegments: (t: string, f: string) => PreparedTextWithSegments,
  layoutNextLineRange: LayoutFn,
  materializeLineRange: MaterializeFn
) {
  const root = document.querySelector<HTMLElement>('[data-pretext="opening"]');
  if (!root) return;
  const container = root.querySelector<HTMLElement>(".flow-text")!;
  const fullWidth = container.clientWidth;
  const dropCapWidth = 102;
  const dropCapLines = 3;

  const text =
    `or years, I prided myself on being resilient. As a founder and a neuroscientist, I wore my capacity to endure like a badge of honor. I learned to push myself further, work longer hours, and absorb pressure without showing cracks. Each time I hit a wall, I adapted, trying to become tougher — until my body stopped cooperating.`;

  const prepared = prepareWithSegments(text, BODY_FONT);
  const widthFn = (y: number) => {
    const li = Math.round(y / LINE_HEIGHT);
    return li < dropCapLines ? fullWidth - dropCapWidth : fullWidth;
  };
  const xOffsetFn = (y: number) => {
    const li = Math.round(y / LINE_HEIGHT);
    return li < dropCapLines ? dropCapWidth : 0;
  };

  const finalY = flowLines(
    prepared, widthFn, xOffsetFn, 0, container,
    layoutNextLineRange, materializeLineRange
  );
  container.style.height = finalY + "px";
  container.classList.remove("loading");
}

async function renderFloat(
  prepareWithSegments: (t: string, f: string) => PreparedTextWithSegments,
  layoutNextLineRange: LayoutFn,
  materializeLineRange: MaterializeFn
) {
  const root = document.querySelector<HTMLElement>('[data-pretext="float"]');
  if (!root) return;
  const container = root.querySelector<HTMLElement>(".flow-text")!;
  const illo = root.querySelector<HTMLElement>(".illustration")!;
  const fullWidth = container.clientWidth;
  const gap = 24;

  const illoTop = illo.offsetTop;
  const illoBottom = illoTop + illo.offsetHeight + 40;
  const illoLeft = illo.offsetLeft;

  const text =
    `Psychologist George Bonanno, one of the leading researchers on resilience, has argued that resilience is not a fixed trait but a pattern of regulatory flexibility — the ability to choose different strategies depending on context. The paradox appears when resilience gets mistaken for a single strategy: to endure and keep going. This turns resilience into a rigid form of grit. In several studies, people with higher grit were more likely to persist at tasks that were objectively unwinnable. They played longer, invested more effort, and lost more money. The same quality that helps those people finish hard things also makes them slower to abandon unworkable ones. A similar misreading happens in how we interpret adversity. One of the most widely cited findings in psychology is a U-shaped curve: People who have experienced some adversity report better long-term well-being than those who've experienced none or a lot. This nuance is often flattened into a slogan — "what doesn't kill you makes you stronger" — which ignores the steep drop-off in well-being at high levels of adversity.`;

  const prepared = prepareWithSegments(text, BODY_FONT);
  const widthFn = (y: number) =>
    y >= illoTop && y < illoBottom ? illoLeft - gap : fullWidth;
  const xOffsetFn = (_y: number) => 0;

  const finalY = flowLines(
    prepared, widthFn, xOffsetFn, 0, container,
    layoutNextLineRange, materializeLineRange
  );
  container.style.height = Math.max(finalY, illoBottom) + "px";
  container.classList.remove("loading");
}

async function renderSilhouette(
  prepareWithSegments: (t: string, f: string) => PreparedTextWithSegments,
  layoutNextLineRange: LayoutFn,
  materializeLineRange: MaterializeFn
) {
  const root = document.querySelector<HTMLElement>('[data-pretext="silhouette"]');
  if (!root) return;
  const container = root.querySelector<HTMLElement>(".flow-text")!;
  const silEl = root.querySelector<HTMLElement>(".silhouette")!;
  const pullEl = root.querySelector<HTMLElement>(".pullquote-abs")!;
  const fullWidth = container.clientWidth;
  const gap = 20;

  const silLeft = silEl.offsetLeft;
  const silTop = silEl.offsetTop;
  const silWidth = silEl.offsetWidth;
  const silHeight = silEl.offsetHeight;

  // Prefer PNG alpha-sampling via data-img; fall back to SVG rasterization
  const pngSrc = silEl.getAttribute("data-img");
  const rightEdges = pngSrc
    ? await sampleImageRightEdge(pngSrc, silWidth, silHeight)
    : await sampleSilhouetteRightEdge(silEl.querySelector("svg")!, silWidth, silHeight);

  const pullLeft = pullEl.offsetLeft;
  const pullTop = pullEl.offsetTop;
  const pullBottom = pullTop + pullEl.offsetHeight;

  const text =
    `Resilience is not a virtue but a strategy, and like all strategies, it has some failure modes. Instead of applying it blindly and rigidly, here are five evidence-based ways to practice resilience without letting it backfire. Distinguish between challenges and traps. Challenges are temporary obstacles with clear pathways forward; traps are situations where more effort yields diminishing or negative returns. Before doubling down, ask: if I keep going like this, is the situation likely to improve? If the answer is no, being resilient in that situation is not strength — it's inertia. Monitor your body's veto power. Chronic fatigue, persistent anxiety, or recurring illness aren't signs you need more resilience; they're signs you need different strategies. Practice strategic quitting. Changing paths when costs outweigh benefits is a core component of emotional agility. Sometimes, the most resilient thing you can do is walk away. Separate your worth from your resilience. Your value isn't measured by how much you can bear. Look for systemic solutions. Sometimes, the most effective response to adversity is working to eliminate its source rather than learning to tolerate it better.`;

  const prepared = prepareWithSegments(text, BODY_FONT);

  const widthFn = (y: number) => {
    let left = 0;
    let right = fullWidth;

    if (y >= silTop && y < silTop + silHeight) {
      const re = rightEdges[Math.floor(y - silTop)] ?? 0;
      if (re > 0) left = silLeft + re + gap;
    }
    if (y >= pullTop - 10 && y < pullBottom) {
      right = pullLeft - gap;
    }
    return Math.max(0, right - left);
  };

  const xOffsetFn = (y: number) => {
    if (y >= silTop && y < silTop + silHeight) {
      const re = rightEdges[Math.floor(y - silTop)] ?? 0;
      if (re > 0) return silLeft + re + gap;
    }
    return 0;
  };

  const finalY = flowLines(
    prepared, widthFn, xOffsetFn, 0, container,
    layoutNextLineRange, materializeLineRange
  );
  container.style.height =
    Math.max(finalY, pullBottom + 20, silTop + silHeight) + "px";
  container.classList.remove("loading");
}

export default function PretextEngine() {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderAll() {
      document.querySelectorAll(".flow-text").forEach((el) => {
        (el as HTMLElement).innerHTML = "";
        el.classList.add("loading");
      });

      try {
        const {
          prepareWithSegments,
          layoutNextLineRange,
          materializeLineRange,
        } = await import("@chenglou/pretext");

        if (cancelled) return;
        await document.fonts.ready;
        if (cancelled) return;

        await renderOpening(prepareWithSegments, layoutNextLineRange, materializeLineRange);
        await renderFloat(prepareWithSegments, layoutNextLineRange, materializeLineRange);
        await renderSilhouette(prepareWithSegments, layoutNextLineRange, materializeLineRange);
      } catch (err) {
        console.error("Pretext render failed:", err);
        document.querySelectorAll(".a11y-fallback").forEach((el) => {
          const e = el as HTMLElement;
          e.style.position = "static";
          e.style.width = "auto";
          e.style.height = "auto";
          e.style.left = "auto";
        });
      }
    }

    renderAll();

    let timer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => renderAll(), 200);
    };
    window.addEventListener("resize", onResize);

    cleanupRef.current = () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      clearTimeout(timer);
    };
    return () => cleanupRef.current?.();
  }, []);

  return null;
}
