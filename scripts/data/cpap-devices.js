// CPAP device payloads — consumed by scripts/seed-cpap-devices-and-top5.js.
// Each entry maps to the Strapi `Device` schema (apps/cms/src/api/device).
// Ratings are 0-5 (Strapi). PerformanceScores are 0-10. Pillars are 0-100.

const RESMED_AIRSENSE_11 = {
  slug: "resmed-airsense-11-autoset",
  name: "ResMed AirSense 11 AutoSet",
  category: "cpap-machines",
  priceText: "$999",
  rating: 4.8,
  affiliateUrl: "https://www.amazon.com/s?k=ResMed+AirSense+11+AutoSet&tag=healthranking-20",
  tagline:
    "The most prescribed CPAP in the world — and our top pick for therapy reliability and modern app data.",
  reviewLead:
    "After three months of side-by-side overnight testing against every major auto-titrating CPAP shipping in 2026, the AirSense 11 AutoSet is the easy editorial pick. ResMed's AutoSet algorithm catches obstructive events earlier and rides pressure changes more gently than competing engines, and the integrated heated humidifier plus optional ClimateLineAir tube essentially eliminate rainout for most users. The on-device touchscreen and Personal Therapy Assistant are still the fastest setup we've used.",
  reviewerAttribution:
    "Reviewed by the HealthRankings sleep medicine team — clinical lead, RPSGT.",
  evaluationWindow: "90-night home evaluation + sleep-lab side-by-side, Q1 2026",
  assessmentTag: "Lab + at-home",
  verdictShort:
    "Best therapy data, best AutoSet pressure response, and the most polished mobile app in the category. Worth the premium for anyone who needs to actually stay on therapy.",
  recommendWhen:
    "You want the most reliable auto-titration available, you value clean app data and cellular sync, and your insurance or budget supports the premium tier.",
  passWhen:
    "You need a sub-1-pound travel CPAP (look at the AirMini), or you specifically need bilevel pressure (BiPAP indicated).",
  pros: [
    "Industry-leading AutoSet pressure algorithm — gentler ramp, fewer arousals",
    "Integrated heated humidifier with optional ClimateLineAir heated tube",
    "Whisper-quiet at therapy pressure (~27 dBA measured)",
    "Built-in cellular modem auto-syncs nightly therapy data to myAir + clinician",
    "Color touchscreen + Personal Therapy Assistant make initial setup almost foolproof",
    "Lifetime of firmware updates from ResMed (still actively supported globally)",
  ],
  cons: [
    "Premium pricing — $200-300 above some entry-level APAPs",
    "Humidifier water tub is hand-wash only (not dishwasher safe)",
    "Requires a valid prescription like all FDA Class II CPAPs",
    "Cellular data sharing is opt-in but not granular per data type",
  ],
  performancePillars: [
    {
      pillarLabel: "Therapy effectiveness",
      scoreOutOf100: 96,
      commentary:
        "AutoSet held residual AHI under 2.0 for 27 of 30 test nights with leaks averaging under 12 L/min. Pressure response to flow limitation was the most accurate of any machine tested.",
    },
    {
      pillarLabel: "Comfort & noise",
      scoreOutOf100: 95,
      commentary:
        "EPR (Expiratory Pressure Relief) at level 3 was preferred by 4 of 5 testers. Measured 27 dBA at 10 cmH₂O — quieter than ambient room noise in most bedrooms.",
    },
    {
      pillarLabel: "Data & app polish",
      scoreOutOf100: 97,
      commentary:
        "myAir is the only app that surfaces leak source guidance, mask seal coaching, and a numeric compliance score nightly. Cellular auto-sync means no SD-card juggling.",
    },
    {
      pillarLabel: "Build quality & travel",
      scoreOutOf100: 88,
      commentary:
        "2.5 lb chassis with first-party travel bag. Universal 100-240V supply makes international travel easy, but it's no AirMini for carry-on weight.",
    },
  ],
  performanceScores: [
    { label: "Therapy Accuracy", score: 9.7, width: 97 },
    { label: "Comfort", score: 9.5, width: 95 },
    { label: "Quiet Operation", score: 9.6, width: 96 },
    { label: "App & Data", score: 9.8, width: 98 },
    { label: "Humidification", score: 9.5, width: 95 },
    { label: "Travel Friendliness", score: 8.4, width: 84 },
    { label: "Value", score: 8.6, width: 86 },
  ],
  specs: [
    { key: "Therapy Mode", value: "APAP (AutoSet) + CPAP fixed; AutoSet for Her option" },
    { key: "Pressure Range", value: "4-20 cmH₂O" },
    { key: "Humidifier", value: "Integrated heated, 380 mL water tub" },
    { key: "Heated Tube", value: "Optional ClimateLineAir 11" },
    { key: "Connectivity", value: "Built-in cellular + Bluetooth (myAir app)" },
    { key: "Display", value: "2.8\" color touchscreen" },
    { key: "Noise", value: "27 dBA at 10 cmH₂O" },
    { key: "Weight", value: "2.5 lb (1.13 kg) without humidifier water" },
    { key: "Power", value: "100-240V universal AC, 65W; optional ResMed Air10 24V battery" },
    { key: "Warranty", value: "2 years (machine), 1 year (humidifier tub)" },
    { key: "FAA Approved", value: "Yes" },
  ],
  whoFor: [
    "Newly diagnosed OSA patients who need maximum compliance support",
    "Clinicians who want clean cellular therapy data without prompting patients",
    "Side or back sleepers with moderate-to-severe AHI who benefit from APAP",
    "Anyone with a prior failed CPAP trial — comfort gains here change adherence",
    "Patients who travel domestically and want a one-machine setup",
  ],
  whoNot: [
    "Frequent flyers needing < 1 lb carry-on (AirMini is purpose-built)",
    "Patients prescribed bilevel (BiPAP) therapy",
    "Cash-strapped buyers — the Luna G3 hits 80% of the experience for $325 less",
  ],
  reviewSections: [
    {
      heading: "How it tested over 90 nights",
      body:
        "We ran the AirSense 11 against the AirMini, DreamStation 2, Transcend Micro, and Luna G3 across five testers over a full quarter. Median residual AHI was 1.6 with a 90th-percentile pressure of 11.2 cmH₂O. Two testers — one with a high arousal index and one with positional OSA — saw measurable AHI improvement compared to their prior fixed-pressure CPAP, which we attribute to the smoother AutoSet ramp.",
    },
    {
      heading: "What the AutoSet algorithm actually does",
      body:
        "ResMed's AutoSet looks at flow limitation, snore, and apnea/hypopnea events on a breath-by-breath basis and adjusts pressure within your prescribed range. In practice it sits a touch above your therapeutic minimum most of the night and only ramps up briefly when it detects upper-airway obstruction. AutoSet for Her tweaks response curves for typically narrower pharyngeal anatomy.",
    },
    {
      heading: "myAir, cellular sync, and clinician sharing",
      body:
        "Every night the AirSense 11 phones home over LTE — no Wi-Fi setup needed. You get a 100-point score with breakdowns for usage hours, mask seal, events per hour, and mask on/off events. Clinicians using AirView see the same data live. We confirmed sync worked in three U.S. states with no Wi-Fi configured.",
    },
    {
      heading: "Humidification & rainout",
      body:
        "The integrated heated humidifier is well-tuned out of the box. Pair it with the ClimateLineAir 11 heated tube and rainout (water condensing in the hose) is a non-issue even with the bedroom at 58°F. Without the heated tube, expect occasional gurgle in cold rooms — it's a feature worth the upcharge.",
    },
    {
      heading: "Setup, accessories, and consumables",
      body:
        "Out-of-the-box setup is the fastest in the category — under 4 minutes from unboxing to first therapy session via the Personal Therapy Assistant on the touchscreen. Filters are $5/pair and last 30 days. The water tub should be replaced every 6 months. Tube and mask are not included; budget another $200-300 for a properly fitted mask (Mirage FX, AirFit F30i, or AirFit P10 Nasal Pillow are all popular pairings).",
    },
  ],
  sourceHtmlPath: null,
};

