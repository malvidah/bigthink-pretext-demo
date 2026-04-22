import PretextEngine from "./PretextEngine";

const StormSVG = () => (
  <svg viewBox="0 0 280 340" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="storm" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stopColor="#b5341f" stopOpacity="0.85" />
        <stop offset="40%" stopColor="#6b2a1a" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#1a1a1a" stopOpacity="0.95" />
      </radialGradient>
      <filter id="noise">
        <feTurbulence baseFrequency="0.9" numOctaves={2} seed={3} />
        <feColorMatrix values="0 0 0 0 0.1  0 0 0 0 0.1  0 0 0 0 0.1  0 0 0 0.08 0" />
      </filter>
    </defs>
    <ellipse cx="140" cy="150" rx="130" ry="110" fill="url(#storm)" />
    <g stroke="#fafaf7" strokeWidth="1.5" fill="none" opacity="0.9">
      <path d="M 140,60 L 132,95 L 148,100 L 125,145 L 150,150 L 118,210 L 145,215 L 110,280" />
      <path d="M 130,145 L 105,175 M 148,100 L 175,120 M 145,215 L 170,240" />
      <path d="M 148,195 L 168,210 M 118,210 L 95,230" />
    </g>
    <g fill="#fafaf7" opacity="0.6">
      <circle cx="60" cy="80" r="1.5" />
      <circle cx="220" cy="95" r="1" />
      <circle cx="85" cy="220" r="1" />
      <circle cx="200" cy="240" r="1.5" />
      <circle cx="50" cy="160" r="1" />
      <circle cx="235" cy="180" r="1" />
      <circle cx="75" cy="290" r="1.5" />
      <circle cx="210" cy="300" r="1" />
      <circle cx="140" cy="40" r="1" />
      <circle cx="165" cy="75" r="1" />
      <circle cx="105" cy="110" r="1" />
      <circle cx="190" cy="165" r="1.5" />
    </g>
    <rect width="280" height="320" filter="url(#noise)" opacity="0.5" />
  </svg>
);

const SilhouetteSVG = () => (
  <svg viewBox="0 0 340 480" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M 60 40 Q 80 20 140 18 Q 210 20 240 55 Q 270 85 270 140 Q 270 175 260 200 Q 268 215 270 235 Q 272 255 260 270 Q 255 285 260 300 Q 258 325 240 340 Q 230 360 235 385 Q 235 410 210 420 Q 170 430 135 425 Q 110 422 95 405 Q 85 385 90 360 Q 85 340 75 325 Q 55 300 55 265 Q 48 235 50 200 Q 40 170 45 130 Q 48 80 60 40 Z"
      fill="#111111"
    />
    <g stroke="#ffffff" strokeWidth="1" fill="none" opacity="0.25">
      <circle cx="150" cy="120" r="18" />
      <circle cx="150" cy="120" r="30" />
      <circle cx="180" cy="180" r="14" />
      <circle cx="180" cy="180" r="24" />
      <circle cx="130" cy="240" r="12" />
      <circle cx="200" cy="280" r="20" />
      <circle cx="160" cy="340" r="15" />
    </g>
    <g fill="#ffffff" opacity="0.7">
      <circle cx="150" cy="120" r="3" />
      <circle cx="180" cy="180" r="2.5" />
      <circle cx="130" cy="240" r="2" />
      <circle cx="200" cy="280" r="3" />
      <circle cx="160" cy="340" r="2.5" />
    </g>
  </svg>
);

