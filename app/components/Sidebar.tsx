"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, History, Settings, LogOut } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth0();

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 flex-shrink-0 border-r border-card bg-card backdrop-blur-md">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center border-b border-card-subtle px-6">
          <Link href="/" className="flex items-center gap-2">
            <motion.span
              className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-xl font-bold text-transparent"
              animate={{ opacity: [1, 0.85, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
            Tuva
            </motion.span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent-soft text-accent"
                    : "text-muted hover-bg-card-soft hover-text-theme"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {isAuthenticated && (
          <div className="border-t border-card-subtle p-4 text-sm">
            <div className="mb-3">
              <p className="font-semibold text-theme">
                {user?.name ?? user?.email ?? "Ready to teach"}
              </p>
              <p className="text-xs text-subtle">Signed in to Tuva</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-card bg-card-soft px-3 py-2 text-xs font-semibold text-soft transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-200"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
