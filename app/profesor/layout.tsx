"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth";

const navItems = [
  { href: "/profesor", label: "Dashboard", icon: "📊" },
  { href: "/profesor/alumnos", label: "Alumnos", icon: "👥" },
  { href: "/profesor/reportes", label: "Reportes", icon: "📋" },
  { href: "/profesor/configuracion", label: "Configuración", icon: "⚙️" },
];

export default function ProfesorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOut();
      router.push("/login");
    } catch {
      setLoggingOut(false);
    }
  }

  // Don't show layout nav on the session projector view
  const isSessionView = pathname?.match(/^\/profesor\/sesion\/[^/]+$/);
  if (isSessionView) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Top navbar */}
      <nav className="bg-navy text-cream shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo / title */}
            <div className="flex items-center gap-3">
              <Link href="/profesor" className="font-bold text-lg">
                Sistema de Asistencia
              </Link>
              <span className="hidden sm:inline text-gold text-sm">
                Sucesiones — Prof. Pruneda
              </span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-gold text-navy"
                      : "text-cream hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="ml-2 px-4 py-2 text-sm text-cream/70 hover:text-cream hover:bg-white/10 rounded-lg transition-colors"
              >
                {loggingOut ? "Saliendo..." : "Cerrar sesión"}
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-cream"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 px-4 py-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                  pathname === item.href
                    ? "bg-gold text-navy"
                    : "text-cream hover:bg-white/10"
                }`}
              >
                {item.icon} {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full text-left px-4 py-3 text-sm text-cream/70 hover:text-cream hover:bg-white/10 rounded-lg"
            >
              {loggingOut ? "Saliendo..." : "🚪 Cerrar sesión"}
            </button>
          </div>
        )}
      </nav>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
