/**
 * Static HTML: wire header search icon + hero "Find it" to /search?q=…
 * (Next.js routes use React SiteSearchDialog instead.)
 */
(function () {
  function goSearch(q) {
    var t = String(q || "").trim();
    if (t.length < 2) return;
    window.location.href = "/search?q=" + encodeURIComponent(t);
  }

  function closeOverlay() {
    var el = document.getElementById("hr-site-search-overlay");
    if (el) el.remove();
    document.body.style.overflow = "";
  }

  function openOverlay() {
    if (document.getElementById("hr-site-search-overlay")) return;
    document.body.style.overflow = "hidden";
    var wrap = document.createElement("div");
    wrap.id = "hr-site-search-overlay";
    wrap.style.cssText =
      "position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,.45);display:flex;align-items:flex-start;justify-content:center;padding:12vh 16px 16px;";
    wrap.setAttribute("role", "presentation");
    wrap.addEventListener("mousedown", function (e) {
      if (e.target === wrap) closeOverlay();
    });
    var box = document.createElement("div");
    box.style.cssText =
      "background:#fff;border-radius:16px;padding:22px;max-width:440px;width:100%;box-shadow:0 25px 50px -12px rgba(0,0,0,.25);";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-labelledby", "hr-site-search-title");
    box.addEventListener("mousedown", function (e) {
      e.stopPropagation();
    });
    box.innerHTML =
      '<h2 id="hr-site-search-title" style="margin:0 0 14px;font:700 18px system-ui,sans-serif;color:#0f172a">Search HealthRankings</h2>' +
      '<div style="display:flex;flex-direction:column;gap:12px">' +
      '<input id="hr-site-search-input" type="search" placeholder="Articles, devices, topics…" autocomplete="off" style="width:100%;padding:12px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:16px;box-sizing:border-box" />' +
      '<div style="display:flex;justify-content:flex-end;gap:8px">' +
      '<button type="button" id="hr-site-search-cancel" style="padding:10px 16px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;font:600 14px system-ui;cursor:pointer;color:#475569">Cancel</button>' +
      '<button type="button" id="hr-site-search-go" style="padding:10px 18px;border-radius:10px;border:none;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;font:600 14px system-ui;cursor:pointer">Search</button>' +
      "</div></div>";
    wrap.appendChild(box);
    document.body.appendChild(wrap);
    var inp = document.getElementById("hr-site-search-input");
    var cancel = document.getElementById("hr-site-search-cancel");
    var go = document.getElementById("hr-site-search-go");
    function submit() {
      goSearch(inp && inp.value);
      closeOverlay();
    }
    if (go) go.addEventListener("click", submit);
    if (cancel) cancel.addEventListener("click", closeOverlay);
    if (inp) {
      inp.focus();
      inp.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          submit();
        }
        if (e.key === "Escape") closeOverlay();
      });
    }
    document.addEventListener(
      "keydown",
      function esc(e) {
        if (e.key === "Escape") {
          closeOverlay();
          document.removeEventListener("keydown", esc);
        }
      },
      true
    );
  }

  document.addEventListener("click", function (e) {
    var heroBtn = e.target.closest && e.target.closest(".hero-search .hero-search-btn");
    if (heroBtn) {
      e.preventDefault();
      var wrap = heroBtn.closest(".hero-search");
      var inp = wrap && wrap.querySelector("input");
      goSearch(inp && inp.value);
      return;
    }
    var icon = e.target.closest && e.target.closest(".header-actions .search-btn");
    if (icon) {
      e.preventDefault();
      openOverlay();
    }
  });
})();
