export default function SiteHeader() {
  return (
    <header className="site-header">
      {/* Left: Search + Topics */}
      <div className="nav-left">
        <button className="nav-left-btn" aria-label="Search">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <circle cx="8.5" cy="8.5" r="5.5" />
            <path d="M13 13l3.5 3.5" strokeLinecap="round" />
          </svg>
          <span>Search</span>
        </button>
        <button className="nav-left-btn" aria-label="Topics">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path d="M3 5h14M3 10h14M3 15h8" strokeLinecap="round" />
          </svg>
          <span>Topics</span>
        </button>
      </div>

      {/* Center: Logo */}
      <div className="nav-center">
        <a href="#" className="site-logo" aria-label="Big Think">
          <span className="site-logo-box">Big</span>
          <span className="site-logo-box">Think</span>
        </a>
      </div>

      {/* Right: Nav links + auth */}
      <nav className="nav-right">
        <a href="#" className="nav-right-link">Latest</a>
        <a href="#" className="nav-right-link">Videos</a>
        <a href="#" className="nav-right-link">Columns</a>
        <a href="#" className="nav-right-link">Classes</a>
        <a href="#" className="nav-right-link">More</a>
        <a href="#" className="sign-in-link">Sign In</a>
        <a href="#" className="membership-btn">Membership</a>
      </nav>
    </header>
  );
}