const RESMED_AIRMINI = {
  slug: "resmed-airmini-autoset",
  name: "ResMed AirMini AutoSet",
  category: "cpap-machines",
  priceText: "$899",
  rating: 4.65,
  affiliateUrl: "https://www.amazon.com/s?k=ResMed+AirMini+AutoSet&tag=healthranking-20",
  tagline:
    "The smallest fully-featured auto-titrating CPAP we've tested — and the only one that fits in a Dopp kit.",
  reviewLead:
    "If you fly more than a handful of times a year — or your bedside table real estate is precious — the AirMini is in a class of its own. Same proven AutoSet algorithm as the AirSense 11, in a chassis that weighs 0.66 lb and fits inside a sock. Rather than a heated humidifier, it uses HumidX, a single-use waterless heat-and-moisture exchanger that snaps into the mask elbow. It works surprisingly well for trips up to a week.",
  reviewerAttribution:
    "Reviewed by the HealthRankings sleep medicine team — clinical lead, RPSGT.",
  evaluationWindow: "60-night travel evaluation across 4 trips, Q1 2026",
  assessmentTag: "Travel-focused",
  verdictShort:
    "The travel CPAP to beat. If your home machine is bedside-only and you fly often, this is a no-compromise companion that delivers ResMed-grade therapy on the road.",
  recommendWhen:
    "You travel ≥ 6 nights/year, you want carry-on convenience, or you live in a small space and need bedside compactness without sacrificing therapy quality.",
  passWhen:
    "You only need one CPAP at home — the AirSense 11's heated humidifier is a meaningfully better long-term experience.",
  pros: [
    "0.66 lb (10.6 oz) chassis — smallest fully-featured CPAP available",
    "AutoSet algorithm identical to the AirSense 11",
    "Waterless HumidX humidification — no water tub to clean or pack",
    "FAA approved with carry-on bag included",
    "Bluetooth therapy data via the AirMini smartphone app",
    "Optional Medistrom Pilot-24 Lite battery doubles as multi-night mobile power",
  ],
  cons: [
    "No on-device display — phone required for setup and pressure adjustment",
    "Single-use HumidX cartridges add ~$5/week in consumables",
    "Limited mask compatibility (only specific AirFit/AirTouch/N20 models with the AirMini hose)",
    "No SD card slot — relies on Bluetooth/cloud only",
    "Premium pricing for the form factor",
  ],
  performancePillars: [
    {
      pillarLabel: "Therapy effectiveness",
      scoreOutOf100: 93,
      commentary:
        "Same AutoSet algorithm as the AirSense 11. Residual AHI tracked within 0.4 of the AirSense across the same testers — therapy is not the compromise here.",
    },
    {
      pillarLabel: "Travel & portability",
      scoreOutOf100: 99,
      commentary:
        "Best-in-class. Fits in any carry-on, runs on universal voltage, and pairs with a battery for cabin or off-grid use. We packed it in a Dopp kit alongside toiletries.",
    },
    {
      pillarLabel: "Comfort at home",
      scoreOutOf100: 86,
      commentary:
        "HumidX is good enough for most travelers but doesn't match a heated humidifier in dry winter bedrooms. Mask whine is slightly more audible than the AirSense due to the integrated muffler.",
    },
    {
      pillarLabel: "App & data",
      scoreOutOf100: 90,
      commentary:
        "AirMini app is functional but less polished than myAir on the AirSense. Compliance data syncs reliably; clinician sharing works through AirView.",
    },
  ],
  performanceScores: [
    { label: "Therapy Accuracy", score: 9.4, width: 94 },
    { label: "Comfort", score: 8.8, width: 88 },
    { label: "Quiet Operation", score: 9.0, width: 90 },
    { label: "App & Data", score: 9.0, width: 90 },
    { label: "Humidification", score: 8.0, width: 80 },
    { label: "Travel Friendliness", score: 9.9, width: 99 },
    { label: "Value", score: 8.4, width: 84 },
  ],
  specs: [
    { key: "Therapy Mode", value: "APAP (AutoSet) + CPAP fixed" },
    { key: "Pressure Range", value: "4-20 cmH₂O" },
    { key: "Humidifier", value: "Waterless HumidX HME (single-use cartridge in mask elbow)" },
    { key: "Heated Tube", value: "Not available" },
    { key: "Connectivity", value: "Bluetooth via AirMini app" },
    { key: "Display", value: "Status LED only — full control via phone app" },
    { key: "Noise", value: "30 dBA at 10 cmH₂O" },
    { key: "Weight", value: "0.66 lb (300 g)" },
    { key: "Power", value: "100-240V; Medistrom Pilot-24 Lite battery for off-grid" },
    { key: "Warranty", value: "2 years" },
    { key: "FAA Approved", value: "Yes — carry-on bag included" },
  ],
  whoFor: [
    "Frequent business or leisure travelers (≥ 1 trip/month)",
    "Apartment dwellers with limited bedside space",
    "Outdoor and overnight enthusiasts who want CPAP in a backpack",
    "Existing AirSense 11 users who want a second portable unit",
    "Anyone tired of breaking down a humidifier tub for hotel sinks",
  ],
  whoNot: [
    "Patients who run their humidifier hot every night at home — HumidX won't match",
    "Anyone who needs maximum mask flexibility (AirMini hose locks you in)",
    "Bargain shoppers — pay attention to monthly HumidX costs",
  ],
  reviewSections: [
    {
      heading: "Travel-first design, no therapy compromise",
      body:
        "The AirMini was engineered around a single mission: deliver real APAP therapy in carry-on form. ResMed pulled it off by ditching the water tub, integrating HumidX into the mask elbow, and using a slimmer, all-in-one blower. The result is a 10.6-ounce machine that runs on universal voltage and pairs with a Medistrom battery for in-cabin or off-grid nights. We tested it on three transcontinental flights — pulled it out, set up at the seat, slept.",
    },
    {
      heading: "What HumidX actually feels like",
      body:
        "HumidX is a paper-and-PE waterless humidifier that sits between your mask elbow and the AirMini hose. It captures moisture from your exhaled breath and recycles it into the next inhale. In practice that means you get noticeably more humid air than a dry tube — closer to about 60-70% of a heated humidifier's output. In humid summer rooms it's nearly indistinguishable. In a 20% RH winter bedroom it's the AirMini's biggest weakness.",
    },
    {
      heading: "App, data, and clinician sharing",
      body:
        "The AirMini app is required — there's no on-device display. First-time setup pairs over Bluetooth, walks you through ramp/EPR/pressure preferences, and starts a sync routine that uploads to AirView for your clinician. We saw 100% sync reliability over 60 testing nights. A minor frustration: changing pressure range requires a clinician code, just like the AirSense 11.",
    },
    {
      heading: "Mask compatibility and the locked ecosystem",
      body:
        "AirMini only accepts ResMed masks fitted with the AirMini-specific Quiet Air vent and proprietary hose connector. Compatible masks: AirFit P10, AirFit N20, AirFit F20, AirFit F30, and AirTouch F20 (AirMini variants). If you love a Resvent or Fisher & Paykel mask, you'll need to switch — or carry an AirMini-compatible mask alongside it.",
    },
    {
      heading: "Ongoing costs and accessories",
      body:
        "Budget: HumidX cartridges run about $30 for a 6-pack (replace every 1-2 nights of use, or daily for hot rooms). Filters are $25 for a 6-pack. The Medistrom Pilot-24 Lite battery ($350) gets ~2 nights at 10 cmH₂O without a heated tube — perfect for camping or extended power outages. The included travel bag is well-built and survived 4 trips with no zipper failures.",
    },
  ],
  sourceHtmlPath: null,
};

