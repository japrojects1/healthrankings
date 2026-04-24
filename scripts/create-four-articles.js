const fs = require('fs');
const path = require('path');

const SHELL = (title, desc, tag, tagClass, heroGrad, heroIcon, breadcrumb, dateLine, meta, tocLinks, bodyHtml, relatedHtml) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} | HealthRankings</title>
<meta name="description" content="${desc}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;0,800;1,400;1,500;1,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Article","headline":"${title.replace(/"/g,'\\"')}","description":"${desc.replace(/"/g,'\\"')}","author":{"@type":"Organization","name":"HealthRankings"},"publisher":{"@type":"Organization","name":"HealthRankings"},"datePublished":"2026-04-24","dateModified":"2026-04-24","mainEntityOfPage":{"@type":"WebPage"},"articleSection":"${tag}"}
</script>
<style>
:root{--blue-50:#EFF6FF;--blue-100:#DBEAFE;--blue-200:#BFDBFE;--blue-300:#93C5FD;--blue-400:#60A5FA;--blue-500:#3B82F6;--blue-600:#2563EB;--blue-700:#1D4ED8;--blue-800:#1E40AF;--teal-50:#F0FDFA;--teal-100:#CCFBF1;--teal-200:#99F6E4;--teal-400:#2DD4BF;--teal-500:#14B8A6;--teal-600:#0D9488;--slate-50:#F8FAFC;--slate-100:#F1F5F9;--slate-200:#E2E8F0;--slate-300:#CBD5E1;--slate-400:#94A3B8;--slate-500:#64748B;--slate-600:#475569;--slate-700:#334155;--slate-900:#0F172A;--success-100:#D1FAE5;--success-600:#059669;--amber-400:#F59E0B;--gradient-blue:linear-gradient(135deg,#3B82F6 0%,#1E40AF 100%);--gradient-teal:linear-gradient(135deg,#14B8A6 0%,#0D9488 100%);--gradient-hero:linear-gradient(180deg,#EFF6FF 0%,#FFFFFF 100%)}
*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}body{font-family:'Inter','Helvetica Neue',system-ui,sans-serif;background:var(--slate-50);color:var(--slate-900);font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased}a{color:inherit;text-decoration:none}
.header{position:sticky;top:0;z-index:50;background:rgba(255,255,255,0.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--slate-200)}.header-inner{max-width:1280px;margin:0 auto;padding:0 32px;height:76px;display:flex;align-items:center;justify-content:space-between}.logo{display:flex;align-items:center;gap:14px;line-height:1}.logo-tile{position:relative;width:44px;height:44px;background:var(--blue-50);border-radius:14px;display:flex;align-items:center;justify-content:center}.logo-sparkle{position:absolute;top:-4px;right:-4px;color:var(--teal-500)}.logo-text{font-family:'DM Sans',sans-serif;font-size:22px;letter-spacing:-0.035em;line-height:1}.logo-text .one{font-weight:500;color:var(--slate-900)}.logo-text .two{font-weight:700;background:var(--gradient-teal);-webkit-background-clip:text;background-clip:text;color:transparent}.nav{display:flex;align-items:center;gap:36px}.nav a{font-family:'DM Sans',sans-serif;font-size:15px;font-weight:500;color:var(--slate-900);letter-spacing:-0.01em;transition:color 200ms}.nav a:hover{color:var(--blue-600)}.nav a.active{color:var(--blue-600)}.header-actions{display:flex;align-items:center;gap:12px}.search-btn{width:40px;height:40px;border:1px solid var(--slate-200);border-radius:10px;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--slate-500);transition:all 200ms}.search-btn:hover{border-color:var(--blue-300);color:var(--blue-600)}.cta-btn{font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;padding:10px 22px;border-radius:10px;border:none;background:var(--gradient-blue);color:white;cursor:pointer;transition:transform 120ms,box-shadow 200ms}.cta-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(37,99,235,0.3)}
.breadcrumb-bar{max-width:1280px;margin:0 auto;padding:16px 32px;font-size:13px;color:var(--slate-400);display:flex;align-items:center;gap:8px}.breadcrumb-bar a{color:var(--slate-500);transition:color 200ms}.breadcrumb-bar a:hover{color:var(--blue-600)}.breadcrumb-sep{color:var(--slate-300)}
.article-hero{background:var(--gradient-hero);padding:0 32px 48px}.article-hero-inner{max-width:760px;margin:0 auto;text-align:center}.article-tag{display:inline-block;padding:5px 14px;border-radius:9999px;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:20px}.article-hero h1{font-family:'DM Sans',sans-serif;font-size:clamp(30px,5vw,46px);font-weight:800;letter-spacing:-0.04em;line-height:1.1;color:var(--slate-900);margin-bottom:18px}.article-hero .subtitle{font-size:18px;color:var(--slate-600);line-height:1.65;max-width:620px;margin:0 auto 24px}.article-meta{display:flex;align-items:center;justify-content:center;gap:20px;font-size:14px;color:var(--slate-500);flex-wrap:wrap}.article-meta .author{font-weight:600;color:var(--slate-700)}.article-meta .sep{width:4px;height:4px;border-radius:50%;background:var(--slate-300)}.article-hero-image{max-width:860px;margin:32px auto 0;height:300px;border-radius:20px;display:flex;align-items:center;justify-content:center;overflow:hidden}
.article-layout{max-width:1280px;margin:0 auto;padding:48px 32px 64px;display:grid;grid-template-columns:1fr 260px;gap:56px}.article-content{max-width:720px}.article-content h2{font-family:'DM Sans',sans-serif;font-size:26px;font-weight:700;letter-spacing:-0.03em;line-height:1.2;color:var(--slate-900);margin:44px 0 16px}.article-content h2:first-child{margin-top:0}.article-content h3{font-family:'DM Sans',sans-serif;font-size:20px;font-weight:700;letter-spacing:-0.02em;line-height:1.3;color:var(--slate-900);margin:32px 0 12px}.article-content p{font-size:17px;line-height:1.75;color:var(--slate-700);margin-bottom:20px}.article-content ul,.article-content ol{margin:0 0 20px 24px;font-size:17px;line-height:1.75;color:var(--slate-700)}.article-content li{margin-bottom:8px}.article-content strong{color:var(--slate-900)}.article-content a{color:var(--blue-600);text-decoration:underline;text-underline-offset:3px}.article-content a:hover{color:var(--blue-800)}
.key-takeaway{background:var(--blue-50);border-left:4px solid var(--blue-500);border-radius:0 12px 12px 0;padding:24px 28px;margin:32px 0}.key-takeaway .label{font-family:'DM Sans',sans-serif;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--blue-600);margin-bottom:8px}.key-takeaway p{font-size:15px;line-height:1.65;color:var(--slate-700);margin-bottom:0}
.evidence-box{background:var(--teal-50);border:1px solid var(--teal-200);border-radius:14px;padding:24px 28px;margin:28px 0}.evidence-box .label{font-family:'DM Sans',sans-serif;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--teal-600);margin-bottom:8px}.evidence-box p{font-size:15px;line-height:1.65;color:var(--slate-700);margin-bottom:0}
.article-sidebar{position:sticky;top:100px;align-self:start}.sidebar-toc{background:white;border:1px solid var(--slate-200);border-radius:14px;padding:24px;margin-bottom:24px}.sidebar-toc h4{font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--slate-500);margin-bottom:16px}.sidebar-toc a{display:block;font-size:14px;color:var(--slate-600);padding:6px 0;border-left:2px solid transparent;padding-left:14px;transition:all 200ms;line-height:1.4}.sidebar-toc a:hover{color:var(--blue-600);border-left-color:var(--blue-400)}.sidebar-cta{background:var(--blue-600);border-radius:14px;padding:24px;text-align:center;color:white}.sidebar-cta h4{font-family:'DM Sans',sans-serif;font-size:16px;font-weight:700;margin-bottom:8px}.sidebar-cta p{font-size:13px;opacity:0.85;margin-bottom:16px;line-height:1.5}.sidebar-cta input{width:100%;padding:10px 14px;border-radius:8px;border:2px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.1);color:white;font-size:13px;font-family:inherit;outline:none;margin-bottom:8px}.sidebar-cta input::placeholder{color:rgba(255,255,255,0.5)}.sidebar-cta button{width:100%;padding:10px;border-radius:8px;border:none;background:white;color:var(--blue-700);font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:transform 120ms}.sidebar-cta button:hover{transform:translateY(-1px)}
.related-section{background:white;border-top:1px solid var(--slate-200);padding:56px 32px}.related-inner{max-width:1280px;margin:0 auto}.related-inner h2{font-family:'DM Sans',sans-serif;font-size:24px;font-weight:700;letter-spacing:-0.03em;color:var(--slate-900);margin-bottom:28px}.related-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.related-card{border:1px solid var(--slate-200);border-radius:14px;overflow:hidden;transition:all 280ms cubic-bezier(0.4,0,0.2,1);display:flex;flex-direction:column}.related-card:hover{transform:translateY(-3px);border-color:var(--blue-300);box-shadow:0 12px 32px -8px rgba(37,99,235,0.1)}.related-card-img{height:120px;display:flex;align-items:center;justify-content:center}.related-card-img svg{opacity:0.2}.related-card-body{padding:18px 20px 16px}.related-card-body h3{font-family:'DM Sans',sans-serif;font-size:15px;font-weight:700;line-height:1.35;color:var(--slate-900);margin-bottom:6px}.related-card-body span{font-size:12px;color:var(--slate-400)}
.footer{background:var(--slate-900);color:var(--slate-400);font-size:14px}.footer-inner{max-width:1280px;margin:0 auto;padding:72px 32px 40px}.footer-grid{display:grid;grid-template-columns:1.5fr repeat(4,1fr);gap:48px;margin-bottom:48px}.footer-brand-desc{margin-top:16px;line-height:1.6;max-width:280px}.footer-col h4{font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--slate-200);margin-bottom:20px}.footer-col ul{list-style:none}.footer-col li{margin-bottom:12px}.footer-col a{transition:color 200ms}.footer-col a:hover{color:var(--blue-400)}.footer-bottom{border-top:1px solid rgba(255,255,255,0.08);padding-top:24px;display:flex;align-items:center;justify-content:space-between;font-size:13px}
@media(max-width:1024px){.article-layout{grid-template-columns:1fr}.article-sidebar{position:static;display:grid;grid-template-columns:1fr 1fr;gap:20px}.related-grid{grid-template-columns:repeat(2,1fr)}.footer-grid{grid-template-columns:1fr 1fr}}
@media(max-width:640px){.header-inner{padding:0 20px;height:64px}.nav{display:none}.article-hero{padding:0 20px 36px}.article-hero-image{height:180px;border-radius:14px}.article-layout{padding:32px 20px 48px;gap:32px}.article-sidebar{grid-template-columns:1fr}.related-section{padding:40px 20px}.related-grid{grid-template-columns:1fr}.footer-grid{grid-template-columns:1fr 1fr;gap:32px}}
</style>
</head>
<body>
<header class="header"><div class="header-inner"><a href="/" class="logo"><div class="logo-tile"><svg width="28" height="28" viewBox="0 0 32 32" fill="none"><circle cx="11" cy="12" r="2" fill="#2563EB"/><circle cx="21" cy="12" r="2" fill="#2563EB"/><path d="M 8 19 Q 16 26 24 19" stroke="#2563EB" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg><div class="logo-sparkle"><svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M 6 0 L 7 4.5 L 12 6 L 7 7.5 L 6 12 L 5 7.5 L 0 6 L 5 4.5 Z"/></svg></div></div><div class="logo-text"><span class="one">health</span><span class="two">rankings</span></div></a><nav class="nav"><a href="/healthrankings-conditions.html">Conditions</a><a href="/healthrankings-devices.html">Devices</a><a href="/healthrankings-articles.html" class="active">Articles</a><a href="#">Drugs A\u2013Z</a><a href="#">Health News</a><a href="/healthrankings-about.html">About</a></nav><div class="header-actions"><button class="search-btn" aria-label="Search"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></button><button class="cta-btn">Get started</button></div></div></header>
<div class="breadcrumb-bar"><a href="/">Home</a><span class="breadcrumb-sep">/</span><a href="/healthrankings-articles.html">Articles</a><span class="breadcrumb-sep">/</span><span>${breadcrumb}</span></div>
<section class="article-hero"><div class="article-hero-inner"><span class="article-tag" style="${tagClass}">${tag}</span><h1>${title}</h1><p class="subtitle">${desc}</p><div class="article-meta"><span class="author">By HealthRankings Team</span><span class="sep"></span><span>${dateLine}</span><span class="sep"></span><span>${meta}</span></div></div><div class="article-hero-image" style="background:${heroGrad}">${heroIcon}</div></section>
<div class="article-layout">
<article class="article-content">
${bodyHtml}
</article>
<aside class="article-sidebar"><div class="sidebar-toc"><h4>In this article</h4>${tocLinks}</div><div class="sidebar-cta"><h4>Get smarter about your health</h4><p>One evidence-based article per week. No spam, no fluff.</p><input type="email" placeholder="you@email.com" /><button>Subscribe</button></div></aside>
</div>
<section class="related-section"><div class="related-inner"><h2>You might also like</h2><div class="related-grid">${relatedHtml}</div></div></section>
<footer class="footer"><div class="footer-inner"><div class="footer-grid"><div><a href="/" class="logo"><div class="logo-tile"><svg width="28" height="28" viewBox="0 0 32 32" fill="none"><circle cx="11" cy="12" r="2" fill="#2563EB"/><circle cx="21" cy="12" r="2" fill="#2563EB"/><path d="M 8 19 Q 16 26 24 19" stroke="#2563EB" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg><div class="logo-sparkle"><svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M 6 0 L 7 4.5 L 12 6 L 7 7.5 L 6 12 L 5 7.5 L 0 6 L 5 4.5 Z"/></svg></div></div><div class="logo-text"><span class="one">health</span><span class="two">rankings</span></div></a><p class="footer-brand-desc">Independent health and wellness platform \u2014 condition guides, lifestyle tips, product rankings, and wellness articles. Medically reviewed, never sponsored.</p></div><div class="footer-col"><h4>Conditions</h4><ul><li><a href="#">Heart health</a></li><li><a href="#">Diabetes</a></li><li><a href="#">Sleep</a></li><li><a href="#">Women\u2019s health</a></li><li><a href="/healthrankings-conditions.html">View all</a></li></ul></div><div class="footer-col"><h4>Devices</h4><ul><li><a href="#">Blood pressure</a></li><li><a href="#">Glucose meters</a></li><li><a href="#">Smart scales</a></li><li><a href="#">Sleep trackers</a></li><li><a href="/healthrankings-devices.html">View all</a></li></ul></div><div class="footer-col"><h4>About</h4><ul><li><a href="/healthrankings-about.html">About us</a></li><li><a href="#">Methodology</a></li><li><a href="#">Medical review board</a></li><li><a href="#">Editorial policy</a></li><li><a href="#">Contact</a></li></ul></div><div class="footer-col"><h4>Also from us</h4><ul><li><a href="#">RankedRx \u2192</a></li><li><a href="#">Newsletter</a></li><li><a href="#">Careers</a></li><li><a href="#">Press</a></li></ul></div></div><div class="footer-bottom"><div>\u00a9 2026 HealthRankings. Made with care in Miami.</div><div style="display:flex;gap:24px"><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Accessibility</a></div></div></div></footer>
</body></html>`;

const relatedCard = (href, grad, icon, title, meta) =>
  `<a href="${href}" class="related-card"><div class="related-card-img" style="background:${grad}">${icon}</div><div class="related-card-body"><h3>${title}</h3><span>${meta}</span></div></a>`;

const toc = (links) => links.map(([id, text]) => `<a href="#${id}">${text}</a>`).join('\n');

const dir = path.resolve(__dirname, '..');

// ===== 1. SLEEP APNEA & WEIGHT =====
const sleepBody = `
<h2 id="intro">It's a vicious cycle — and breaking it starts with understanding it</h2>