export default function ArticleContent() {
  return (
    <article className="article-main">
      {/* Article header */}
      <div className="article-eyebrow">Mind &amp; Behavior · Consciousness</div>
      <div className="article-rule" />
      <h1 className="article-headline">
        Consciousness may be more than the brain&rsquo;s output &mdash; it may
        be an input, too
      </h1>
      <p className="article-deck">
        A new framework suggests that bursts of neural chaos could be the
        fingerprints of a conscious mind at work.
      </p>
      <div className="article-byline">
        <span className="byline-line1">
          <span className="byline-by">by </span>
          <span className="byline-name">Ross Pomeroy</span>
        </span>
        <span className="byline-date">April 2025 · 9 min read</span>
      </div>

      {/* Key takeaways */}
      <div className="key-takeaways">
        <div className="key-takeaways-heading">Key Takeaways</div>
        <ul>
          <li>
            The &ldquo;hard problem&rdquo; of consciousness asks why physical
            brain processes give rise to subjective experience — a gap modern
            neuroscience has yet to close.
          </li>
          <li>
            Neural entropy — a measure of brain-signal unpredictability — rises
            with conscious states and falls with anesthesia, pointing to a
            link between chaos and awareness.
          </li>
          <li>
            Irruption Theory proposes that these entropy spikes are not just
            correlates of consciousness but its causal fingerprints: evidence
            that mind acts on matter, not only the reverse.
          </li>
        </ul>
      </div>

      <div className="article-body">
        {/* ───────────────── TREATMENT 1 ───────────────── */}
        <div className="section-label">§ The explanatory gap</div>
        <div className="pretext-opening" data-pretext="opening">
          <span className="treatment-marker">Treatment 1 · Drop cap + Pretext flow</span>
          <div className="dropcap" aria-hidden="true">F</div>
          <div className="flow-text loading" />
          <div className="a11y-fallback">
            <p>
              For centuries, philosophers and scientists have grappled with what
              contemporary thinkers like Joseph Levine and David Chalmers call
              the &ldquo;explanatory gap&rdquo; or the &ldquo;hard
              problem&rdquo; of consciousness. At least on the surface, there
              seems to be a categorical difference between descriptions of the
              material and descriptions of the mind. In spite of this gap,
              modern neuroscience has made significant progress mapping the
              neural correlates of consciousness — identifying patterns and brain
              regions that reliably track specific conscious states. But
              correlation, as we know, is not explanation.
            </p>
          </div>
        </div>

        <p>
          Contemporary theories of consciousness generally attempt to bridge this
          gap by equating consciousness with some measurable, physical property
          of the brain. One promising frontier comes from examining informational
          entropy in the brain. First defined by Claude Shannon in 1948,
          informational entropy provides a mathematical way of measuring the
          uncertainty or unpredictability of information.
        </p>

        <p>
          Originally developed to improve telecommunications, Shannon entropy has
          since been applied to neural signals, where it provides a measure of
          the variability of neural activity across scales — from single neurons
          all the way up to brain networks. Heightened levels of neural entropy
          at the whole-brain level could be thought of as an unforeseen tropical
          thunderstorm rolling through the brain, indicating a richer, more
          chaotic, unpredictable state of neural activity.
        </p>

        {/* ───────────────── TREATMENT 2 ───────────────── */}
        <div className="section-label">§ The entropic brain</div>
        <div className="pretext-float" data-pretext="float">
          <span className="treatment-marker">Treatment 2 · Text flowing around floated illustration</span>

          <div className="illustration">
            <StormSVG />
            <div className="caption">
              Illustration: Neural entropy as informational weather — an
              unforeseen thunderstorm of chaotic signal rolling through the
              brain.
            </div>
          </div>

          <div className="flow-text loading" />
          <div className="a11y-fallback">
            <p>
              Applying information-theoretic measures like entropy to the study
              of consciousness isn&rsquo;t new. In the 1990s, neuroscientists
              Giulio Tononi and Gerald Edelman used Shannon entropy as part of
              the foundation for their Integrated Information Theory of
              consciousness, which argues that consciousness is analogous to the
              integration and complexity of neural signals. More recently, Robin
              Carhart-Harris proposed the Entropic Brain Hypothesis, showing
              that altered states of consciousness — from deep anesthesia to
              dreaming to psychedelic experiences — can be mapped to varying
              levels of neural entropy. Psychedelic states, for instance, are
              associated with high entropy, while deep anesthesia is marked by
              unusually low entropy. A new framework, however, takes a different
              perspective entirely: that punctuated spikes of neural entropy may
              not just reflect levels of consciousness but may actually be signs
              of consciousness exerting causal influence on the brain itself.
              This idea inverts a century of assumptions.
            </p>
          </div>
        </div>

        <p>
          This idea is known as Irruption Theory, developed by Tom Froese, a
          cognitive scientist at the Okinawa Institute of Science and Technology.
          Drawing on a number of contemporary neuroscientific studies, Froese
          points out that when we exert conscious effort — for example, when
          we&rsquo;re trying to discern a feature of our environment, solve a
          pressing problem, or summon creativity — the brain shows measurable
          bursts of entropy that cannot be completely explained by physical,
          deterministic neural mechanisms alone.
        </p>

        <p>
          &ldquo;Cognitive effort, motor effort, effort of all kinds are
          associated with increased entropy production in the brain,&rdquo;
          Froese says. &ldquo;And so it&rsquo;s already standard practice in a
          way to use both thermodynamic measures and information theoretic
          measures of entropy as signatures of mental work.&rdquo;
        </p>

        {/* ───────────────── TREATMENT 3 ───────────────── */}
        <div className="section-label">§ Irruption theory</div>
        <div className="pretext-silhouette" data-pretext="silhouette">
          <span className="treatment-marker">Treatment 3 · Text wrapping around silhouette + pullquote</span>

          <div className="silhouette">
            <SilhouetteSVG />
          </div>

          <div className="flow-text loading" />

          <div className="pullquote-abs">
            <p>
              The brain shows bursts of entropy that cannot be explained by
              deterministic mechanisms alone.
            </p>
          </div>

          <div className="a11y-fallback">
            <p>
              Instead of just seeing this rise in neural entropy as a result of
              increased heat due to brain metabolism, or as a result of not
              capturing all of the physical variables at play in the brain,
              Irruption Theory proposes that these entropy spikes are the
              signatures of consciousness acting upon the brain — not merely
              being produced by it. The framework doesn&rsquo;t abandon
              materialism so much as extend it: if conscious effort leaves a
              measurable thermodynamic footprint, then consciousness has a kind
              of causal traction on physical matter. It&rsquo;s a profoundly
              strange claim, but one that Froese argues follows from the data.
            </p>
          </div>
        </div>

        <p>
          The implications of Irruption Theory ripple outward. If conscious
          effort genuinely introduces unpredictability into neural dynamics, then
          the long-standing debate about free will takes on a new empirical
          dimension. It doesn&rsquo;t prove libertarian free will on its own,
          but it does suggest that the brain is not a closed deterministic
          system — that something about conscious experience pushes back against
          the physics of the neurons.
        </p>

        <div className="pullquote">
          <p>
            If consciousness is merely the brain&rsquo;s output, entropy should
            correlate with activity but never exceed what determinism predicts.
            If consciousness is also an input, the excess is its fingerprint.
          </p>
        </div>

        <p>
          Whether Irruption Theory survives scrutiny is a separate question.
          Critics point out that attributing entropy spikes to consciousness
          rather than to unmeasured physical variables is a strong claim
          requiring strong evidence. But as a framework, it points toward a
          testable difference: if consciousness is merely the brain&rsquo;s
          output, entropy should correlate with activity but never exceed what
          determinism predicts. If consciousness is also an input, the excess is
          its fingerprint.
        </p>

        <p>
          For now, the neural thunderstorm keeps rolling. What we call it —
          noise, signal, or the irruption of mind into matter — may depend on
          the framework we bring to the data. And that, perhaps, is a reminder
          that the hard problem hasn&rsquo;t been solved so much as relocated:
          from the seam between mind and matter to the edges of what our
          instruments can measure.
        </p>
      </div>

      {/* Pretext runs after mount */}
      <PretextEngine />
    </article>
  );
}