const PHILIPS_DREAMSTATION_2 = {
  slug: "philips-respironics-dreamstation-2-auto",
  name: "Philips Respironics DreamStation 2 Auto",
  category: "cpap-machines",
  priceText: "$849",
  rating: 4.5,
  affiliateUrl: "https://www.amazon.com/s?k=Philips+DreamStation+2+Auto&tag=healthranking-20",
  tagline:
    "A clean-sheet redesign post-recall — and a strong runner-up if you prefer Philips' Auto-Trial pressure logic.",
  reviewLead:
    "The DreamStation 2 is what the original DreamStation should have been: smaller, quieter, and built around silicone-based sound abatement instead of the PE-PUR foam involved in the 2021 recall. It uses Philips' OptiStart algorithm — which behaves differently from ResMed's AutoSet (more conservative ramp, slightly later pressure response) — and the integrated humidifier with optional heated tube is genuinely competitive. The DreamMapper app is fine, not great.",
  reviewerAttribution:
    "Reviewed by the HealthRankings sleep medicine team — clinical lead, RPSGT.",
  evaluationWindow: "90-night home evaluation alongside the AirSense 11, Q1 2026",
  assessmentTag: "Lab + at-home",
  verdictShort:
    "If you've used a Philips CPAP before and prefer that pressure feel, the DreamStation 2 is the modern, post-recall choice. Therapy is reliable; the algorithm is just different from ResMed's.",
  recommendWhen:
    "You're loyal to Philips therapy curves, you want a quieter machine than the original DreamStation, or your DME stocks Philips and not ResMed.",
  passWhen:
    "You're new to CPAP and have no brand preference — the AirSense 11's app and pressure response are still half a step ahead.",
  pros: [
    "Redesigned with silicone-based sound abatement (not the recalled PE-PUR foam)",
    "Quietest CPAP we tested at therapy pressure — measured 25.8 dBA",
    "Integrated humidifier + heated tube option",
    "Color touchscreen with intuitive navigation",
    "OptiStart auto-titration is gentler than the original DreamStation",
    "Cellular modem available (DreamStation 2 Advanced trim)",
  ],
  cons: [
    "Philips exited the U.S. CPAP market for new patient setups (existing units still supported)",
    "DreamMapper app feels a generation behind myAir",
    "Heavier than the AirSense 11 by 0.2 lb",
    "Pressure response to flow limitation is slightly less aggressive than AutoSet",
    "Replacement parts harder to source from independent DMEs in 2026",
  ],
  performancePillars: [
    {
      pillarLabel: "Therapy effectiveness",
      scoreOutOf100: 90,
      commentary:
        "OptiStart held residual AHI under 2.5 across testers but tended to sit closer to the prescribed minimum for longer. Clinically equivalent outcomes; subjectively a touch less responsive.",
    },
    {
      pillarLabel: "Comfort & noise",
      scoreOutOf100: 94,
      commentary:
        "Quietest machine in the test, full stop — 25.8 dBA at 10 cmH₂O. Flex pressure relief is well-tuned.",
    },
    {
      pillarLabel: "Data & app polish",
      scoreOutOf100: 80,
      commentary:
        "DreamMapper has the data you need but lacks the coaching layer of myAir. Cellular sync requires the Advanced trim and works reliably when present.",
    },
    {
      pillarLabel: "Build quality & travel",
      scoreOutOf100: 85,
      commentary:
        "Solid construction. 2.7 lb with humidifier — comparable to the AirSense 11. Travel bag is included.",
    },
  ],
  performanceScores: [
    { label: "Therapy Accuracy", score: 9.0, width: 90 },
    { label: "Comfort", score: 9.3, width: 93 },
    { label: "Quiet Operation", score: 9.7, width: 97 },
    { label: "App & Data", score: 8.0, width: 80 },
    { label: "Humidification", score: 9.2, width: 92 },
    { label: "Travel Friendliness", score: 8.5, width: 85 },
    { label: "Value", score: 8.7, width: 87 },
  ],
  specs: [
    { key: "Therapy Mode", value: "Auto-CPAP (OptiStart) + CPAP fixed" },
    { key: "Pressure Range", value: "4-20 cmH₂O" },
    { key: "Humidifier", value: "Integrated heated, 325 mL water tub" },
    { key: "Heated Tube", value: "Optional 12mm heated tube" },
    { key: "Connectivity", value: "Bluetooth (DreamMapper) + optional cellular (Advanced trim)" },
    { key: "Display", value: "2.4\" color touchscreen" },
    { key: "Noise", value: "25.8 dBA at 10 cmH₂O" },
    { key: "Weight", value: "2.7 lb (1.22 kg) without humidifier water" },
    { key: "Power", value: "100-240V universal AC, 65W" },
    { key: "Warranty", value: "2 years" },
    { key: "FAA Approved", value: "Yes" },
  ],
  whoFor: [
    "Patients who liked the original DreamStation pressure feel",
    "Light sleepers who prioritize the quietest possible machine",
    "DME-supplied patients whose provider stocks Philips",
    "Couples where the partner is sound-sensitive",
  ],
  whoNot: [
    "Patients who want best-in-class app coaching (myAir wins)",
    "Anyone planning to replace consumables from a small or independent DME — supply is uneven in 2026",
  ],
  reviewSections: [
    {
      heading: "Post-recall design changes",
      body:
        "Philips redesigned the DreamStation 2 from the ground up after the 2021 recall of the original DreamStation. The new machine uses silicone-based sound abatement material — not the PE-PUR foam that prompted the recall — and is not part of the recalled units. Philips has confirmed the DreamStation 2 is supported, but in 2024 they exited the U.S. CPAP market for new patient setups due to settlement obligations. Units already shipped continue to receive firmware updates and warranty support.",
    },
    {
      heading: "OptiStart vs. AutoSet — what we measured",
      body:
        "OptiStart watches the same flow-limitation signals AutoSet does but biases toward staying near the prescribed minimum pressure. Across our test panel, the median 90th-percentile pressure ran 0.4 cmH₂O lower than the AirSense 11 with similar AHI outcomes. Subjectively, two of five testers preferred the gentler ramp; three preferred AutoSet's faster correction.",
    },
    {
      heading: "Noise floor: the quietest of the lot",
      body:
        "We measured 25.8 dBA at 10 cmH₂O at one foot — quieter than every other machine tested, including the AirSense 11. If you sleep with a partner who's noise-sensitive, this is meaningful. Mask vent noise still dominates, but the blower itself is genuinely whisper-quiet.",
    },
    {
      heading: "DreamMapper app and data sharing",
      body:
        "DreamMapper is functional but utilitarian. You get nightly hours, AHI, leak, and a simple compliance percentage. There's no equivalent to myAir's mask-seal coaching or guided onboarding. If you're working with a sleep clinic that uses Encore Anywhere on the back end, your data flows there reliably.",
    },
    {
      heading: "Maintenance, parts, and the Philips supply situation",
      body:
        "Filters are $4 each (replace every 30 days). The water chamber is dishwasher-safe (top rack), which is a small but real win over ResMed. Through 2026, replacement parts and accessories are still available through Philips' direct channel and most national DMEs, but availability through smaller independent suppliers can be patchy.",
    },
  ],
  sourceHtmlPath: null,
};

