/* Buzznerd AI Websites — "Find a location" widget (brand/service filters,
   filtered location list, map pins). Ported from the design's data-dc-script
   (a React component state machine) into vanilla JS, since React's onClick
   handlers never appear in extracted static HTML. Data, computed styles, and
   copy are verbatim from the design; only the render mechanism changed. */
(function () {
  "use strict";

  var mount = document.getElementById("loc-finder");
  if (!mount) return;

  var BRANDS = [
    { id: "all", label: "All", color: "#0C1322", dot: null },
    { id: "international", label: "International", color: "#E8531F", dot: "#E8531F" },
    { id: "freightliner", label: "Freightliner", color: "#2B7BFF", dot: "#2B7BFF" },
    { id: "kenworth", label: "Kenworth", color: "#E5595C", dot: "#E5595C" },
    { id: "volvo", label: "Volvo", color: "#8A93A6", dot: "#8A93A6" },
    { id: "isuzu", label: "Isuzu", color: "#EC6FA0", dot: "#EC6FA0" },
    { id: "mack", label: "Mack", color: "#F5A623", dot: "#F5A623" },
  ];
  var SERVICES = [
    { id: "service", label: "Service bays" },
    { id: "parts", label: "Parts counter" },
    { id: "lounge", label: "Drivers lounge" },
    { id: "financing", label: "Financing" },
    { id: "rental", label: "Truck rental" },
    { id: "body", label: "Body shop" },
  ];
  var LOCATIONS = [
    { city: "Dallas, TX", px: 56, py: 52, phone: "(214) 555-0101", brands: ["international", "freightliner", "kenworth", "volvo", "mack"], services: ["service", "parts", "lounge", "financing", "rental", "body"], hours: "Mon–Sat 7a–6p" },
    { city: "Fort Worth, TX", px: 47, py: 50, phone: "(817) 555-0102", brands: ["international", "freightliner", "kenworth"], services: ["service", "parts", "financing"], hours: "Mon–Fri 7a–5p" },
    { city: "Oklahoma City, OK", px: 60, py: 33, phone: "(405) 555-0148", brands: ["international", "volvo", "isuzu"], services: ["service", "parts", "rental"], hours: "Mon–Fri 7a–6p" },
    { city: "Tulsa, OK", px: 73, py: 37, phone: "(918) 555-0177", brands: ["freightliner", "mack", "kenworth"], services: ["service", "parts", "body"], hours: "Mon–Sat 8a–5p" },
    { city: "Jackson, MS", px: 78, py: 70, phone: "(601) 555-0133", brands: ["international", "isuzu"], services: ["service", "financing"], hours: "Mon–Fri 8a–5p" },
  ];

  var state = { brand: "all", services: [] };

  function colorOf(id) { var b = BRANDS.filter(function (x) { return x.id === id; })[0]; return (b && b.color) || "#2B7BFF"; }
  function labelOf(id) { var b = BRANDS.filter(function (x) { return x.id === id; })[0]; return (b && b.label) || id; }
  function svcLabel(id) { var s = SERVICES.filter(function (x) { return x.id === id; })[0]; return (s && s.label) || id; }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function render() {
    var brand = state.brand, services = state.services;
    var filtered = LOCATIONS.filter(function (l) {
      return (brand === "all" || l.brands.indexOf(brand) !== -1) &&
        services.every(function (sv) { return l.services.indexOf(sv) !== -1; });
    });

    var brandButtonsHtml = BRANDS.map(function (b) {
      var active = b.id === brand;
      var base = "display:inline-flex;align-items:center;gap:7px;cursor:pointer;font-family:inherit;font-weight:700;font-size:13px;padding:8px 13px;border-radius:999px;transition:.15s;";
      var style = base + (active
        ? "background:" + b.color + ";color:#fff;border:1px solid transparent"
        : "background:#fff;color:#48526A;border:1px solid rgba(12,19,34,.14)");
      var dot = (b.dot && !active) ? '<span style="width:9px;height:9px;border-radius:50%;background:' + b.dot + '"></span>' : "";
      return '<button type="button" data-brand-id="' + b.id + '" style="' + style + '">' + dot + esc(b.label) + "</button>";
    }).join("");

    var serviceButtonsHtml = SERVICES.map(function (s) {
      var active = services.indexOf(s.id) !== -1;
      var base = "cursor:pointer;font-family:inherit;font-weight:700;font-size:12.5px;padding:8px 13px;border-radius:9px;transition:.15s;";
      var style = base + (active
        ? "background:#0C1322;color:#fff;border:1px solid #0C1322"
        : "background:#fff;color:#48526A;border:1px solid rgba(12,19,34,.14)");
      return '<button type="button" data-service-id="' + s.id + '" style="' + style + '">' + esc(s.label) + "</button>";
    }).join("");

    var hasFilters = brand !== "all" || services.length > 0;
    var chips = [];
    if (brand !== "all") chips.push('<span style="display:inline-flex;align-items:center;gap:6px;background:#0C1322;color:#fff;border-radius:999px;padding:5px 11px;font-weight:700;font-size:12px">' + esc(labelOf(brand)) + '<span data-chip-remove="brand" style="cursor:pointer;opacity:.7;font-weight:800">×</span></span>');
    services.forEach(function (sv) {
      chips.push('<span style="display:inline-flex;align-items:center;gap:6px;background:#0C1322;color:#fff;border-radius:999px;padding:5px 11px;font-weight:700;font-size:12px">' + esc(svcLabel(sv)) + '<span data-chip-remove="service:' + sv + '" style="cursor:pointer;opacity:.7;font-weight:800">×</span></span>');
    });
    var activeFiltersHtml = hasFilters
      ? '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:#F6F8FC;border:1px solid rgba(12,19,34,.08);border-radius:12px;padding:10px 12px;margin-top:20px"><span style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#8A93A6;font-weight:700">Active</span>' + chips.join("") + '<button type="button" id="loc-clear-all" style="margin-left:auto;cursor:pointer;background:none;border:none;font-family:inherit;font-weight:700;font-size:12px;color:#2B7BFF">Clear all</button></div>'
      : "";

    var locationsHtml = filtered.map(function (l, i) {
      var dots = l.brands.map(function (id) {
        return '<span style="width:11px;height:11px;border-radius:50%;background:' + colorOf(id) + '" title="' + esc(labelOf(id)) + '"></span>';
      }).join("");
      var chipsRow = l.services.map(function (id) {
        return '<span style="background:#F6F8FC;border:1px solid rgba(12,19,34,.09);border-radius:7px;padding:5px 9px;font-weight:600;font-size:11.5px;color:#48526A">' + esc(svcLabel(id)) + "</span>";
      }).join("");
      var idx = String(i + 1).padStart(2, "0");
      return '<div style="padding:16px 0;border-bottom:1px solid rgba(12,19,34,.07)">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">' +
        '<div><div style="font-family:\'Bricolage Grotesque\';font-weight:800;font-size:18px">' + esc(l.city) + '</div>' +
        '<div style="font-size:13.5px;color:#48526A;font-weight:600;margin-top:2px">' + esc(l.phone) + "</div></div>" +
        '<span style="flex-shrink:0;background:#2B7BFF;color:#fff;font-weight:800;font-size:11px;padding:4px 8px;border-radius:7px">' + idx + "</span></div>" +
        '<div style="display:flex;gap:5px;margin-top:10px">' + dots + "</div>" +
        '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px">' + chipsRow + "</div>" +
        '<div style="font-size:12.5px;color:#8A93A6;font-weight:600;margin-top:10px">' + esc(l.hours) + "</div></div>";
    }).join("") || '<div style="padding:28px 0;text-align:center;color:#8A93A6;font-weight:600;font-size:14px">No locations match those filters.</div>';

    var liveCities = {};
    filtered.forEach(function (l) { liveCities[l.city] = true; });
    var pinsHtml = LOCATIONS.map(function (l) {
      var active = !!liveCities[l.city];
      var c = colorOf(brand !== "all" ? brand : l.brands[0]);
      var common = "position:absolute;left:" + l.px + "%;top:" + l.py + "%;border-radius:50%;transition:.25s;transform:translate(-50%,-50%);";
      var style = common + (active
        ? "width:20px;height:20px;background:" + c + ";border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.55);z-index:3;opacity:1"
        : "width:14px;height:14px;background:#2A3242;border:2px solid #454f63;box-shadow:none;z-index:1;opacity:.5");
      return '<span style="' + style + '"></span>';
    }).join("");

    var n = filtered.length;
    var countLabel = n + " location" + (n === 1 ? "" : "s") + " · " + (brand === "all" ? "All brands" : labelOf(brand));
    if (services.length) countLabel += " · " + services.length + " service" + (services.length === 1 ? "" : "s");

    mount.innerHTML =
      '<div style="padding:26px;border-right:1px solid rgba(12,19,34,.08);max-height:600px;overflow:auto">' +
        '<div style="display:inline-block;background:#0C1322;color:#fff;font-weight:700;font-size:11px;letter-spacing:.12em;padding:5px 10px;border-radius:7px">MAP</div>' +
        '<h3 style="font-family:\'Bricolage Grotesque\';font-weight:800;font-size:26px;margin-top:14px">Find a location</h3>' +
        '<div style="font-size:13.5px;color:#8A93A6;font-weight:600;margin-top:4px">' + esc(countLabel) + "</div>" +
        '<div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8A93A6;font-weight:700;margin-top:24px">Filter by brand</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">' + brandButtonsHtml + "</div>" +
        '<div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8A93A6;font-weight:700;margin-top:24px">Filter by services</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">' + serviceButtonsHtml + "</div>" +
        activeFiltersHtml +
        '<div style="height:1px;background:rgba(12,19,34,.08);margin:22px 0"></div>' +
        locationsHtml +
      "</div>" +
      '<div style="position:relative;background:radial-gradient(circle at 40% 30%,#141b2b,#0A0E17);min-height:600px;overflow:hidden">' +
        '<div style="position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.07) 1px,transparent 1px);background-size:26px 26px"></div>' +
        '<div style="position:absolute;top:22px;left:24px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#AEB6C6;font-weight:700;font-size:11px;letter-spacing:.1em;text-transform:uppercase;padding:6px 12px;border-radius:8px">TX · OK · LA · MS coverage</div>' +
        pinsHtml +
      "</div>";
  }

  // Event delegation on the mount point — survives re-renders, since we never
  // rebind per-button; only the DOM inside #loc-finder changes.
  mount.addEventListener("click", function (e) {
    var brandBtn = e.target.closest("[data-brand-id]");
    if (brandBtn) { state.brand = brandBtn.getAttribute("data-brand-id"); render(); return; }

    var serviceBtn = e.target.closest("[data-service-id]");
    if (serviceBtn) {
      var id = serviceBtn.getAttribute("data-service-id");
      var i = state.services.indexOf(id);
      if (i === -1) state.services = state.services.concat(id);
      else state.services = state.services.slice(0, i).concat(state.services.slice(i + 1));
      render();
      return;
    }

    var chipRemove = e.target.closest("[data-chip-remove]");
    if (chipRemove) {
      var key = chipRemove.getAttribute("data-chip-remove");
      if (key === "brand") state.brand = "all";
      else if (key.indexOf("service:") === 0) {
        var sid = key.slice("service:".length);
        state.services = state.services.filter(function (x) { return x !== sid; });
      }
      render();
      return;
    }

    if (e.target.closest("#loc-clear-all")) {
      state.brand = "all";
      state.services = [];
      render();
    }
  });

  render();
})();
