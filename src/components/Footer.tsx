const footerLinks = [
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Services", href: "/services" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Storefronts", href: "/services" },
      { label: "Inventory", href: "/services" },
      { label: "Marketplace", href: "/services" },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <a className="brand footer-brand" href="/">
            <span className="brand-mark">B</span>
            <span className="brand-text">
              Buzz<span>Nerd</span>
            </span>
          </a>
          <p className="footer-copy">
            The dealership platform for trucks, trailers, parts, and heavy
            equipment. Branded storefronts, live inventory, and marketplace
            reach — all in one place.
          </p>
        </div>

        {footerLinks.map((group) => (
          <div key={group.title}>
            <h3>{group.title}</h3>
            <ul>
              {group.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3>Contact</h3>
          <ul>
            <li>
              <a href="mailto:hello@buzznerd.com">hello@buzznerd.com</a>
            </li>
            <li>
              <a href="tel:+18005558763">+1 (800) 555-8763</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>© {year} BuzzNerd. All rights reserved.</p>
      </div>
    </footer>
  );
}