<p>Sleep apnea and weight gain feed each other. Excess weight — particularly around the neck and abdomen — narrows the airway and increases the severity of obstructive sleep apnea (OSA). And sleep apnea, in turn, disrupts hormones that regulate hunger and metabolism, making it harder to lose weight.</p>

<p>An estimated 22 million Americans have sleep apnea, and up to 80% of moderate-to-severe cases remain undiagnosed. Among people with a BMI over 35, the prevalence of OSA exceeds 70%.</p>

<div class="key-takeaway">
<div class="label">Key Takeaway</div>
<p>Sleep apnea and weight gain create a bidirectional cycle: excess weight worsens apnea, and apnea makes weight loss harder. Breaking the cycle at <strong>either</strong> point — even modestly — produces improvements on both sides.</p>
</div>

<h2 id="how-weight-causes">How weight worsens sleep apnea</h2>

<p>Fat deposits around the pharynx (upper throat) physically narrow the airway. During sleep, when muscle tone naturally relaxes, this narrowing becomes critical — the airway collapses partially or completely, causing the characteristic pauses in breathing.</p>

<p>Abdominal fat is equally problematic. It pushes the diaphragm upward, reducing lung volume and pulling on the upper airway structures, making collapse more likely. This is why waist circumference correlates with sleep apnea severity more strongly than BMI alone.</p>

