/**
 * Brand-site chrome behavior (header / mobile nav).
 * Loaded on Astro pages via BaseLayout and exposed at /partials/scripts.js
 * for the Remix storefront to load when wrapping inventory pages.
 */
(() => {
  const toggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-mobile-nav]");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    const open = menu.hasAttribute("hidden");
    if (open) menu.removeAttribute("hidden");
    else menu.setAttribute("hidden", "");
    toggle.setAttribute("aria-expanded", String(open));
  });
})();