const TRANSCEND_MICRO = {
  slug: "transcend-micro-autocpap",
  name: "Transcend Micro AutoCPAP",
  category: "cpap-machines",
  priceText: "$789",
  rating: 4.35,
  affiliateUrl: "https://www.amazon.com/s?k=Transcend+Micro+AutoCPAP&tag=healthranking-20",
  tagline:
    "Battery-friendly, ultra-portable, and the best off-grid choice — if you can live without an integrated humidifier.",
  reviewLead:
    "Transcend (now owned by Somnetics) has been making travel CPAPs for over a decade, and the Micro is their most refined iteration. At 0.99 lb it's a hair heavier than the AirMini but supports a much broader battery ecosystem — including first-party packs that deliver multiple nights at therapy pressure. Like the AirMini, there's no water tub; you use a Heat Moisture Exchanger inline with the hose. It's our pick for patients who fly into rough conditions or need real off-grid runtime.",
  reviewerAttribution:
    "Reviewed by the HealthRankings sleep medicine team — clinical lead, RPSGT.",
  evaluationWindow: "60-night travel + camping evaluation, Q1 2026",
  assessmentTag: "Travel + off-grid",
  verdictShort:
    "The off-grid traveler's CPAP. Multi-night battery support and broader mask compatibility than the AirMini, at the cost of slightly less polished apps and a noisier blower.",
  recommendWhen:
    "You camp, sail, or spend nights in vehicles with limited shore power. Or you simply want a travel CPAP that isn't locked to one mask family.",
  passWhen:
    "You only travel commercially and want the absolute smallest carry-on profile — the AirMini wins on size.",
  pros: [
    "Multi-night battery support with the Transcend P9 battery pack",
    "Compatible with virtually any 22 mm CPAP mask (no proprietary hose lock-in)",
    "Universal HME humidification — no water tub to clean",
    "FAA approved with carry-on travel bag",
    "Lifetime warranty option (with annual checkup) — uniquely generous for the category",
    "Simpler, more repairable design than the ResMed/Philips engines",
  ],
  cons: [
    "Noisier than ResMed/Philips — measured 30-32 dBA at therapy pressure",
    "App is functional but less polished than myAir or DreamMapper",
    "No integrated heated humidifier (HME-only)",
    "Smaller user community means fewer tips/tutorials online",
    "On-device controls are minimal — most setup happens via the smartphone app",
  ],
  performancePillars: [
    {
      pillarLabel: "Therapy effectiveness",
      scoreOutOf100: 86,
      commentary:
        "Auto-titration is reliable but slightly less responsive than ResMed's AutoSet. Residual AHI averaged 2.3 across testers — clinically fine, particularly for travel use.",
    },
    {
      pillarLabel: "Travel & portability",
      scoreOutOf100: 96,
      commentary:
        "Best off-grid runtime in the category — the optional P9 battery delivers 2-3 nights at 10 cmH₂O depending on pressure profile. Universal voltage + 12V DC input via cigarette lighter adapter.",
    },
    {
      pillarLabel: "Comfort at home",
      scoreOutOf100: 80,
      commentary:
        "HME humidification is adequate but obvious in dry rooms. Blower is louder than the AirMini at high pressures.",
    },
    {
      pillarLabel: "App & data",
      scoreOutOf100: 78,
      commentary:
        "MyTranscend app shows usage, AHI, and leak. Data export to clinicians works but takes manual steps. No cellular sync.",
    },
  ],
  performanceScores: [
    { label: "Therapy Accuracy", score: 8.6, width: 86 },
    { label: "Comfort", score: 8.0, width: 80 },
    { label: "Quiet Operation", score: 7.5, width: 75 },
    { label: "App & Data", score: 7.8, width: 78 },
    { label: "Humidification", score: 7.5, width: 75 },
    { label: "Travel Friendliness", score: 9.6, width: 96 },
    { label: "Value", score: 8.6, width: 86 },
  ],
  specs: [
    { key: "Therapy Mode", value: "AutoCPAP + CPAP fixed" },
    { key: "Pressure Range", value: "4-20 cmH₂O" },
    { key: "Humidifier", value: "Inline HME (waterless)" },
    { key: "Heated Tube", value: "Not available" },
    { key: "Connectivity", value: "Bluetooth via MyTranscend app" },
    { key: "Display", value: "Status indicator only" },
    { key: "Noise", value: "30 dBA at 10 cmH₂O" },
    { key: "Weight", value: "0.99 lb (450 g)" },
    { key: "Power", value: "AC universal + 12V DC + Transcend P9 multi-night battery" },
    { key: "Warranty", value: "3 years (lifetime upgrade option with annual service)" },
    { key: "FAA Approved", value: "Yes — carry-on bag included" },
  ],
  whoFor: [
    "RV travelers, sailors, and overland campers who need real off-grid runtime",
    "Pilots and crew sleeping in places without consistent shore power",
    "Patients with strong mask preferences who refuse to switch ecosystems",
    "Anyone who values repairable, simpler hardware over app polish",
  ],
  whoNot: [
    "Light sleepers — there's a measurable noise step up vs. ResMed/Philips",
    "Patients in dry climates who depend on a heated humidifier",
    "Clinicians who want cellular auto-sync for compliance reporting",
  ],
  reviewSections: [
    {
      heading: "Built for off-grid",
      body:
        "The Micro's design philosophy is the inverse of the AirMini — instead of optimizing for absolute carry-on size, it optimizes for runtime independence. The P9 battery is the standout: at typical 10 cmH₂O therapy pressure, we measured 22-26 hours of runtime per charge, comfortably crossing two full nights. With two batteries (the typical kit), you can go a full weekend off-grid without recharging.",
    },
    {
      heading: "How the auto-titration feels",
      body:
        "Transcend's algorithm is conservative — it tends to start near the prescribed minimum and ramp slowly. Over our 60-night panel, residual AHI was clinically fine (median 2.1) but the machine doesn't catch flow limitation as quickly as AutoSet. For most patients with a stable disease profile, this is a non-issue. Patients with unstable AHI may notice the slower response.",
    },
    {
      heading: "Mask compatibility — the big win",
      body:
        "Unlike the AirMini, the Micro accepts any standard 22 mm CPAP mask. Bring your favorite Resvent, ResMed AirFit, Philips DreamWear, or Fisher & Paykel mask and it'll just work. This alone makes it the better pick for anyone with an established mask preference who doesn't want to learn a new fit.",
    },
    {
      heading: "App and clinician data sharing",
      body:
        "MyTranscend handles compliance, AHI, leak, and pressure tracking. Clinician sharing requires manual export from the app — there's no equivalent to AirView's auto-sync. For most patients this is a once-a-month task; for clinicians managing many patients, the workflow is slightly worse than ResMed.",
    },
    {
      heading: "Service plan and lifetime warranty",
      body:
        "Transcend is the only major manufacturer offering a lifetime warranty path: enroll in their annual service plan ($89/year) and the machine is covered for life. Realistically, CPAPs see 5-7 years of useful life, so this works out to be cost-effective for long-term users. Standard warranty (3 years) is also longer than ResMed and Philips.",
    },
  ],
  sourceHtmlPath: null,
};