<p>A 10% weight gain increases the odds of developing moderate-to-severe OSA by <strong>six-fold</strong>, according to the Wisconsin Sleep Cohort Study — one of the longest-running sleep studies in the world.</p>

<h2 id="how-apnea-causes">How sleep apnea drives weight gain</h2>

<p>This is the side most people don't hear about. Sleep apnea doesn't just result from weight — it actively promotes it through several mechanisms:</p>

<ul>
<li><strong>Leptin resistance:</strong> Leptin is the hormone that tells your brain you're full. OSA causes chronically elevated leptin levels, which paradoxically makes your brain <em>less</em> sensitive to the signal. You feel hungrier than you should.</li>
<li><strong>Elevated ghrelin:</strong> Ghrelin is the "hunger hormone." Sleep deprivation from apnea raises ghrelin levels, increasing appetite — particularly for high-carb, high-calorie foods.</li>
<li><strong>Cortisol spikes:</strong> Each apnea episode triggers a micro-arousal and a stress response. Repeated dozens of times per night, this chronically elevates cortisol, which promotes visceral fat storage.</li>
<li><strong>Daytime fatigue:</strong> Poor sleep means less energy for exercise. People with untreated OSA are significantly less physically active than matched controls.</li>
<li><strong>Insulin resistance:</strong> OSA independently increases insulin resistance — even after controlling for weight. This shifts metabolism toward fat storage rather than fat burning.</li>
</ul>

