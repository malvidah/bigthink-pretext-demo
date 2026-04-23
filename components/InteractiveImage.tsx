"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";

type Transform = { x: number; y: number; w: number; h: number; rot: number };
type Handle =
  | "body"
  | "nw" | "ne" | "se" | "sw"
  | "rot-nw" | "rot-ne" | "rot-se" | "rot-sw";

interface Props {
  dataImg: string;
  src: string;
  alt: string;
  imgWidth: number;
  imgHeight: number;
  extraClass?: string;
}

// Saved layout fetched once per page load.
type SavedEntry = { fx: number; fy: number; fw: number; fh: number; rot: number };
let savedLayoutPromise: Promise<Record<string, SavedEntry>> | null = null;
function getSavedLayout(): Promise<Record<string, SavedEntry>> {
  if (!savedLayoutPromise) {
    savedLayoutPromise = fetch("/api/layout", { cache: "no-store" })
      .then(r => r.ok ? r.json() : {})
      .catch(() => ({}));
  }
  return savedLayoutPromise;
}

// Normalized (0..1) bounding box of non-transparent pixels for a given image src.
const contentBoxCache = new Map<string, Promise<{ left: number; top: number; right: number; bottom: number }>>();

function getContentBox(src: string) {
  const cached = contentBoxCache.get(src);
  if (cached) return cached;
  const promise = (async () => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.src = src;
    await image.decode();
    const maxDim = 240;
    const aspect = image.naturalWidth / image.naturalHeight;
    const w = aspect >= 1 ? maxDim : Math.max(64, Math.round(maxDim * aspect));
    const h = aspect >= 1 ? Math.max(64, Math.round(maxDim / aspect)) : maxDim;
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    let l = w, t = h, r = 0, b = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3]! > 16) {
          if (x < l) l = x;
          if (x > r) r = x;
          if (y < t) t = y;
          if (y > b) b = y;
        }
      }
    }
    return { left: l / w, top: t / h, right: (r + 1) / w, bottom: (b + 1) / h };
  })();
  contentBoxCache.set(src, promise);
  return promise;
}

