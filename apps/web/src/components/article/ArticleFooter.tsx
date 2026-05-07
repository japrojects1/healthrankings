import Link from "next/link";

export function ArticleFooter() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div>
            <Link href="/" className="logo">
              <div className="logo-tile">
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
                  <circle cx="11" cy="12" r="2" fill="#2563EB" />
                  <circle cx="21" cy="12" r="2" fill="#2563EB" />
                  <path
                    d="M 8 19 Q 16 26 24 19"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="logo-sparkle">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
                    <path d="M 6 0 L 7 4.5 L 12 6 L 7 7.5 L 6 12 L 5 7.5 L 0 6 L 5 4.5 Z" />
                  </svg>
                </div>
              </div>
              <div className="logo-text">
                <span className="one">health</span>
                <span className="two">rankings</span>
              </div>
            </Link>
            <p className="footer-brand-desc">
              Independent health and wellness platform — condition guides, lifestyle tips, product rankings,
              and wellness articles. Medically reviewed, never sponsored.
            </p>
          </div>
          <div className="footer-col">
            <h4>Conditions</h4>
            <ul>
              <li>
                <Link href="/healthrankings-hypertension.html">Heart health</Link>
              </li>
              <li>
                <Link href="/healthrankings-diabetes-ketone-monitors.html">Diabetes</Link>
              </li>
              <li>
                <Link href="/healthrankings-sleep-apnea.html">Sleep</Link>
              </li>
              <li>
                <Link href="/healthrankings-articles.html">View all</Link>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Devices</h4>
            <ul>
              <li>
                <Link href="/healthrankings-all-blood-pressure-monitors.html">Blood pressure</Link>
              </li>
              <li>
                <Link href="/healthrankings-all-body-composition-monitors.html">Smart scales</Link>
              </li>
              <li>
                <Link href="/healthrankings-devices.html">View all</Link>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>About</h4>
            <ul>
              <li>
                <Link href="/healthrankings-about.html">About us</Link>
              </li>
              <li>
                <Link href="/healthrankings-contact.html">Contact</Link>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Explore</h4>
            <ul>
              <li>
                <Link href="/healthrankings-articles.html">Articles</Link>
              </li>
              <li>
                <Link href="/healthrankings-news.html">Health News</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} HealthRankings</span>
          <span>
            <Link href="/healthrankings-privacy-policy.html">Privacy</Link>
            {" · "}
            <Link href="/healthrankings-terms-of-service.html">Terms</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
