"use client";

import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { Logo } from "../../components/Logo";

const LINKS = [
  { href: "/live", label: "Live conversations" },
  { href: "/review", label: "Review queue" },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={rootStyle}>
      <nav style={navStyle}>
        <div style={brandStyle}>
          <Logo size={22} />
          <span style={{ fontWeight: 700, fontSize: 13 }}>Rfqly Staff Console</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} style={linkStyle(pathname === link.href)}>
              {link.label}
            </a>
          ))}
        </div>
      </nav>
      <div style={bodyStyle}>{children}</div>
    </div>
  );
}

const rootStyle: CSSProperties = {
  fontFamily: "system-ui, -apple-system, sans-serif",
  background: "#f8fafc",
  color: "#0f172a",
  height: "100vh",
  display: "flex",
  flexDirection: "column",
};

const bodyStyle: CSSProperties = { flex: 1, minHeight: 0 };

const navStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  padding: "10px 20px",
  background: "linear-gradient(135deg, #0f172a, #164e63)",
};

const brandStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 8, color: "#fff" };

function linkStyle(active: boolean): CSSProperties {
  return {
    color: active ? "#0f172a" : "#cbd5e1",
    background: active ? "#fff" : "transparent",
    fontSize: 13,
    fontWeight: 600,
    textDecoration: "none",
    padding: "6px 14px",
    borderRadius: 8,
  };
}
