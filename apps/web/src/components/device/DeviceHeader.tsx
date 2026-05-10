"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * Matches legacy healthrankings-review-*.html header (nav order + blue “rankings” word).
 */
export function DeviceHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <Link href="/" className="logo">
            <div className="logo-tile">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden>
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
                <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
                  <path d="M 6 0 L 7 4.5 L 12 6 L 7 7.5 L 6 12 L 5 7.5 L 0 6 L 5 4.5 Z" />
                </svg>
              </div>
            </div>
            <div className="logo-text">
              <span className="one">health</span>
              <span className="two">rankings</span>
            </div>
          </Link>
          <nav className="nav">
            <Link href="/healthrankings-conditions.html">Conditions</Link>
            <Link href="/healthrankings-devices.html" className="active">
              Devices
            </Link>
            <Link href="/healthrankings-drugs.html">Drugs A–Z</Link>
            <Link href="/healthrankings-articles.html">Articles</Link>
            <Link href="/healthrankings-news.html">Health News</Link>
            <Link href="/healthrankings-about.html">About</Link>
          </nav>
          <div className="header-actions">
            <button
              type="button"
              className="hamburger-btn"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <span />
              <span />
              <span />
            </button>
            <button type="button" className="cta-btn">
              Get started
            </button>
          </div>
        </div>
      </header>
      <button
        type="button"
        className={`mobile-overlay${open ? " open" : ""}`}
        aria-label="Close menu"
        onClick={() => setOpen(false)}
      />
      <div className={`mobile-drawer${open ? " open" : ""}`}>
        <div className="mobile-drawer-header">
          <div style={{ fontFamily: "var(--font-dm-sans), DM Sans, sans-serif", fontSize: 18, fontWeight: 700 }}>
            <span style={{ color: "#0F172A" }}>health</span>
            <span
              style={{
                background: "linear-gradient(135deg,#3B82F6,#1E40AF)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              rankings
            </span>
          </div>
          <button type="button" className="mobile-drawer-close" onClick={() => setOpen(false)}>
            ×
          </button>
        </div>
        <nav className="mobile-drawer-nav">
          <Link href="/" onClick={() => setOpen(false)}>
            Home
          </Link>
          <Link href="/healthrankings-conditions.html" onClick={() => setOpen(false)}>
            Conditions
          </Link>
          <Link href="/healthrankings-devices.html" className="active" onClick={() => setOpen(false)}>
            Devices
          </Link>
          <Link href="/healthrankings-drugs.html" onClick={() => setOpen(false)}>
            Drugs A–Z
          </Link>
          <Link href="/healthrankings-articles.html" onClick={() => setOpen(false)}>
            Articles
          </Link>
          <Link href="/healthrankings-news.html" onClick={() => setOpen(false)}>
            Health News
          </Link>
          <Link href="/healthrankings-about.html" onClick={() => setOpen(false)}>
            About
          </Link>
          <Link href="/healthrankings-contact.html" onClick={() => setOpen(false)}>
            Contact
          </Link>
        </nav>
        <div className="mobile-drawer-footer">
          <Link href="/healthrankings-hypertension-top5.html" onClick={() => setOpen(false)}>
            Top 5 BP Monitors
          </Link>
          <Link href="/healthrankings-weight-management-body-composition-top5.html" onClick={() => setOpen(false)}>
            Top 5 Smart Scales
          </Link>
          <Link href="/healthrankings-all-blood-pressure-monitors.html" onClick={() => setOpen(false)}>
            All BP Monitors
          </Link>
          <Link href="/healthrankings-all-body-composition-monitors.html" onClick={() => setOpen(false)}>
            All Smart Scales
          </Link>
        </div>
      </div>
    </>
  );
}
