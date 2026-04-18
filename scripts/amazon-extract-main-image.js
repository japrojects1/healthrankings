/**
 * Pick the primary product gallery image from Amazon product HTML.
 * Prefers hiRes / landing image JSON over the first SL1500 on the page (avoids sponsored/related images).
 */
function extractMainGalleryImageUrl(html) {
  if (!html || typeof html !== 'string') return '';

  const candidates = [];

  const hiRes = html.match(
    /"hiRes":"(https:\\\/\\\/m\.media-amazon\.com\\\/images\\\/I\\\/[^"]+_AC_SL1500_\.jpg)"/
  );
  if (hiRes) {
    candidates.push(hiRes[1].replace(/\\\//g, '/'));
  }

  const hiResLoose = html.match(
    /"hiRes":"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+_AC_SL1500_\.jpg)"/
  );
  if (hiResLoose) candidates.push(hiResLoose[1]);

  const mainUrl = html.match(
    /"mainUrl":"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+_AC_SL1500_\.jpg)"/
  );
  if (mainUrl) candidates.push(mainUrl[1]);

  let m = html.match(/images\/I\/[A-Za-z0-9+_%-]+\._AC_SL1500_\.jpg/g);
  if (m && m.length) {
    for (const rel of m) {
      candidates.push(`https://m.media-amazon.com/${rel}`);
    }
  }

  const alt = html.match(/images\/I\/([A-Za-z0-9+_%-]+)\._AC_SL(1200|1000|800)_\.jpg/);
  if (alt) {
    candidates.push(`https://m.media-amazon.com/images/I/${alt[1]}._AC_SL1500_.jpg`);
  }

  for (const u of candidates) {
    if (u && u.includes('m.media-amazon.com/images/I/')) return u;
  }
  return '';
}

module.exports = { extractMainGalleryImageUrl };
