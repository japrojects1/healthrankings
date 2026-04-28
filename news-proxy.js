// news-proxy.js — Add this to your Hostinger VPS Express server
// Or run standalone: node news-proxy.js
// Then point healthrankings-news.html to: http://YOUR_VPS_IP:3456/news?q=health

const https = require('https');
const http  = require('http');

const APIKEY = process.env.NEWSAPI_KEY;
const PORT   = 3456;

if (!APIKEY) {
  console.error('Set NEWSAPI_KEY in the environment before starting news-proxy.js');
  process.exit(1);
}

http.createServer((req, res) => {
  // CORS — allow your domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url  = new URL(req.url, `http://localhost:${PORT}`);
  const q    = url.searchParams.get('q') || 'health';
  const sort = url.searchParams.get('sort') || 'publishedAt';
  const page = url.searchParams.get('page') || '1';
  const cat  = url.searchParams.get('category') || '';
  const src  = url.searchParams.get('sources') || '';

  let apiPath;
  if (cat) {
    apiPath = `/v2/top-headlines?category=${encodeURIComponent(cat)}&country=us&pageSize=20&page=${page}&apiKey=${APIKEY}`;
  } else if (src) {
    apiPath = `/v2/top-headlines?sources=${encodeURIComponent(src)}&pageSize=20&page=${page}&apiKey=${APIKEY}`;
  } else {
    apiPath = `/v2/everything?q=${encodeURIComponent(q)}&sortBy=${sort}&pageSize=20&page=${page}&language=en&apiKey=${APIKEY}`;
  }

  const options = {
    hostname: 'newsapi.org',
    path: apiPath,
    method: 'GET',
    headers: { 'User-Agent': 'HealthRankings/1.0' }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', chunk => data += chunk);
    proxyRes.on('end', () => {
      res.writeHead(200);
      res.end(data);
    });
  });

  proxyReq.on('error', (e) => {
    res.writeHead(500);
    res.end(JSON.stringify({ status: 'error', message: e.message }));
  });

  proxyReq.end();

}).listen(PORT, () => {
  console.log(`News proxy running on port ${PORT}`);
  console.log(`Test: curl "http://localhost:${PORT}/news?category=health"`);
});
