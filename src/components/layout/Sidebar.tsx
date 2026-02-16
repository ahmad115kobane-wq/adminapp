"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Trophy, Users, Shield, Swords,
  ShoppingBag, Package, Tags, Image, ClipboardList,
  Newspaper, SlidersHorizontal, FileText, Activity,
  LogOut, UserCog, Store, Video, Eye,
} from "lucide-react";

const navItems = [
  { label: "الرئيسية", href: "/", icon: LayoutDashboard },
  { label: "المباريات", href: "/matches", icon: Swords },
  { label: "الفرق", href: "/teams", icon: Shield },
  { label: "البطولات", href: "/competitions", icon: Trophy },
  { label: "المستخدمون", href: "/users", icon: Users },
  { label: "المشغلون", href: "/operators", icon: UserCog },
  { label: "المشرفون", href: "/supervisors", icon: Eye },
  { label: "divider", href: "", icon: Store },
  { label: "المنتجات", href: "/store/products", icon: Package },
  { label: "الأقسام", href: "/store/categories", icon: Tags },
  { label: "البانرات", href: "/store/banners", icon: Image },
  { label: "الطلبات", href: "/orders", icon: ClipboardList },
  { label: "divider2", href: "", icon: Store },
  { label: "الأخبار", href: "/news", icon: Newspaper },
  { label: "السلايدر", href: "/sliders", icon: SlidersHorizontal },
  { label: "إعلانات الفيديو", href: "/video-ads", icon: Video },
  { label: "الصفحات القانونية", href: "/legal", icon: FileText },
  { label: "سجل الأحداث", href: "/events", icon: Activity },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed right-0 top-0 z-40 flex h-screen w-64 flex-col border-l border-gray-800 bg-gray-950">
      <div className="flex h-16 items-center gap-3 border-b border-gray-800 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-bold text-white text-sm">
          AS
        </div>
        <div>
          <p className="text-sm font-semibold text-white">AppSport</p>
          <p className="text-xs text-gray-400">لوحة الإدارة</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            if (item.label.startsWith("divider")) {
              return <div key={item.label} className="my-3 border-t border-gray-800" />;
            }
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-blue-600/10 text-blue-400 font-medium"
                    : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-gray-800 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-xs font-medium text-white">
            {user?.name?.charAt(0) || "A"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-xs text-gray-400">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
