export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-label">This article is part of</div>
        <p className="sidebar-issue-text">
          Big Think&rsquo;s monthly issue on{" "}
          <a href="#">The Conscious Mind</a> &mdash; exploring what science
          and philosophy are learning about awareness, experience, and the
          self.
        </p>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-label">Stay curious</div>
        <p className="sidebar-nl-text">
          Get our best ideas, explainers, and long-reads delivered to your
          inbox every week.
        </p>
        <input
          className="sidebar-nl-input"
          type="email"
          placeholder="Your email address"
          aria-label="Email address"
        />
        <button className="sidebar-nl-btn">Subscribe Free</button>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-label">Topics</div>
        <div className="sidebar-tags">
          {[
            "Consciousness",
            "Neuroscience",
            "Philosophy of Mind",
            "Free Will",
            "Brain",
            "Entropy",
          ].map((tag) => (
            <a key={tag} href="#" className="sidebar-tag">
              {tag}
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
