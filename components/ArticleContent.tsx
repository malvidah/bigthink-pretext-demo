import Image from "next/image";
import PretextEngine from "./PretextEngine";

export default function ArticleContent() {
  return (
    <article className="article-main">
      {/* Article header */}
      <div className="article-rule" />
      <h1 className="article-headline">
        The resilience paradox: When pushing through makes things worse
      </h1>
      <p className="article-deck">
        When applied blindly, resilience can do real harm to our health and
        our ability to change broken systems.
      </p>
      <div className="article-byline">
        <span className="byline-line1">
          <span className="byline-by">by </span>
          <span className="byline-name">Anne-Laure Le Cunff</span>
        </span>
        <span className="byline-date">March 31, 2026</span>
      </div>

      {/* Hero image */}
      <div className="article-hero">
        <Image
          src="/images/squares.png"
          alt="A colorful grid of patterned squares — the fragmented geometry of resilience"
          width={700}
          height={700}
          style={{ width: "100%", height: "auto" }}
          className="article-hero-img"
          priority
        />
        <div className="article-hero-credit">Ana Kova</div>
      </div>

      {/* Key takeaways */}
      <div className="key-takeaways">
        <div className="key-takeaways-heading">Key Takeaways</div>
        <ul>
          <li>
            Resilience, when applied blindly, can do real harm to our health
            and our ability to change broken systems.
          </li>
          <li>
            True resilience is not about suffering longer, but about
            flexibility: the ability to rest, quit, adapt, or redirect effort
            when circumstances demand it.
          </li>
          <li>
            Resilience works best when treated as a situational strategy
            rather than a moral mandate to endure.
          </li>
        </ul>
      </div>

      <div className="article-body">

        {/* ───────────────── TREATMENT 1: Drop cap ───────────────── */}
        <div className="section-label">§ A badge of honor</div>
        <div className="pretext-opening" data-pretext="opening">
          <span className="treatment-marker">Treatment 1 · Drop cap + Pretext flow</span>
          <div className="dropcap" aria-hidden="true">F</div>
          <div className="flow-text loading" />
          <div className="a11y-fallback">
            <p>
              For years, I prided myself on being resilient. As a founder and
              a neuroscientist, I wore my capacity to endure like a badge of
              honor. I learned to push myself further, work longer hours, and
              absorb pressure without showing cracks. Each time I hit a wall,
              I adapted, trying to become tougher — until my body stopped
              cooperating.
            </p>
          </div>
        </div>

        <p>
          While working at Google, I developed a blood clot in my arm — a
          condition that, in someone my age at the time, doctors associated
          with chronic stress. It forced an uncomfortable question: What if my
          resilience wasn&rsquo;t protecting me, but delaying the moment I had
          to admit something was wrong?
        </p>

        <p>
          We tend to treat resilience as an unqualified good. We praise the
          quality in entrepreneurs, caregivers, students, and leaders.
          Resiliency has become a moral injunction — a signal of maturity and
          strength. But a growing body of research suggests that resilience,
          when applied blindly, can do real harm to our health and our ability
          to change broken systems.
        </p>

        {/* ───────────────── TREATMENT 2: Magazine float ───────────────── */}
        <div className="section-label">§ The resilience paradox</div>
        <div className="pretext-float" data-pretext="float">
          <span className="treatment-marker">Treatment 2 · Text flowing around floated illustration</span>

          <div className="illustration">
            <Image
              src="/images/triangle-flame.png"
              alt="An anatomical figure inside a triangle next to a speech bubble with flames — the paradox of burning through adversity"
              width={256}
              height={300}
              className="illustration-img"
            />
            <div className="caption">
              Illustration: The anatomy of burnout — when endurance becomes
              its own kind of harm.
            </div>
          </div>

          <div className="flow-text loading" />
          <div className="a11y-fallback">
            <p>
              Psychologist George Bonanno, one of the leading researchers on
              resilience, has argued that resilience is not a fixed trait but
              a pattern of regulatory flexibility — the ability to choose
              different strategies depending on context. The paradox appears
              when resilience gets mistaken for a single strategy: to endure
              and keep going. This turns resilience into a rigid form of grit.
              In several studies, people with higher grit were more likely to
              persist at tasks that were objectively unwinnable. They played
              longer, invested more effort, and lost more money. The same
              quality that helps those people finish hard things also makes
              them slower to abandon unworkable ones. A similar misreading
              happens in how we interpret adversity. One of the most widely
              cited findings in psychology is a U-shaped curve: People who
              have experienced some adversity report better long-term
              well-being than those who&rsquo;ve experienced none or a lot.
              This nuance is often flattened into a slogan — &ldquo;what
              doesn&rsquo;t kill you makes you stronger&rdquo; — which ignores
              the steep drop-off in well-being at high levels of adversity.
            </p>
          </div>
        </div>

        <p>
          Even more dangerous is when organizations take a descriptive finding
          and turn it into a prescription: Adversity is character-building.
          The data doesn&rsquo;t say that.
        </p>

        <p>
          At the physiological level, the costs of rigid grit can be severe.
          A systematic review of the evidence shows that, in contexts of
          chronic stress and limited control, this coping style is linked to
          worse cardiovascular outcomes. In systems that don&rsquo;t yield to
          sustained effort, blindly enduring leads to wear-and-tear.
        </p>

        <div className="pullquote">
          <p>
            Resilience stops being a positive when it keeps people tolerating
            what should be fixed.
          </p>
        </div>

        <p>
          Even our stories of growth can dangerously color our relationship to
          resilience. Research finds that self-reported post-traumatic growth
          is often exaggerated. Saying &ldquo;this made me stronger&rdquo; can
          help us function socially and emotionally in the short term, but it
          can also keep us from acknowledging our struggles. This is the
          resilience paradox: Resilience stops being a positive when it keeps
          people tolerating what should be fixed.
        </p>

        {/* ───────────────── TREATMENT 3: Silhouette wrap ───────────────── */}
        <div className="section-label">§ How to practice mindful resilience</div>
        <div className="pretext-silhouette" data-pretext="silhouette">
          <span className="treatment-marker">Treatment 3 · Text wrapping around silhouette + pullquote</span>

          {/* PNG silhouette — data-img tells PretextEngine where to sample alpha */}
          <div
            className="silhouette"
            data-img="/images/heads.png"
          >
            <Image
              src="/images/heads.png"
              alt="Two head silhouettes facing each other — inner resilience versus outer pressure"
              width={290}
              height={450}
              className="silhouette-img"
            />
          </div>

          <div className="flow-text loading" />

          <div className="pullquote-abs">
            <p>
              The most resilient people are not those who suffer quietly but
              those who adjust quickly.
            </p>
          </div>

          <div className="a11y-fallback">
            <p>
              Resilience is not a virtue but a strategy, and like all
              strategies, it has some failure modes. So, instead of applying
              it blindly and rigidly, here are five evidence-based ways to
              practice resilience without letting it backfire. First,
              distinguish between challenges and traps. Challenges are
              temporary obstacles with clear pathways forward; traps are
              situations where more effort yields diminishing or negative
              returns. Before doubling down, ask: if I keep going like this,
              is the situation likely to improve? Second, monitor your
              body&rsquo;s veto power. Chronic fatigue, persistent anxiety, or
              recurring illness aren&rsquo;t signs you need more resilience;
              they&rsquo;re signs you need different strategies. Third,
              practice strategic quitting. Changing paths when costs outweigh
              benefits is a core component of emotional agility. Fourth,
              separate your worth from your resilience. Your value
              isn&rsquo;t measured by how much you can bear. Fifth, look for
              systemic solutions. Sometimes, the most effective response to
              adversity is working to eliminate its source rather than
              learning to tolerate it better.
            </p>
          </div>
        </div>

        <p>
          Resilience is a powerful human capacity. But like any tool, it has
          a proper range of use. Beyond that range, it can become dangerous.
          That&rsquo;s why the most resilient people are not those who suffer
          quietly but those who adjust quickly: those who know when to rest,
          when to push, when to change course, and when to walk away.
        </p>

        <div className="article-footer-note">
          This article is part of Big Think&rsquo;s monthly issue{" "}
          <em>The Roots of Resilience</em>.
        </div>

        {/* Author block */}
        <div className="author-block">
          <div className="author-name">Anne-Laure Le Cunff</div>
          <div className="author-title">Neuroscientist and entrepreneur</div>
        </div>

      </div>

      <PretextEngine />
    </article>
  );
}