<div class="evidence-box">
<div class="label">What the research says</div>
<p>A 2022 meta-analysis in Chest found that untreated OSA increased the risk of weight gain over 5 years by 35%, independent of baseline BMI. The hormonal disruption — not just poor willpower — is a major driver.</p>
</div>

<h2 id="breaking">Breaking the cycle</h2>

<p>The good news: interventions on either side of the cycle produce improvements on both. You don't need to solve everything at once.</p>

<h3>Weight loss: the most effective treatment</h3>

<p>Losing 10–15% of body weight can reduce the Apnea-Hypopnea Index (AHI — the number of breathing disruptions per hour) by 50% or more. In some cases, moderate weight loss eliminates sleep apnea entirely.</p>

<p>The Sleep AHEAD study found that participants who lost an average of 10 kg through lifestyle intervention had a 3-fold higher rate of OSA remission compared to controls. Even losing 5% of body weight produces measurable improvements in AHI and oxygen saturation.</p>

<h3>CPAP: treating apnea to enable weight loss</h3>

<p>CPAP (Continuous Positive Airway Pressure) is the gold standard treatment for moderate-to-severe OSA. By keeping the airway open during sleep, CPAP restores normal sleep architecture, normalizes oxygen levels, and reduces the hormonal disruptions that drive weight gain.</p>

<p>Studies show that consistent CPAP use (4+ hours per night) reduces daytime sleepiness, improves insulin sensitivity, and lowers cortisol — creating a metabolic environment that makes weight loss more achievable. CPAP alone doesn't cause weight loss, but it removes a significant biological barrier to it.</p>

<h3>Practical strategies</h3>

<ul>
<li><strong>Get tested:</strong> If you snore loudly, wake unrefreshed, or have a neck circumference above 17" (men) or 16" (women), ask your doctor about a sleep study. Home sleep tests are now widely available and covered by most insurance.</li>
<li><strong>Use CPAP consistently:</strong> Adherence is the biggest challenge. Modern devices are quieter and more comfortable. Give it at least 30 days and work with your sleep clinic on mask fit.</li>
<li><strong>Sleep on your side:</strong> Apnea is typically worse when sleeping on your back. A positional therapy device or even a tennis ball taped to the back of your shirt can help.</li>
<li><strong>Limit alcohol before bed:</strong> Alcohol relaxes airway muscles and worsens apnea by 25–50%.</li>
<li><strong>Prioritize gradual weight loss:</strong> Crash diets backfire. A sustainable 500-calorie daily deficit with increased protein and walking is more effective long-term.</li>
</ul>

<h2 id="bottom-line">The bottom line</h2>

<p>Sleep apnea and weight aren't just correlated — they actively cause each other to worsen. The cycle feels impossible to break from the inside, which is why most people need to attack it from both directions simultaneously: treat the apnea (usually CPAP) to restore normal sleep and hormones, and pursue gradual weight loss to reduce airway obstruction.</p>

<div class="key-takeaway">
<div class="label">Bottom line</div>
<p>If you're overweight and struggling with fatigue, poor sleep, or unexplained weight gain resistance — get screened for sleep apnea. Treating it may be the missing piece that makes everything else work. A 10–15% weight loss combined with CPAP can dramatically improve or even resolve the condition.</p>
</div>`;

const sleepToc = toc([['intro','The vicious cycle'],['how-weight-causes','How weight worsens apnea'],['how-apnea-causes','How apnea drives weight gain'],['breaking','Breaking the cycle'],['bottom-line','The bottom line']]);

const sleepRelated = relatedCard('/healthrankings-article-daily-habits-lower-blood-pressure.html','linear-gradient(135deg,#1E40AF,#3B82F6,#14B8A6)','<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/></svg>','Daily habits that actually lower blood pressure','Wellness &middot; 8 min read') +
  relatedCard('/healthrankings-article-type-2-diabetes-complete-guide.html','linear-gradient(135deg,#F0FDFA,#99F6E4)','<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>','Type 2 diabetes: what your doctor doesn\u2019t have time to explain','Diabetes &middot; 14 min read') +
  relatedCard('#','linear-gradient(135deg,#ECFDF5,#A7F3D0)','<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>','Walking vs. running: which matters more for heart health?','Fitness &middot; 9 min read');

fs.writeFileSync(path.join(dir, 'healthrankings-article-sleep-apnea-weight.html'), SHELL(
  'Sleep apnea and weight: the cycle nobody talks about',
  'How sleep disruption drives weight gain, and how weight gain worsens sleep apnea. Plus practical strategies to break the loop.',
  'Lifestyle Tips','background:var(--slate-100);color:var(--slate-700)',
  'linear-gradient(135deg,#EFF6FF 0%,#BFDBFE 50%,#1E40AF 100%)',
  '<svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="0.8"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  'Sleep Apnea & Weight','April 24, 2026','Sleep &middot; 6 min read',
  sleepToc, sleepBody, sleepRelated
));
console.log('1/4 sleep-apnea-weight');

// ===== 2. CREATINE =====
const creatineBody = `
<h2 id="intro">The most studied supplement in sports science is finding new audiences</h2>

