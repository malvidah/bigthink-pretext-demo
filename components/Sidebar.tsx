export default function Sidebar() {
  return (
    <aside className="sidebar">
      <p className="sidebar-issue-text">
        This article is part of Big Think&rsquo;s monthly issue on{" "}
        <a href="#"><em>The Roots of Resilience</em></a>.
      </p>

      <a href="#" className="sidebar-nl-link">
        Get the Big Think newsletter on Substack &rarr;
      </a>

      <div className="sidebar-tags">
        {[
          "Mind and Behavior",
          "Emotional Intelligence",
          "Psychology",
          "Adaptability",
          "Resilience",
        ].map((tag) => (
          <a key={tag} href="#" className="sidebar-tag">
            {tag}
          </a>
        ))}
      </div>
    </aside>
  );
}
