(function () {
  'use strict';

  function getProductName(row) {
    var el = row.querySelector('.dl-name');
    if (!el) return '';
    return el.textContent.replace(/\s+/g, ' ').trim();
  }

  function thumbUrlFor(name) {
    var map = window.CATALOG_PRODUCT_IMAGES;
    if (!map || !name) return '';
    var u = map[name];
    return typeof u === 'string' && u.length ? u : '';
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.dl-item').forEach(function (row) {
      if (row.querySelector('.dl-thumb-wrap')) return;
      var name = getProductName(row);
      var url = thumbUrlFor(name);
      var rank = row.querySelector('.dl-rank');
      if (!rank) return;

      var wrap = document.createElement('div');
      wrap.className = 'dl-thumb-wrap' + (url ? '' : ' dl-thumb-missing');
      wrap.setAttribute('aria-hidden', 'true');

      if (url) {
        var img = document.createElement('img');
        img.className = 'dl-thumb';
        img.src = url;
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.referrerPolicy = 'no-referrer';
        img.onerror = function () {
          img.remove();
          wrap.classList.add('dl-thumb-missing');
        };
        wrap.appendChild(img);
      }

      rank.parentNode.insertBefore(wrap, rank.nextSibling);
    });
  });
})();
