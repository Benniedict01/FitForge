"use client";

import Link from "next/link";
import { ArrowUpRight, Check, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "./ui/logo";
import { useWorkout } from "./workout/workout-provider";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { workout } = useWorkout();
  const home = pathname === "/";
  const links = [
    { href: home ? "#builder" : "/#builder", label: "Workout builder" },
    { href: home ? "#how-it-works" : "/#how-it-works", label: "How it works" },
    { href: home ? "#the-approach" : "/#the-approach", label: "The approach" },
  ];
  return (
    <header className="site-header">
      <div className="header-inner page-width">
        <Logo />
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((link, index) => (
            <Link
              key={link.label}
              href={link.href}
              className={home && index === 0 ? "nav-active" : ""}
            >
              {link.label}
              {home && index === 0 && <span />}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          {workout && home ? (
            <Link href="/workout" className="button button-outline header-cta">
              <Check size={15} /> Your workout <ArrowUpRight size={16} />
            </Link>
          ) : (
            <Link
              href={home ? "#builder" : "/#builder"}
              className="button button-outline header-cta"
            >
              Let’s get to work <ArrowUpRight size={16} />
            </Link>
          )}
          <button
            type="button"
            className="icon-button mobile-menu-toggle"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav id="mobile-nav" className="mobile-nav page-width" aria-label="Mobile navigation">
          {links.map((link) => (
            <Link href={link.href} key={link.label} onClick={() => setMenuOpen(false)}>
              {link.label}
              <ArrowUpRight size={16} />
            </Link>
          ))}
          {workout && (
            <Link href="/workout" onClick={() => setMenuOpen(false)}>
              Your workout
              <ArrowUpRight size={16} />
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