<p>Creatine monohydrate has been used by athletes for decades. It's the single most researched sports supplement in history, with over 500 peer-reviewed studies confirming its safety and efficacy for improving strength and power output.</p>

<p>But recent research is revealing benefits that extend far beyond the weight room. From cognitive performance to bone density to healthy aging, creatine is earning attention from populations that would never set foot in a gym.</p>

<div class="key-takeaway">
<div class="label">Key Takeaway</div>
<p>Creatine isn't just for building muscle. Emerging research shows benefits for <strong>brain health, bone density, blood sugar regulation, and healthy aging</strong> — all supported by the same mechanism: improving cellular energy production.</p>
</div>

<h2 id="how-it-works">How creatine actually works</h2>

<p>Creatine is a naturally occurring compound found in muscle cells. Your body makes about 1–2 grams per day (primarily in the liver and kidneys), and you get another 1–2 grams from dietary sources like red meat and fish.</p>

<p>Its job is straightforward: creatine helps regenerate ATP (adenosine triphosphate), the molecule your cells use for energy. When a cell burns ATP for energy, it becomes ADP. Creatine donates a phosphate group to convert ADP back into ATP — essentially recharging the battery faster.</p>

<p>This matters most during short, intense efforts (lifting, sprinting) but also applies to any tissue with high energy demands — including the brain, which consumes about 20% of your body's total energy.</p>

<h2 id="muscle">For muscle and strength (the classic use)</h2>

<p>The evidence here is overwhelming. Creatine supplementation (3–5 grams per day) consistently increases:</p>

<ul>
<li><strong>Lean muscle mass:</strong> 1–2 kg more than training alone over 8–12 weeks</li>
<li><strong>Strength:</strong> 5–10% greater improvement in 1-rep max</li>
<li><strong>Power output:</strong> Improved sprint and high-intensity performance</li>
<li><strong>Recovery:</strong> Reduced muscle damage markers and faster recovery between sets</li>
</ul>

<p>It's not a steroid. It doesn't build muscle by itself. It gives your muscles a slightly larger energy reservoir so you can train harder and recover faster — which, over time, leads to greater gains.</p>

<h2 id="brain">For brain health</h2>

<p>This is where creatine research gets genuinely exciting. The brain is one of the most energy-demanding organs in the body, and it relies heavily on the creatine-phosphocreatine system.</p>

<p>A 2023 meta-analysis in Experimental Gerontology reviewed 10 randomized controlled trials and found that creatine supplementation improved <strong>short-term memory and reasoning</strong> — particularly under conditions of stress, sleep deprivation, or aging. The effects were more pronounced in older adults and vegetarians (who have lower baseline creatine stores from diet).</p>

<p>Animal studies suggest neuroprotective effects against traumatic brain injury and neurodegenerative diseases, though human trials are still in early stages. The Alzheimer's Drug Discovery Foundation has identified creatine as a compound of interest for further investigation.</p>

<h2 id="aging">For healthy aging</h2>

<p>Sarcopenia — the age-related loss of muscle mass — is one of the strongest predictors of falls, fractures, loss of independence, and mortality in older adults. Muscle loss begins around age 30 and accelerates after 60.</p>

<p>Creatine combined with resistance training in older adults has shown:</p>

<ul>
<li><strong>Greater muscle mass preservation</strong> compared to training alone</li>
<li><strong>Improved functional performance</strong> (standing from a chair, walking speed, balance)</li>
<li><strong>Better bone mineral density</strong> — a 2020 meta-analysis found creatine + resistance training slowed bone loss at the hip and lumbar spine</li>
</ul>

<div class="evidence-box">
<div class="label">Research highlight</div>
<p>A 12-month RCT in postmenopausal women found that creatine (3g/day) combined with resistance training preserved significantly more bone mineral density at the femoral neck than training alone. The effect size was comparable to some osteoporosis medications — without the side effects.</p>
</div>

<h2 id="blood-sugar">For blood sugar regulation</h2>

<p>Several studies have found that creatine supplementation improves glucose tolerance and GLUT4 transporter expression in skeletal muscle — the same pathway activated by exercise. A 2021 review in Nutrients concluded that creatine may improve glycemic control, particularly when combined with exercise, though more large-scale human trials are needed.</p>

<p>This doesn't make creatine a diabetes treatment. But for people managing blood sugar through diet and exercise, it may provide a modest additional benefit.</p>

<h2 id="safety">Safety and dosing</h2>

<p>Creatine monohydrate has an exceptionally strong safety profile. The International Society of Sports Nutrition (ISSN) has stated that creatine is <strong>"one of the most well-studied and safest supplements available."</strong></p>

<ul>
<li><strong>Standard dose:</strong> 3–5 grams per day. Loading phases (20g/day for 5–7 days) are not necessary — they saturate stores faster but the endpoint is the same.</li>
<li><strong>Form:</strong> Creatine monohydrate is the gold standard. Fancier forms (HCl, buffered, ethyl ester) cost more with no proven advantage.</li>
<li><strong>Timing:</strong> Doesn't matter much. Post-workout may be slightly better for absorption, but consistency matters more than timing.</li>
<li><strong>Hydration:</strong> Creatine draws water into muscle cells. Drink adequate water — but the old "creatine causes dehydration" claim has been debunked.</li>
<li><strong>Kidneys:</strong> Creatine raises creatinine levels (a kidney function marker) because creatinine is a byproduct of creatine metabolism — not because of kidney damage. Multiple long-term studies (up to 5 years) show no adverse kidney effects in healthy individuals. If you have existing kidney disease, consult your doctor.</li>
</ul>

