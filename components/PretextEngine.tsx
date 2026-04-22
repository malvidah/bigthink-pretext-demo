"use client";

import { useEffect, useRef } from "react";
import type {
  PreparedTextWithSegments,
  LayoutCursor,
  LayoutLineRange,
} from "@chenglou/pretext";

const BODY_FONT = "500 19px 'Source Serif 4', Georgia, serif";
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

async function sampleSilhouetteRightEdge(
  svgEl: SVGElement,
  width: number,
  height: number
): Promise<number[]> {
  const svgString = new XMLSerializer().serializeToString(svgEl);
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.src = url;
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = rej;
  });

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(url);

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
    `or centuries, philosophers and scientists have grappled with what contemporary thinkers like Joseph Levine and David Chalmers call the "explanatory gap" or the "hard problem" of consciousness. At least on the surface, there seems to be a categorical difference between descriptions of the material and descriptions of the mind. In spite of this gap, modern neuroscience has made significant progress mapping the neural correlates of consciousness — identifying patterns and brain regions that reliably track specific conscious states. But correlation, as we know, is not explanation.`;

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
    `Applying information-theoretic measures like entropy to the study of consciousness isn't new. In the 1990s, neuroscientists Giulio Tononi and Gerald Edelman used Shannon entropy as part of the foundation for their Integrated Information Theory of consciousness, which argues that consciousness is analogous to the integration and complexity of neural signals. More recently, Robin Carhart-Harris proposed the Entropic Brain Hypothesis, showing that altered states of consciousness — from deep anesthesia to dreaming to psychedelic experiences — can be mapped to varying levels of neural entropy. Psychedelic states, for instance, are associated with high entropy, while deep anesthesia is marked by unusually low entropy. A new framework, however, takes a different perspective entirely: that punctuated spikes of neural entropy may not just reflect levels of consciousness but may actually be signs of consciousness exerting causal influence on the brain itself. This idea inverts a century of assumptions.`;

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
  const svgEl = silEl.querySelector("svg")!;
  const rightEdges = await sampleSilhouetteRightEdge(svgEl, silWidth, silHeight);

  const pullLeft = pullEl.offsetLeft;
  const pullTop = pullEl.offsetTop;
  const pullBottom = pullTop + pullEl.offsetHeight;

  const text =
    `Instead of just seeing this rise in neural entropy as a result of increased heat due to brain metabolism, or as a result of not capturing all of the physical variables at play in the brain, Irruption Theory proposes that these entropy spikes are the signatures of consciousness acting upon the brain — not merely being produced by it. The framework doesn't abandon materialism so much as extend it: if conscious effort leaves a measurable thermodynamic footprint, then consciousness has a kind of causal traction on physical matter. It's a profoundly strange claim, but one that Froese argues follows from the data. Whether the theory survives falls to future experiments, but it reshapes what a positive result could even look like.`;

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
