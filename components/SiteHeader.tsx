import Image from "next/image";

export default function SiteHeader() {
  return (
    <header className="site-header">
      {/* Logo */}
      <a href="#" className="site-logo" aria-label="Big Think">
        <Image
          src="/images/btlogo.png"
          alt="Big Think"
          width={120}
          height={36}
          className="site-logo-img"
          priority
        />
      </a>

      {/* Left cluster: Search + Topics */}
      <div className="nav-left">
        <button className="nav-left-btn" aria-label="Search">
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
            <circle cx="7.5" cy="7.5" r="5" />
            <path d="M12 12l3.5 3.5" strokeLinecap="round" />
          </svg>
          <span>Search</span>
          <Chevron />
        </button>
        <button className="nav-left-btn" aria-label="Topics">
          <svg viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
            <path d="M0 1h18M0 7h18M0 13h10" strokeLinecap="round" />
          </svg>
          <span>Topics</span>
          <Chevron />
        </button>
      </div>

      {/* Spacer */}
      <div className="nav-spacer" />

      {/* Right cluster: main nav links */}
      <nav className="nav-right">
        <a href="#" className="nav-right-link">Latest</a>
        <a href="#" className="nav-right-link nav-dropdown">Videos <Chevron /></a>
        <a href="#" className="nav-right-link nav-dropdown">Columns <Chevron /></a>
        <a href="#" className="nav-right-link nav-dropdown">Classes <Chevron /></a>
        <a href="#" className="nav-right-link nav-dropdown">More <Chevron /></a>
      </nav>

      {/* Auth */}
      <div className="nav-auth">
        <a href="#" className="sign-in-link">Sign In</a>
        <a href="#" className="membership-btn">Membership</a>
      </div>
    </header>
  );
}

function Chevron() {
  return (
    <svg
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: "inline-block", verticalAlign: "middle", marginTop: "-1px" }}
    >
      <path d="M1 1l4 4 4-4" />
    </svg>
  );
}