<h2 id="bottom-line">The bottom line</h2>

<p>Creatine is cheap, safe, well-studied, and useful for far more people than currently take it. If you're over 50, managing blood sugar, dealing with cognitive fatigue, or simply trying to maintain muscle and bone density, it's worth discussing with your doctor.</p>

<div class="key-takeaway">
<div class="label">Bottom line</div>
<p>At 3–5 grams per day, creatine monohydrate is one of the most cost-effective supplements available — with strong evidence for muscle, emerging evidence for brain and bone health, and an excellent safety record. It's not magic, but it's one of the few supplements that consistently delivers on its claims.</p>
</div>`;

const creatineToc = toc([['intro','Introduction'],['how-it-works','How it works'],['muscle','For muscle & strength'],['brain','For brain health'],['aging','For healthy aging'],['blood-sugar','For blood sugar'],['safety','Safety & dosing'],['bottom-line','The bottom line']]);

const creatineRelated = relatedCard('/healthrankings-article-type-2-diabetes-complete-guide.html','linear-gradient(135deg,#F0FDFA,#99F6E4)','<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>','Type 2 diabetes: what your doctor doesn\u2019t have time to explain','Diabetes &middot; 14 min read') +
  relatedCard('#','linear-gradient(135deg,#ECFDF5,#A7F3D0)','<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>','Walking vs. running: which matters more for heart health?','Fitness &middot; 9 min read') +
  relatedCard('/healthrankings-article-daily-habits-lower-blood-pressure.html','linear-gradient(135deg,#1E40AF,#3B82F6,#14B8A6)','<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/></svg>','Daily habits that actually lower blood pressure','Wellness &middot; 8 min read');

fs.writeFileSync(path.join(dir, 'healthrankings-article-creatine-not-just-bodybuilders.html'), SHELL(
  'Creatine isn\u2019t just for bodybuilders \u2014 here\u2019s what the science says',
  'From brain health to bone density, new research is expanding who should consider this well-studied supplement.',
  'Nutrition','background:#FFFBEB;color:#B45309',
  'linear-gradient(135deg,#FFFBEB 0%,#FDE68A 50%,#F59E0B 100%)',
  '<svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="0.8"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><path d="M6 1v3M10 1v3M14 1v3"/></svg>',
  'Creatine Guide','April 24, 2026','Supplements &middot; 10 min read',
  creatineToc, creatineBody, creatineRelated
));
console.log('2/4 creatine');

// ===== 3. ANXIETY & BLOOD PRESSURE =====
const anxietyBody = `
<h2 id="intro">Your blood pressure is high — but is it really?</h2>

<p>You sit down at the doctor's office. The cuff squeezes. The number comes back: 148/92. Your doctor frowns. You feel your chest tighten. And just like that, you're caught in a loop: the anxiety about your blood pressure is raising your blood pressure.</p>

<p>This is one of the most common — and most misunderstood — problems in cardiovascular medicine. Anxiety and stress can temporarily spike blood pressure by 10–30 mmHg. If you're only measuring in high-stress environments, you may be treating a number that doesn't reflect your actual cardiovascular risk.</p>

<div class="key-takeaway">
<div class="label">Key Takeaway</div>
<p>Anxiety can spike blood pressure by 10–30 mmHg in the moment. <strong>White-coat hypertension</strong> — high readings only at the doctor's office — affects 15–30% of people diagnosed with high blood pressure. Home monitoring is the most reliable way to know what's real.</p>
</div>

<h2 id="white-coat">White-coat hypertension: more common than you think</h2>

<p>White-coat hypertension (WCH) is defined as consistently elevated blood pressure in clinical settings but normal readings at home or during ambulatory monitoring. It's not rare — estimates range from 15–30% of all people diagnosed with hypertension.</p>

<p>For years, WCH was considered harmless. More recent research suggests it carries a <em>mildly</em> elevated cardiovascular risk compared to true normotension — but significantly less risk than sustained hypertension. The danger lies in misdiagnosis: unnecessary medication that can cause lightheadedness, fatigue, and falls — particularly in older adults.</p>

<p>The European Society of Hypertension now recommends that <strong>no hypertension diagnosis should be made based on office readings alone</strong>. Home blood pressure monitoring (HBPM) or 24-hour ambulatory monitoring (ABPM) should confirm the diagnosis before treatment begins.</p>

<h2 id="acute">Acute stress vs. chronic stress</h2>

<p>It helps to separate two distinct effects:</p>

<p><strong>Acute stress</strong> (anxiety in the moment) activates the sympathetic nervous system — your fight-or-flight response. Heart rate increases, blood vessels constrict, and blood pressure spikes. This is temporary. Once the stressor passes, blood pressure returns to baseline. A single high reading during a stressful moment does not mean you have hypertension.</p>

<p><strong>Chronic stress</strong> (sustained anxiety, work burnout, ongoing life stressors) keeps the sympathetic nervous system partially activated for extended periods. This leads to sustained elevations in baseline blood pressure, increased inflammation, and higher cortisol — all of which contribute to genuine cardiovascular risk over time.</p>

<p>The distinction matters because the interventions are different. Acute anxiety in a medical setting needs better measurement techniques. Chronic stress needs lifestyle management.</p>

<h2 id="accurate">How to get accurate readings</h2>

<p>If you suspect anxiety is affecting your numbers, here's how to get readings that reflect reality:</p>

<ul>
<li><strong>Measure at home:</strong> Buy a validated upper-arm monitor (not a wrist cuff). Take readings in the morning before coffee or exercise, and in the evening. Average 2 readings 1 minute apart.</li>
<li><strong>Sit quietly first:</strong> Rest for 5 full minutes in a chair (feet flat, back supported, arm at heart level) before measuring. This alone can reduce readings by 5–10 mmHg.</li>
<li><strong>Don't talk during measurement:</strong> Conversation can raise systolic pressure by 10+ mmHg.</li>
<li><strong>Empty your bladder:</strong> A full bladder can elevate systolic pressure by 10–15 mmHg.</li>
<li><strong>Track trends, not single readings:</strong> One high reading means nothing. A pattern of high readings over 1–2 weeks is clinically meaningful.</li>
<li><strong>Share home data with your doctor:</strong> Most physicians will adjust their assessment based on reliable home readings. Bring a log or use a connected monitor that exports data.</li>
</ul>

