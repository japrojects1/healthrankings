/**
 * Proxies NewsAPI so the key stays server-side.
 * Set NEWSAPI_KEY in the host env (e.g. Vercel / Node serverless).
 * Optional: ALLOWED_API_ORIGINS — comma-separated exact origins (default includes production + local + Render URL).
 */
module.exports = async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  const defaultOrigins = [
    'https://healthrankings.co',
    'https://www.healthrankings.co',
    'https://healthrankings.onrender.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
  ];
  const extra = (process.env.ALLOWED_API_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const allowed = new Set([...defaultOrigins, ...extra]);

  const originHeader = req.headers.origin;
  let origin = typeof originHeader === 'string' ? originHeader : '';
  if (!origin && req.headers.referer) {
    try {
      origin = new URL(req.headers.referer).origin;
    } catch {
      origin = '';
    }
  }
  if (!origin || !allowed.has(origin)) {
    return res.status(403).json({
      status: 'error',
      message: 'Forbidden',
    });
  }

  const key = process.env.NEWSAPI_KEY;
  if (!key) {
    return res.status(503).json({
      status: 'error',
      message: 'News is not configured (missing NEWSAPI_KEY).',
    });
  }

  try {
    const url = new URL('https://newsapi.org/v2/top-headlines');
    url.searchParams.set('category', 'health');
    url.searchParams.set('country', 'us');
    url.searchParams.set('pageSize', '6');
    url.searchParams.set('apiKey', key);

    const upstream = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(12000),
    });
    const data = await upstream.json();

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(data);
  } catch {
    return res.status(502).json({
      status: 'error',
      message: 'Upstream fetch failed',
    });
  }
};
