import { useState } from "react";

type NavItem = {
  label: string;
  href: string;
};

type HeaderProps = {
  currentPath?: string;
};

const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Contact", href: "/contact" },
];

function isActive(currentPath: string | undefined, href: string) {
  if (!currentPath) return false;
  if (href === "/") return currentPath === "/";
  return currentPath.startsWith(href);
}

export default function Header({ currentPath }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <a className="brand" href="/" aria-label="BuzzNerd home">
          <span className="brand-mark">B</span>
          <span className="brand-text">
            Buzz<span>Nerd</span>
          </span>
        </a>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={isActive(currentPath, item.href) ? "active" : ""}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <a className="header-cta" href="/contact">
          Book a Demo
        </a>

        <button
          className="mobile-menu-button"
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {isOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={isActive(currentPath, item.href) ? "active" : ""}
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <a className="mobile-cta" href="/contact" onClick={() => setIsOpen(false)}>
            Book a Demo
          </a>
        </nav>
      )}
    </header>
  );
}