<div class="evidence-box">
<div class="label">What the guidelines say</div>
<p>The AHA/ACC 2017 hypertension guidelines explicitly recommend out-of-office blood pressure measurement to confirm a diagnosis. Home readings averaging above 130/80 mmHg are considered elevated. The threshold is slightly lower than office readings (140/90) because home readings tend to be more accurate.</p>
</div>

<h2 id="anxiety-management">When anxiety is a real contributor</h2>

<p>For some people, anxiety isn't just inflating readings — it's genuinely contributing to sustained hypertension. Generalized anxiety disorder, panic disorder, and chronic work stress are all independently associated with increased hypertension risk.</p>

<p>Evidence-based approaches that help both anxiety and blood pressure:</p>

<ul>
<li><strong>Cognitive behavioral therapy (CBT):</strong> The gold standard for anxiety treatment. Studies show CBT can reduce systolic blood pressure by 3–6 mmHg in people with comorbid anxiety and hypertension.</li>
<li><strong>Regular aerobic exercise:</strong> 150 minutes per week reduces both anxiety symptoms and blood pressure. The anti-anxiety effect of exercise is comparable to medication for mild-to-moderate anxiety.</li>
<li><strong>Slow breathing:</strong> Device-guided breathing at fewer than 10 breaths per minute for 15 minutes has shown 3–4 mmHg reductions in clinical trials. The mechanism involves baroreceptor sensitization and vagal nerve stimulation.</li>
<li><strong>Medication when needed:</strong> If anxiety is severe, treating it directly (SSRIs, therapy, or both) often improves blood pressure as a secondary benefit. Some beta-blockers treat both conditions simultaneously.</li>
</ul>

<h2 id="bottom-line">The bottom line</h2>

<p>Anxiety and blood pressure have a real, bidirectional relationship. But a high reading in a stressful moment isn't the same as hypertension. Before accepting a diagnosis or starting medication, confirm your numbers at home over at least a week. If anxiety is a persistent factor, address it directly — both your mental health and your cardiovascular system will benefit.</p>

<div class="key-takeaway">
<div class="label">Bottom line</div>
<p>Buy a home blood pressure monitor. Measure in the morning and evening for one week, sitting quietly. Share the average with your doctor. This simple step prevents overdiagnosis, avoids unnecessary medication, and gives you — and your doctor — a true picture of your cardiovascular health.</p>
</div>`;

const anxietyToc = toc([['intro','The question'],['white-coat','White-coat hypertension'],['acute','Acute vs. chronic stress'],['accurate','Getting accurate readings'],['anxiety-management','When anxiety is a real contributor'],['bottom-line','The bottom line']]);

const anxietyRelated = relatedCard('/healthrankings-article-daily-habits-lower-blood-pressure.html','linear-gradient(135deg,#1E40AF,#3B82F6,#14B8A6)','<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/></svg>','Daily habits that actually lower blood pressure','Wellness &middot; 8 min read') +
  relatedCard('/healthrankings-article-sleep-apnea-weight.html','linear-gradient(135deg,#EFF6FF,#BFDBFE)','<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>','Sleep apnea and weight: the cycle nobody talks about','Sleep &middot; 6 min read') +
  relatedCard('/healthrankings-article-type-2-diabetes-complete-guide.html','linear-gradient(135deg,#F0FDFA,#99F6E4)','<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>','Type 2 diabetes: what your doctor doesn\u2019t have time to explain','Diabetes &middot; 14 min read');

fs.writeFileSync(path.join(dir, 'healthrankings-article-anxiety-blood-pressure.html'), SHELL(
  'Anxiety and blood pressure: are you measuring stress or a real problem?',
  'White-coat syndrome is real. Learn how to get accurate readings at home and when high numbers actually warrant concern.',
  'Mental Health','background:#F5F3FF;color:#6D28D9',
  'linear-gradient(135deg,#F5F3FF 0%,#DDD6FE 50%,#7C3AED 100%)',
  '<svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="0.8"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>',
  'Anxiety & Blood Pressure','April 24, 2026','Mental Health &middot; 7 min read',
  anxietyToc, anxietyBody, anxietyRelated
));
console.log('3/4 anxiety-bp');

// ===== 4. WALKING VS RUNNING =====
const walkingBody = `
<h2 id="intro">The fitness world has a bias — and it's costing people results</h2>

<p>There's an assumption baked into fitness culture: harder is better. Running beats walking. Intensity beats consistency. If you're not sweating, it doesn't count.</p>

<p>The research tells a different story. When it comes to cardiovascular health specifically — reducing heart disease, stroke, and early death — the gap between walking and running is much smaller than most people think. And in some populations, walking may actually be <em>better</em>.</p>

<div class="key-takeaway">
<div class="label">Key Takeaway</div>
<p>Walking and running reduce cardiovascular risk by similar amounts <strong>when energy expenditure is equal</strong>. A brisk 45-minute walk and a 25-minute run burn roughly the same calories — and produce comparable heart health benefits.</p>
</div>

<h2 id="data">What the largest studies show</h2>

<p>The National Runners' Health Study and the National Walkers' Health Study — two of the largest prospective studies on exercise and cardiovascular outcomes — tracked over 33,000 runners and 15,000 walkers for an average of 6 years.</p>

<p>The results, published in Arteriosclerosis, Thrombosis, and Vascular Biology, were striking:</p>

<ul>
<li>Running reduced the risk of hypertension by 4.2%. Walking reduced it by 7.2%.</li>
<li>Running reduced high cholesterol risk by 4.3%. Walking reduced it by 7.0%.</li>
<li>Running reduced heart disease risk by 4.5%. Walking reduced it by 9.3%.</li>
<li>Running reduced diabetes risk by 12.1%. Walking reduced it by 12.3%.</li>
</ul>