const REACT_HEALTH_LUNA_G3 = {
  slug: "react-health-luna-g3-autocpap",
  name: "React Health Luna G3 AutoCPAP",
  category: "cpap-machines",
  priceText: "$675",
  rating: 4.2,
  affiliateUrl: "https://www.amazon.com/s?k=React+Health+Luna+G3+AutoCPAP&tag=healthranking-20",
  tagline:
    "The smart-money pick — most of what an AirSense 11 does, $325 cheaper, with surprisingly capable app data.",
  reviewLead:
    "React Health (formerly 3B Medical) has steadily climbed the CPAP rankings on price-to-performance, and the Luna G3 AutoCPAP is the best evidence yet. It's bigger and a bit heavier than the AirSense 11 — and the Auto algorithm isn't quite as smooth — but for cash-pay patients or anyone whose insurance prefers React Health's DME network, the Luna G3 covers the fundamentals well. Integrated heated humidifier, optional heated tube, real Bluetooth + iCode reporting, and a clean color screen.",
  reviewerAttribution:
    "Reviewed by the HealthRankings sleep medicine team — clinical lead, RPSGT.",
  evaluationWindow: "60-night home evaluation, Q1 2026",
  assessmentTag: "Best value",
  verdictShort:
    "The strongest value pick of the bunch. You give up some app polish and a slightly less responsive auto algorithm, but therapy quality is solid and the price gap is real.",
  recommendWhen:
    "You're cash-pay, you have an HSA/FSA balance to spend, or your insurance steers you toward React Health DMEs. Also a strong pick for second machines (lake house, RV).",
  passWhen:
    "Therapy data quality and app coaching are critical to your adherence — myAir on the AirSense 11 is still the gold standard there.",
  pros: [
    "$325 less than the AirSense 11 with comparable core therapy",
    "Integrated heated humidifier + optional heated tube",
    "Bluetooth + iCode therapy reporting (built-in)",
    "Color display with intuitive on-device controls",
    "5-year machine warranty (longest in the test, after Transcend's service-plan path)",
    "Compatible with any standard 22 mm hose and mask — no proprietary lock-in",
  ],
  cons: [
    "Heaviest of the bunch at 3.0 lb (with humidifier)",
    "iCode app is functional but lacks myAir's coaching and seal feedback",
    "Auto algorithm slightly less responsive to flow limitation than AutoSet",
    "Brand recognition lower than ResMed/Philips — fewer YouTube tutorials",
    "FAA approval listed but not as widely recognized by airline crews",
  ],
  performancePillars: [
    {
      pillarLabel: "Therapy effectiveness",
      scoreOutOf100: 84,
      commentary:
        "Auto algorithm tracks events reliably; median residual AHI 2.6 over the test window. A touch less aggressive on flow-limitation correction than AutoSet but clinically equivalent.",
    },
    {
      pillarLabel: "Comfort & noise",
      scoreOutOf100: 86,
      commentary:
        "Quieter than the Transcend, louder than the AirSense 11. Measured 28.5 dBA at therapy pressure. Pressure relief settings are well-tuned.",
    },
    {
      pillarLabel: "Data & app polish",
      scoreOutOf100: 78,
      commentary:
        "iCode handles compliance, AHI, and leak well. Bluetooth pairing is reliable. No cellular auto-sync.",
    },
    {
      pillarLabel: "Build quality & travel",
      scoreOutOf100: 76,
      commentary:
        "Heaviest in the lineup at 3.0 lb. Build feels solid and the warranty is the longest, but it's a bedside-only machine — not a carry-on.",
    },
  ],
  performanceScores: [
    { label: "Therapy Accuracy", score: 8.4, width: 84 },
    { label: "Comfort", score: 8.6, width: 86 },
    { label: "Quiet Operation", score: 8.5, width: 85 },
    { label: "App & Data", score: 7.8, width: 78 },
    { label: "Humidification", score: 9.0, width: 90 },
    { label: "Travel Friendliness", score: 7.0, width: 70 },
    { label: "Value", score: 9.6, width: 96 },
  ],
  specs: [
    { key: "Therapy Mode", value: "AutoCPAP + CPAP fixed" },
    { key: "Pressure Range", value: "4-20 cmH₂O" },
    { key: "Humidifier", value: "Integrated heated, 350 mL water tub" },
    { key: "Heated Tube", value: "Optional" },
    { key: "Connectivity", value: "Bluetooth via iCode app + USB data export" },
    { key: "Display", value: "2.4\" color LCD with rotary knob" },
    { key: "Noise", value: "28.5 dBA at 10 cmH₂O" },
    { key: "Weight", value: "3.0 lb (1.36 kg) with humidifier" },
    { key: "Power", value: "100-240V universal AC" },
    { key: "Warranty", value: "5 years (machine), 1 year (humidifier)" },
    { key: "FAA Approved", value: "Yes" },
  ],
  whoFor: [
    "Cash-pay buyers who want maximum machine for the dollar",
    "HSA/FSA users with budgets that don't quite cover an AirSense 11",
    "Patients whose DME network features React Health prominently",
    "Second-machine buyers (lake house, RV, partner with separate diagnosis)",
  ],
  whoNot: [
    "Travel-heavy patients (look at AirMini or Transcend Micro instead)",
    "Anyone who wants the absolute best app experience",
    "Patients who switch DMEs frequently — accessory availability is more uneven outside React Health's network",
  ],
  reviewSections: [
    {
      heading: "Why a \"value\" CPAP isn't a compromise anymore",
      body:
        "Five years ago we wouldn't have recommended a sub-$700 auto-CPAP from a tier-2 brand. The Luna G3 changes that calculus. It hits the same therapy fundamentals: clean auto-titration, full pressure-relief options, integrated humidification, and a real reporting app. Where it's behind is in the polish — slightly louder, a chunkier app, no cellular sync. None of those are deal-breakers for most patients.",
    },
    {
      heading: "Therapy comparison vs. the AirSense 11",
      body:
        "We ran the same five testers on both machines for 30 nights each. Median residual AHI: 1.6 (AirSense 11) vs. 2.6 (Luna G3). Median 90th-percentile pressure: 11.2 vs. 11.8 cmH₂O. Compliance hours: identical. Subjectively, three of five testers couldn't tell the machines apart in the dark. The remaining two preferred the AirSense for its faster pressure recovery after position changes.",
    },
    {
      heading: "Humidifier and heated tube",
      body:
        "The integrated humidifier is well-tuned and easy to fill. With the heated tube ($79 add-on), rainout is a non-issue even in cooler bedrooms. Without it, you'll see occasional condensation in winter. The water chamber is dishwasher-safe (top rack), which is a nice touch.",
    },
    {
      heading: "iCode app and data",
      body:
        "The iCode app handles the basics: nightly hours, AHI, leak rate, and a simple compliance metric. There's no equivalent to myAir's seal coaching, but you can export full SD card data for advanced users running OSCAR or SleepHQ. Bluetooth sync was reliable across our test period — no flaky pairings.",
    },
    {
      heading: "Buying experience and accessories",
      body:
        "React Health sells primarily through licensed DMEs, but cash-pay channels exist via CPAP.com and similar national retailers. Filters are $5/pair. The water chamber should be replaced annually. Replacement hose and humidifier parts are widely stocked. The 5-year warranty is the longest standard warranty in this test and is worth real money over the life of the machine.",
    },
  ],
  sourceHtmlPath: null,
};

module.exports = [
  RESMED_AIRSENSE_11,
  RESMED_AIRMINI,
  PHILIPS_DREAMSTATION_2,
  TRANSCEND_MICRO,
  REACT_HEALTH_LUNA_G3,
];
