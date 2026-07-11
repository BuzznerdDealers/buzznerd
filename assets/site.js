/* Buzznerd site behavior — replaces the prototype runtime (support.js).
   FAQ accordions are native <details>/<summary> + CSS, so no JS needed there.
   Mega-menus open on hover via CSS. This handles: in-page anchor scrolling,
   demo/contact form mailto + success state, and blog category chip filtering. */
(function () {
  "use strict";

  // Smooth in-page anchor scroll with a sticky-header offset.
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href").slice(1);
    if (!id) return;
    var el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    var y = el.getBoundingClientRect().top + window.pageYOffset - 80;
    window.scrollTo({ top: y, behavior: "smooth" });
    if (history.replaceState) history.replaceState(null, "", "#" + id);
  });

  // Forms compose a mailto:info@buzznerd.com message, then show a success card.
  document.querySelectorAll("form").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var parts = [];
      f.querySelectorAll("input,textarea,select").forEach(function (el) {
        var label = el.getAttribute("aria-label") || el.placeholder || el.name || "Field";
        if (el.value && el.value.trim()) parts.push(label + ": " + el.value.trim());
      });
      var body = encodeURIComponent(parts.join("\n") + "\n\nSubmitted from: " + location.href);
      window.location.href =
        "mailto:info@buzznerd.com?subject=" +
        encodeURIComponent("Demo request — Buzznerd") +
        "&body=" + body;
      var card = document.createElement("div");
      card.setAttribute("role", "status");
      card.style.cssText =
        "background:#F6F8FC;border:1.5px solid rgba(43,123,255,.3);border-radius:20px;padding:48px 36px;text-align:center";
      card.innerHTML =
        '<div style="font-size:38px">⚡</div>' +
        '<h3 style="font-family:\'Bricolage Grotesque\';font-weight:800;font-size:26px;margin-top:12px">Got it — you\'re on the list.</h3>' +
        '<p style="font-size:16px;color:#48526A;font-weight:500;line-height:1.55;margin-top:10px">We\'ll reach out within one business day to schedule your walkthrough.</p>';
      f.replaceWith(card);
    });
  });

  // Blog category chip filter (blog index only).
  var chips = document.querySelectorAll("[data-bz-chip]");
  if (chips.length) {
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        var cat = c.getAttribute("data-bz-chip");
        chips.forEach(function (x) { x.setAttribute("data-on", x === c ? "1" : "0"); });
        document.querySelectorAll("[data-bz-post]").forEach(function (card) {
          var show = cat === "All" || card.getAttribute("data-bz-post") === cat;
          card.style.display = show ? "" : "none";
        });
        var feat = document.querySelector("[data-bz-featured]");
        if (feat) feat.style.display = cat === "All" ? "" : "none";
      });
    });
  }
})();
