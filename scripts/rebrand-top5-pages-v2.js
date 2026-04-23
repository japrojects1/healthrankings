#!/usr/bin/env node
/**
 * v2: Update CSS in top-5 pages to match the condition-page-blue reference more closely.
 * Targets the product card layout, score panel, rating bars, and overall spacing.
 */
const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '..');
const files = fs.readdirSync(dir).filter(f => f.match(/healthrankings-.*-top5\.html$/));

const CSS_REPLACEMENTS = [
  // Product card: 24px border-radius, 32px padding, 3-column-like feel
  [
    /\.product-card \{[^}]+\}/,
    `.product-card {
  border: 1px solid var(--slate-200); border-radius: 24px; overflow: visible;
  margin-bottom: 24px; background: white; transition: all 250ms; position: relative;
}`
  ],
  [
    /\.product-card:hover \{[^}]+\}/,
    `.product-card:hover {
  border-color: var(--blue-300); box-shadow: 0 20px 50px -20px rgba(37,99,235,0.15);
  transform: translateY(-2px);
}`
  ],
  [
    /\.product-card\.winner \{[^}]+\}/,
    `.product-card.winner {
  border: 2px solid var(--blue-600); background: linear-gradient(135deg, #FFF 0%, var(--blue-50) 100%);
}`
  ],
  // Card body: wider sidebar
  [
    /\.product-card-body \{[^}]+\}/,
    `.product-card-body {
  padding: 32px; display: grid; grid-template-columns: 1fr 260px; gap: 32px; align-items: start;
}`
  ],
  // Product name: bigger, no left padding (rank is absolute)
  [
    /\.product-name \{[^}]+\}/,
    `.product-name {
  font-family: 'DM Sans', sans-serif; font-size: 26px; font-weight: 700;
  color: var(--slate-900); margin-bottom: 4px; padding-left: 3rem; letter-spacing: -0.035em; line-height: 1.15;
}`
  ],
  // Tagline
  [
    /\.product-tagline \{[^}]+\}/,
    `.product-tagline {
  display: inline-block; padding: 4px 14px; background: var(--blue-50); color: var(--blue-700);
  border-radius: 9999px; font-family: 'DM Sans', sans-serif; font-size: 12px;
  font-weight: 700; letter-spacing: 0.05em; margin-bottom: 16px; padding-left: 14px; margin-left: 3rem;
}`
  ],
  // Product desc
  [
    /\.product-desc \{[^}]+\}/,
    `.product-desc {
  font-size: 15px; color: var(--slate-600); margin-bottom: 20px; line-height: 1.6; max-width: 560px;
}`
  ],
  // Score panel → sidebar style
  [
    /\.product-score-panel \{[^}]+\}/,
    `.product-score-panel {
  width: 260px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px;
}`
  ],
  // Score circle → score block (rectangular card)
  [
    /\.score-circle \{[^}]+\}/,
    `.score-circle {
  width: auto; height: auto; border-radius: 16px; background: white;
  padding: 20px; display: flex; flex-direction: column; align-items: flex-start;
  margin: 0 0 0; border: none;
}`
  ],
  // Score num → big like reference
  [
    /\.score-num \{[^}]+\}/,
    `.score-num {
  font-family: 'DM Sans', sans-serif; font-size: 44px; font-weight: 700;
  color: var(--blue-700); line-height: 1; letter-spacing: -0.04em;
}`
  ],
  [
    /\.score-circle\.gold \{[^}]+\}/,
    `.score-circle.gold { background: white; border: 1px solid var(--blue-200); }`
  ],
  [
    /\.score-circle\.gold \.score-num \{[^}]+\}/,
    `.score-circle.gold .score-num { color: var(--blue-700); }`
  ],
  // Score label
  [
    /\.score-label \{[^}]+\}/,
    `.score-label {
  font-size: 14px; color: var(--amber-400); letter-spacing: 1px; margin-bottom: 12px; font-weight: 400;
}`
  ],
  // Price tag
  [
    /\.price-tag \{[^}]+\}/,
    `.price-tag {
  font-family: 'DM Sans', sans-serif; font-size: 28px; font-weight: 700;
  color: var(--slate-900); margin-bottom: 10px; letter-spacing: -0.03em;
}`
  ],
  // Buy button
  [
    /\.buy-btn \{[^}]+\}/,
    `.buy-btn {
  display: block; background: var(--gradient-blue); color: white; text-align: center;
  padding: 14px 20px; border-radius: 12px;
  font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700;
  transition: all 200ms; white-space: nowrap;
}`
  ],
  // Rating bars → thicker, more visible
  [
    /\.rating-bar-row \{[^}]+\}/,
    `.rating-bar-row {
  display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 12px;
}`
  ],
  [
    /\.rating-bar-label \{[^}]+\}/,
    `.rating-bar-label { min-width: 80px; color: var(--slate-600); font-weight: 500; font-size: 12px; }`
  ],
  [
    /\.rating-bar-track \{[^}]+\}/,
    `.rating-bar-track { flex: 1; height: 4px; background: var(--slate-200); border-radius: 2px; overflow: hidden; }`
  ],
  [
    /\.rating-num \{[^}]+\}/,
    `.rating-num {
  min-width: 24px; font-family: 'DM Sans', sans-serif; font-weight: 700;
  color: var(--slate-900); font-size: 12px; text-align: right;
}`
  ],
  // Product rank → larger square
  [
    /\.product-rank \{[^}]+\}/,
    `.product-rank {
  position: absolute; top: 20px; left: 20px; width: 44px; height: 44px;
  background: var(--blue-50); color: var(--blue-700); border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-family: 'DM Sans', sans-serif; font-size: 18px; font-weight: 700; z-index: 2;
}`
  ],
  [
    /\.product-rank\.rank-1 \{[^}]+\}/,
    `.product-rank.rank-1 { background: var(--gradient-blue); color: white; }`
  ],
  // Winner ribbon → pill style
  [
    /\.winner-ribbon \{[^}]+\}/,
    `.winner-ribbon {
  position: absolute; top: 20px; right: 20px;
  background: var(--gradient-blue); color: white;
  font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 700;
  padding: 6px 16px; letter-spacing: 0.05em; text-transform: uppercase;
  border-radius: 9999px; z-index: 2;
}`
  ],
  // Product footer
  [
    /\.product-footer \{[^}]+\}/,
    `.product-footer {
  background: var(--slate-50); padding: 16px 32px; border-top: 1px solid var(--slate-200);
  display: flex; gap: 24px; font-size: 13px; color: var(--slate-500); flex-wrap: wrap;
  border-radius: 0 0 24px 24px;
}`
  ],
  // Review hero → bigger radius, dot pattern
  [
    /\.review-hero \{[^}]+\}/,
    `.review-hero {
  background: var(--gradient-blue); border-radius: 24px; padding: 40px;
  margin-bottom: 32px; position: relative; overflow: hidden;
}`
  ],
  [
    /\.review-hero::after \{[^}]+\}/,
    `.review-hero::after {
  content: ''; position: absolute; top: 30px; right: 30px; width: 240px; height: 240px;
  background-image: radial-gradient(circle, rgba(20,184,166,0.12) 2px, transparent 2px);
  background-size: 20px 20px; pointer-events: none;
}`
  ],
  [
    /\.review-hero h2 \{[^}]+\}/,
    `.review-hero h2 {
  font-family: 'DM Sans', sans-serif; color: white; font-size: 32px; font-weight: 700;
  margin-bottom: 14px; position: relative; z-index: 1; letter-spacing: -0.035em; line-height: 1.1;
}`
  ],
  // Top5 intro → rounded
  [
    /\.top5-intro \{[^}]+\}/,
    `.top5-intro {
  background: var(--blue-50); border-radius: 20px; padding: 24px 28px;
  margin-bottom: 32px; display: flex; align-items: center; gap: 20px;
  border: 1px solid var(--blue-200);
}`
  ],
  // Comparison table
  [
    /\.comparison-table th \{[^}]+\}/,
    `.comparison-table th {
  background: var(--blue-50); color: var(--slate-900); padding: 16px 14px; text-align: left;
  font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 13px;
  border-bottom: 1px solid var(--slate-200);
}`
  ],
  [
    /\.comparison-table th:first-child \{[^}]+\}/,
    `.comparison-table th:first-child {
  padding-left: 20px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--slate-600); font-weight: 700;
}`
  ],
  [
    /\.comparison-table td \{[^}]+\}/,
    `.comparison-table td {
  padding: 16px 14px; border-bottom: 1px solid var(--slate-200); color: var(--slate-900);
  font-size: 14px; vertical-align: middle;
}`
  ],
  // Comparison wrap → rounded border
  [
    /\.comparison-wrap \{[^}]+\}/,
    `.comparison-wrap {
  overflow-x: auto; margin-top: 20px; border-radius: 20px; border: 1px solid var(--slate-200);
  background: white;
}`
  ],
  // FAQ items → card style like reference
  [
    /\.faq-item \{[^}]+\}/,
    `.faq-item {
  border: 1px solid var(--slate-200); border-radius: 16px; background: white;
  padding: 0; margin-bottom: 10px; overflow: hidden; transition: all 200ms;
}`
  ],
  [
    /\.faq-q \{[^}]+\}/,
    `.faq-q {
  font-family: 'DM Sans', sans-serif; font-weight: 600; color: var(--slate-900);
  cursor: pointer; display: flex; justify-content: space-between; align-items: center;
  font-size: 16px; user-select: none; letter-spacing: -0.015em; padding: 20px 24px;
}`
  ],
  [
    /\.faq-a \{[^}]+\}/,
    `.faq-a {
  font-size: 15px; color: var(--slate-600); padding: 0 24px 20px; display: none; line-height: 1.65;
}`
  ],
  // Mobile: sidebar goes full-width below
  [
    /@media\(max-width:768px\)\s*\{[\s\S]*?\}/,
    `@media(max-width:768px) {
  .header-inner { padding: 0 20px; height: 60px; }
  .nav { display: none; }
  .hero, .page-wrap, .toc-bar { padding-left: 20px; padding-right: 20px; }
  .product-card-body { grid-template-columns: 1fr; }
  .product-score-panel { width: 100%; display: flex; flex-direction: row; flex-wrap: wrap; gap: 16px; padding-left: 0; }
  .score-circle { width: auto; flex: 1; min-width: 140px; }
  .causes-list { grid-template-columns: 1fr; }
  .product-pros-cons { grid-template-columns: 1fr; }
  .top5-box { flex-direction: column; align-items: flex-start; }
  .review-hero { padding: 28px 24px; }
}`
  ],
];

let updated = 0;

files.forEach(filename => {
  const filepath = path.join(dir, filename);
  let html = fs.readFileSync(filepath, 'utf8');

  CSS_REPLACEMENTS.forEach(([pattern, replacement]) => {
    html = html.replace(pattern, replacement);
  });

  fs.writeFileSync(filepath, html, 'utf8');
  updated++;
  console.log(`✓ ${filename}`);
});

console.log(`\nDone — updated ${updated} files.`);
