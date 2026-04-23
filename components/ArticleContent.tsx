"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import PretextEngine from "./PretextEngine";
import InteractiveImage from "./InteractiveImage";

const TOTAL_PAGES = 3;

function readRotation(el: HTMLElement): number {
  const t = getComputedStyle(el).transform;
  if (!t || t === "none") return 0;
  const m = t.match(/matrix\(([-\d.eE+,\s]+)\)/);
  if (!m) return 0;
  const v = m[1].split(",").map(s => parseFloat(s.trim()));
  return Math.atan2(v[1] || 0, v[0] || 1) * (180 / Math.PI);
}

async function saveLayout() {
  const imgs = Array.from(document.querySelectorAll<HTMLElement>(".interactive-img"));
  const layout: Record<string, { fx: number; fy: number; fw: number; fh: number; rot: number }> = {};
  for (const el of imgs) {
    const dataImg = el.getAttribute("data-img");
    const parent = el.offsetParent as HTMLElement | null;
    if (!dataImg || !parent) continue;
    layout[dataImg] = {
      fx: el.offsetLeft / parent.offsetWidth,
      fy: el.offsetTop / parent.offsetHeight,
      fw: el.offsetWidth / parent.offsetWidth,
      fh: el.offsetHeight / parent.offsetHeight,
      rot: readRotation(el),
    };
  }
  try {
    const res = await fetch("/api/layout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(layout),
    });
    const ok = res.ok;
    const msg = document.createElement("div");
    msg.textContent = ok ? "Layout saved" : "Save failed";
    msg.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#111;color:#fff;padding:10px 18px;border-radius:6px;font:14px system-ui;z-index:9999;";
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 1800);
  } catch {
    // noop
  }
}

export default function ArticleContent() {
  const [page, setPage] = useState(0);

  const goTo = useCallback((n: number) => {
    setPage(Math.max(0, Math.min(TOTAL_PAGES - 1, n)));
  }, []);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!e.shiftKey) return;
      e.preventDefault();
      goTo(page + (e.deltaY > 0 ? 1 : -1));
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [page, goTo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goTo(page + 1);
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goTo(page - 1);
      if (e.shiftKey && (e.key === "S" || e.key === "s")) {
        e.preventDefault();
        saveLayout();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [page, goTo]);

  return (
    <div className="paged-article">

      <div className="pages-strip" style={{ transform: `translateX(calc(-${page} * 100%))` }}>

        {/* ── PAGE 0: Opening magazine spread ────────────────────────────── */}
        {/* Left col: cover image + title/byline. Right col: article opening. */}
        <div className="page page-spread">
          <div className="spread">

            {/* Left: cover — title/image/dropcap are obstacles the flow wraps around */}
            <div className="spread-col cover-col" data-text="opening">
              <div className="cover-image-wrap" data-flow-obstacle>
                <Image
                  src="/images/resiliencecover.png"
                  alt="The Roots of Resilience — Big Think monthly issue cover"
                  fill
                  style={{ objectFit: "cover", objectPosition: "center top" }}
                  priority
                />
              </div>
              <div className="cover-text-block" data-flow-obstacle>
                <div className="cover-rule" />
                <h1 className="cover-headline">
                  The resilience paradox: When pushing through makes things worse
                </h1>
                <p className="cover-deck">
                  When applied blindly, resilience can do real harm to our health
                  and our ability to change broken systems.
                </p>
                <div className="cover-byline">
                  <span className="byline-by">by </span>
                  <span className="byline-name">Anne-Laure Le Cunff</span>
                  <span className="byline-sep"> · </span>
                  <span className="byline-date">March 31, 2026</span>
                </div>
              </div>
              <div className="dropcap" aria-hidden="true" data-flow-obstacle>F</div>
              <div className="flow-text loading" />
              <div className="a11y-fallback">
                <p>For years, I prided myself on being resilient…</p>
              </div>
            </div>

            {/* Right: continuation of article */}
            <div className="spread-col" data-text="opening-cont">
              <div className="flow-text loading" />
            </div>

          </div>

          {/* Floating image — triangle-flame, starts in right col */}
          <InteractiveImage
            dataImg="/images/triangle-flame.png"
            src="/images/triangle-flame.png"
            alt="An anatomical figure inside a triangle next to a speech bubble with flames"
            imgWidth={556}
            imgHeight={415}
            extraClass="img-flame"
          />
        </div>

        {/* ── PAGE 1: Middle spread ──────────────────────────────────────── */}
        <div className="page page-spread">
          <div className="spread">

            <div className="spread-col" data-text="mid-left">
              <div className="flow-text loading" />
              <div className="a11y-fallback">
                <p>While working at Google…</p>
              </div>
            </div>

            <div className="spread-col" data-text="mid-right">
              <div className="flow-text loading" />
              <div className="a11y-fallback">
                <p>This turns resilience into a rigid form of grit…</p>
              </div>
            </div>

          </div>

          {/* Floating images — juggler across the gutter, heads in right col */}
          <InteractiveImage
            dataImg="/images/juggler.png"
            src="/images/juggler.png"
            alt="A juggler in motion, illustrated"
            imgWidth={1691}
            imgHeight={502}
            extraClass="img-juggler"
          />
          <InteractiveImage
            dataImg="/images/heads.png"
            src="/images/heads.png"
            alt="Two head silhouettes facing each other"
            imgWidth={607}
            imgHeight={381}
            extraClass="img-heads"
          />
        </div>

        {/* ── PAGE 2: End + Takeaways ────────────────────────────────────── */}
        <div className="page page-spread">
          <div className="spread">

            <div className="spread-col" data-text="end">
              <div className="flow-text loading" />
              <div className="a11y-fallback">
                <p>Resilience is not a virtue but a strategy…</p>
              </div>
            </div>

            <div className="spread-col key-takeaways-col">
              <div className="key-takeaways">
                <div className="key-takeaways-heading">Key Takeaways</div>
                <ul>
                  <li>Resilience, when applied blindly, can do real harm to our health and our ability to change broken systems.</li>
                  <li>True resilience is not about suffering longer, but about flexibility: the ability to rest, quit, adapt, or redirect effort when circumstances demand it.</li>
                  <li>Resilience works best when treated as a situational strategy rather than a moral mandate to endure.</li>
                </ul>
              </div>
              <div className="author-block">
                <div className="author-name">Anne-Laure Le Cunff</div>
                <div className="author-title">Neuroscientist and entrepreneur</div>
              </div>
            </div>

          </div>

          {/* Floating image — squares */}
          <InteractiveImage
            dataImg="/images/squares.png"
            src="/images/squares.png"
            alt="Geometric squares illustration"
            imgWidth={386}
            imgHeight={376}
            extraClass="img-squares"
          />
        </div>

      </div>{/* end .pages-strip */}

      {/* Prev / Next chevrons */}
      {page > 0 && (
        <button className="page-nav page-nav-prev" onClick={() => goTo(page - 1)}>‹</button>
      )}
      {page < TOTAL_PAGES - 1 && (
        <button className="page-nav page-nav-next" onClick={() => goTo(page + 1)}>›</button>
      )}

      {/* Page dots */}
      <div className="page-dots">
        {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
          <button
            key={i}
            className={`page-dot${i === page ? " page-dot--active" : ""}`}
            onClick={() => goTo(i)}
            aria-label={`Go to page ${i + 1}`}
          />
        ))}
      </div>

      <PretextEngine />
    </div>
  );
}
