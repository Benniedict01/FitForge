"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChevronDown, History, LayoutDashboard, Menu, Settings2, X } from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/analyze", label: "Analyze", icon: LayoutDashboard },
  { href: "/history", label: "History", icon: History },
  { href: "/shortcuts", label: "iPhone setup", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="header-inner page-width">
        <Link href="/" className="brand" aria-label="ChessVision AI home" onClick={() => setOpen(false)}>
          <span className="brand-mark" aria-hidden="true"><span>♞</span></span>
          <span className="brand-name">ChessVision<span className="brand-ai">AI</span></span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map(({ href, label }) => (
            <Link href={href} key={href} className={pathname === href ? "nav-link active" : "nav-link"}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link href="/analyze" className="button button-small button-primary header-cta">
            Open workspace <span aria-hidden="true">↗</span>
          </Link>
          <button
            type="button"
            className="mobile-menu-button"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
            <ChevronDown className={open ? "menu-chevron open" : "menu-chevron"} size={13} />
          </button>
        </div>
      </div>
      {open && (
        <nav className="mobile-nav page-width" aria-label="Mobile navigation">
          {links.map(({ href, label, icon: Icon }) => (
            <Link href={href} key={href} className={pathname === href ? "mobile-nav-link active" : "mobile-nav-link"} onClick={() => setOpen(false)}>
              <Icon size={17} /> {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