<p>The key finding: <strong>when matched for energy expenditure, walking produced equal or greater risk reductions</strong> across every cardiovascular risk factor measured.</p>

<div class="evidence-box">
<div class="label">Why walking sometimes wins</div>
<p>The study authors noted that walkers showed greater risk reductions partly because the walking group had higher adherence over time and lower injury rates. The best exercise for heart health is the one you actually do — consistently, for years, without getting hurt.</p>
</div>

<h2 id="intensity">Does intensity matter at all?</h2>

<p>Yes — but less than you'd think for heart health specifically.</p>

<p>Higher-intensity exercise does produce some additional benefits: improved VO2 max (aerobic capacity), better glucose disposal, and greater caloric efficiency (more benefit per minute). If you're time-constrained, running gives you more cardiovascular stimulus in less time.</p>

<p>But the dose-response curve for cardiovascular mortality is steeply front-loaded. A 2019 meta-analysis in the British Journal of Sports Medicine found that the biggest jump in benefit comes from going from sedentary to <strong>any</strong> regular activity. Going from zero to 150 minutes of walking per week reduces all-cause mortality by about 30%. Doubling that to 300 minutes adds only another 5–10%.</p>

<p>In other words, the first 30 minutes matter far more than the last 30.</p>

<h2 id="injury">The injury factor</h2>

<p>This is where walking has an undeniable advantage. Running-related injuries affect 30–50% of runners per year, with the most common being runner's knee, shin splints, Achilles tendinopathy, and stress fractures. Walking injuries are rare — under 5% incidence.</p>

<p>For people over 50, those with joint issues, or anyone recovering from injury, the risk-reward calculation shifts decisively toward walking. A 60-year-old who walks 5 days a week for 10 years will accumulate far more cardiovascular benefit than one who runs for 2 years and then stops due to knee pain.</p>

<h2 id="practical">Practical framework: which to choose</h2>

<p><strong>Choose walking if:</strong></p>
<ul>
<li>You're currently sedentary and starting fresh</li>
<li>You have joint issues, are overweight, or are over 55</li>
<li>You value consistency and low injury risk</li>
<li>You can dedicate 30–45 minutes most days</li>
</ul>

<p><strong>Choose running if:</strong></p>
<ul>
<li>You're already active and want to increase intensity</li>
<li>You're time-constrained (20–30 minutes is all you have)</li>
<li>You enjoy it (enjoyment predicts adherence better than anything else)</li>
<li>You want to improve VO2 max and aerobic performance</li>
</ul>

<p><strong>Best of both:</strong> Walk daily, run 2–3 times per week. This gives you the consistency of walking with the intensity boost of running while minimizing injury risk.</p>

<h2 id="speed">How fast should you walk?</h2>

<p>Not all walking is equal. Strolling (2 mph) has minimal cardiovascular benefit. Brisk walking (3.5–4.5 mph) is where the gains happen. A simple test: if you can talk comfortably but couldn't sing, you're in the right zone.</p>

<p>A 2023 study in JAMA Internal Medicine found that walking at a pace of at least 3.7 mph was associated with a <strong>35% reduction in cardiovascular events</strong> compared to slower walking — independent of total distance or duration. Speed matters.</p>

<p>For an extra boost, add hills or incline treadmill walking. Incline walking increases heart rate and calorie burn by 30–60% without the joint impact of running.</p>

<h2 id="bottom-line">The bottom line</h2>

<p>Running is more time-efficient. Walking is more sustainable. Both meaningfully reduce your risk of heart disease, stroke, diabetes, and early death. The data strongly suggests that <strong>what matters most is total energy expenditure and consistency — not speed</strong>.</p>

<div class="key-takeaway">
<div class="label">Bottom line</div>
<p>If you enjoy running and your joints can handle it, keep running. If you prefer walking or have physical limitations, walk briskly for 30–45 minutes most days and know that you're getting comparable cardiovascular protection. The worst exercise for heart health is the one you quit doing.</p>
</div>`;

const walkingToc = toc([['intro','The fitness bias'],['data','What the largest studies show'],['intensity','Does intensity matter?'],['injury','The injury factor'],['practical','Which to choose'],['speed','How fast should you walk?'],['bottom-line','The bottom line']]);

const walkingRelated = relatedCard('/healthrankings-article-daily-habits-lower-blood-pressure.html','linear-gradient(135deg,#1E40AF,#3B82F6,#14B8A6)','<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/></svg>','Daily habits that actually lower blood pressure','Wellness &middot; 8 min read') +
  relatedCard('/healthrankings-article-creatine-not-just-bodybuilders.html','linear-gradient(135deg,#FFFBEB,#FDE68A)','<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><path d="M6 1v3M10 1v3M14 1v3"/></svg>','Creatine isn\u2019t just for bodybuilders','Supplements &middot; 10 min read') +
  relatedCard('/healthrankings-article-anxiety-blood-pressure.html','linear-gradient(135deg,#F5F3FF,#DDD6FE)','<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>','Anxiety and blood pressure: stress or real problem?','Mental Health &middot; 7 min read');

fs.writeFileSync(path.join(dir, 'healthrankings-article-walking-vs-running.html'), SHELL(
  'Walking vs. running: which actually matters more for heart health?',
  'The answer isn\u2019t what most people expect. We break down the research on exercise intensity, duration, and cardiovascular outcomes.',
  'Fitness','background:#ECFDF5;color:#047857',
  'linear-gradient(135deg,#ECFDF5 0%,#A7F3D0 50%,#059669 100%)',
  '<svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="0.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
  'Walking vs. Running','April 24, 2026','Fitness &middot; 9 min read',
  walkingToc, walkingBody, walkingRelated
));
console.log('4/4 walking-vs-running');

console.log('All 4 articles created.');
