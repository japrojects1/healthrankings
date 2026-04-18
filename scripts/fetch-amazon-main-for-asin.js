#!/usr/bin/env node
/**
 * Usage: node scripts/fetch-amazon-main-for-asin.js B0XXXXXXXX
 * Prints the first m.media-amazon.com ..._AC_SL1500_.jpg found on the product page (main gallery image).
 */
const https = require('https');

const asin = process.argv[2];
if (!asin || !/^[A-Z0-9]{10}$/i.test(asin)) {
  console.error('Usage: node scripts/fetch-amazon-main-for-asin.js B0XXXXXXXX');
  process.exit(1);
}

const ua =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

https
  .get(`https://www.amazon.com/dp/${asin}`, { headers: { 'User-Agent': ua, Accept: 'text/html' } }, (res) => {
    let d = '';
    res.on('data', (c) => (d += c));
    res.on('end', () => {
      const m = d.match(/images\/I\/[A-Za-z0-9+_%-]+\._AC_SL1500_\.jpg/g);
      if (!m || !m.length) {
        console.error('No _AC_SL1500_.jpg found (captcha or layout change). Page length:', d.length);
        process.exit(2);
      }
      const first = m[0];
      console.log(`https://m.media-amazon.com/${first}`);
    });
  })
  .on('error', (e) => {
    console.error(e.message);
    process.exit(3);
  });