export default function InteractiveImage({ dataImg, src, alt, imgWidth, imgHeight, extraClass }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const tRef = useRef<Transform | null>(null);
  const fracRef = useRef<{ fx: number; fy: number; fw: number; fh: number } | null>(null);
  const hasInit = useRef(false);
  const dragRef = useRef<{ handle: Handle; sx: number; sy: number; t0: Transform; startAngle: number } | null>(null);
  const [selected, setSelected] = useState(false);
  const [contentBox, setContentBox] = useState<{ left: number; top: number; right: number; bottom: number } | null>(null);
  const [layoutReady, setLayoutReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getContentBox(src).then(box => { if (!cancelled) setContentBox(box); }).catch(() => {});
    return () => { cancelled = true; };
  }, [src]);

  // Apply saved layout (from /api/layout) on mount, if present for this image.
  useEffect(() => {
    let cancelled = false;
    getSavedLayout().then(layout => {
      if (cancelled) return;
      const entry = layout[dataImg];
      const el = ref.current;
      const parent = el?.offsetParent as HTMLElement | null;
      if (entry && el && parent) {
        apply({
          x: entry.fx * parent.offsetWidth,
          y: entry.fy * parent.offsetHeight,
          w: entry.fw * parent.offsetWidth,
          h: entry.fh * parent.offsetHeight,
          rot: entry.rot,
        });
      }
      setLayoutReady(true);
    });
    return () => { cancelled = true; };
  }, [dataImg]);

  const apply = (t: Transform) => {
    const el = ref.current;
    if (!el) return;
    const parent = el.offsetParent as HTMLElement | null;
    if (parent) {
      fracRef.current = {
        fx: t.x / parent.offsetWidth,
        fy: t.y / parent.offsetHeight,
        fw: t.w / parent.offsetWidth,
        fh: t.h / parent.offsetHeight,
      };
    }
    el.style.position = "absolute";
    el.style.left = t.x + "px";
    el.style.top = t.y + "px";
    el.style.right = "auto";
    el.style.bottom = "auto";
    el.style.width = t.w + "px";
    el.style.height = t.h + "px";
    el.style.transform = t.rot ? `rotate(${t.rot}deg)` : "";
    el.style.transformOrigin = "center center";
    el.style.zIndex = "2";
    tRef.current = t;
    window.dispatchEvent(new CustomEvent("pretext-reflow"));
  };

  // On resize, rescale pixel positions proportionally so images stay in place
  useEffect(() => {
    const handleResize = () => {
      if (!fracRef.current || !tRef.current) return;
      const el = ref.current;
      const parent = el?.offsetParent as HTMLElement | null;
      if (!el || !parent) return;
      const f = fracRef.current;
      apply({
        x: f.fx * parent.offsetWidth,
        y: f.fy * parent.offsetHeight,
        w: f.fw * parent.offsetWidth,
        h: f.fh * parent.offsetHeight,
        rot: tRef.current.rot,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Capture CSS-rendered position on first interaction so layout is fully stable
  const initTransform = () => {
    if (tRef.current) return;
    hasInit.current = true;
    const el = ref.current!;
    apply({
      x: el.offsetLeft,
      y: el.offsetTop,
      w: el.offsetWidth,
      h: el.offsetHeight,
      rot: 0,
    });
  };

  // Dismiss selection on outside click
  useEffect(() => {
    if (!selected) return;
    const out = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setSelected(false);
    };
    window.addEventListener("mousedown", out, true);
    return () => window.removeEventListener("mousedown", out, true);
  }, [selected]);

  const startDrag = (handle: Handle, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelected(true);
    initTransform();
    const t0 = tRef.current;
    if (!t0) return;
    const parent0 = ref.current?.offsetParent as HTMLElement | null;
    const pr0 = parent0?.getBoundingClientRect();
    const cx0 = (pr0?.left ?? 0) + t0.x + t0.w / 2;
    const cy0 = (pr0?.top ?? 0) + t0.y + t0.h / 2;
    const startAngle = Math.atan2(e.clientY - cy0, e.clientX - cx0);
    dragRef.current = { handle, sx: e.clientX, sy: e.clientY, t0: { ...t0 }, startAngle };

    const move = (ev: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const dxScreen = ev.clientX - d.sx;
      const dyScreen = ev.clientY - d.sy;
      const s = d.t0;
      const rad = (s.rot * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      // Local (unrotated) delta — used for resize so handles track the image in its own frame.
      const dxLocal = dxScreen * cos + dyScreen * sin;
      const dyLocal = -dxScreen * sin + dyScreen * cos;
      let next: Transform;
      const applyResize = (newW: number, newH: number, anchorLx: number, anchorLy: number) => {
        // Keep the anchor corner (in local coords relative to original center) fixed in screen space.
        const oldCx = s.x + s.w / 2;
        const oldCy = s.y + s.h / 2;
        const anchorScreenX = oldCx + anchorLx * cos - anchorLy * sin;
        const anchorScreenY = oldCy + anchorLx * sin + anchorLy * cos;
        // New anchor local coords are the same fraction of new size.
        const newAnchorLx = anchorLx < 0 ? -newW / 2 : newW / 2;
        const newAnchorLy = anchorLy < 0 ? -newH / 2 : newH / 2;
        const newCx = anchorScreenX - (newAnchorLx * cos - newAnchorLy * sin);
        const newCy = anchorScreenY - (newAnchorLx * sin + newAnchorLy * cos);
        return { x: newCx - newW / 2, y: newCy - newH / 2, w: newW, h: newH, rot: s.rot };
      };
      switch (d.handle) {
        case "body":
          next = { ...s, x: s.x + dxScreen, y: s.y + dyScreen }; break;
        case "se": {
          const w = Math.max(40, s.w + dxLocal);
          const h = Math.max(30, s.h + dyLocal);
          next = applyResize(w, h, -s.w / 2, -s.h / 2); break;
        }
        case "sw": {
          const w = Math.max(40, s.w - dxLocal);
          const h = Math.max(30, s.h + dyLocal);
          next = applyResize(w, h, s.w / 2, -s.h / 2); break;
        }
        case "ne": {
          // Proportional resize: scale from the SW (anchor) corner, keeping aspect ratio.
          const aspect = s.w / s.h;
          const scale = Math.max(40 / s.w, 1 + (dxLocal - dyLocal) / (s.w + s.h));
          const w = s.w * scale;
          const h = w / aspect;
          next = applyResize(w, h, -s.w / 2, s.h / 2); break;
        }
        case "nw": {
          const w = Math.max(40, s.w - dxLocal);
          const h = Math.max(30, s.h - dyLocal);
          next = applyResize(w, h, s.w / 2, s.h / 2); break;
        }
        case "rot-nw": case "rot-ne": case "rot-se": case "rot-sw": {
          const parent = ref.current?.offsetParent as HTMLElement | null;
          const pr = parent?.getBoundingClientRect();
          const cx = (pr?.left ?? 0) + s.x + s.w / 2;
          const cy = (pr?.top ?? 0) + s.y + s.h / 2;
          const currentAngle = Math.atan2(ev.clientY - cy, ev.clientX - cx);
          const delta = (currentAngle - d.startAngle) * (180 / Math.PI);
          next = { ...s, rot: s.rot + delta };
          break;
        }
        default: return;
      }
      apply(next);
    };

    const up = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  // Style prop only manages cursor and initial visibility.
  const style: React.CSSProperties = {
    cursor: selected ? "grab" : "default",
    visibility: layoutReady ? "visible" : "hidden",
  };

  return (
    <div
      ref={ref}
      className={`interactive-img spread-image${extraClass ? ` ${extraClass}` : ""}${selected ? " interactive-img--selected" : ""}`}
      data-img={dataImg}
      onMouseDown={(e) => startDrag("body", e)}
      style={style}
    >
      <Image
        src={src}
        alt={alt}
        width={imgWidth}
        height={imgHeight}
        style={{ width: "100%", height: "100%", display: "block", objectFit: "contain" }}
        draggable={false}
      />
      {selected && (() => {
        const box = contentBox ?? { left: 0, top: 0, right: 1, bottom: 1 };
        const topPct = `${box.top * 100}%`;
        const rightPct = `${(1 - box.right) * 100}%`;
        const glass: React.CSSProperties = {
          backdropFilter: "blur(16px) saturate(180%) brightness(1.05)",
          WebkitBackdropFilter: "blur(16px) saturate(180%) brightness(1.05)",
        };
        return (
          <>
            <div
              className="img-handle img-resize"
              style={{ ...glass, top: `calc(${topPct} + 8px)`, right: `calc(${rightPct} + 8px)` }}
              onMouseDown={(e) => startDrag("ne", e)}
              aria-label="Resize"
            >
              <svg viewBox="0 0 16 16" width={14} height={14} aria-hidden>
                <path d="M3 10 L3 13 L6 13 M10 3 L13 3 L13 6 M3 13 L13 3" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div
              className="img-handle img-rotate"
              style={{ ...glass, top: `calc(${topPct} + 8px)`, right: `calc(${rightPct} + 44px)` }}
              onMouseDown={(e) => startDrag("rot-ne", e)}
              aria-label="Rotate"
            >
              <svg viewBox="0 0 16 16" width={14} height={14} aria-hidden>
                <path d="M13 8 A5 5 0 1 1 8 3" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                <path d="M8 1.5 L8 4.5 L11 3" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </>
        );
      })()}
    </div>
  );
}
