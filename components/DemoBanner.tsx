"use client";

export default function DemoBanner() {
  function toggleMarkers() {
    document.body.classList.toggle("show-markers");
  }

  return (
    <div className="demo-banner">
      <span className="demo-pill">Demo</span>
      <span className="demo-text">
        Pretext.js layout experiment · three treatments · Big Think article
      </span>
      <button onClick={toggleMarkers}>Toggle treatment labels</button>
    </div>
  );
}
