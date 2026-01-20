"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Home, Mic, Settings, BookOpen, LogOut, ChevronLeft, ChevronRight, Shield, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Recordings", href: "/dashboard/recordings", icon: Mic },
  { name: "Alerts Center", href: "/dashboard/alerts", icon: AlertTriangle },
  { name: "Compliance", href: "/dashboard/compliance", icon: Shield },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
] as const;

// Shared styles for navigation items
const getNavItemClasses = (isActive: boolean, isCollapsed: boolean) => {
  const baseClasses = `flex items-center ${isCollapsed ? "justify-center w-12 h-12" : "w-full gap-3 px-4 py-3"} rounded-xl transition-colors`;
  const stateClasses = isActive
    ? "bg-gray-100 text-gray-900 font-medium"
    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900";
  return `${baseClasses} ${stateClasses}`;
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { signOut: authSignOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await authSignOut();
      router.push("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
      aria-label="Main navigation"
    >
      {/* Logo & Toggle */}
      <div className="px-3 py-4 border-b border-gray-200">
        {isCollapsed ? (
          /* Collapsed state: square container with hover effect */
          <div
            className="group relative flex items-center justify-center w-12 h-12 mx-auto rounded-xl hover:bg-gray-100 cursor-pointer transition-colors"
            onClick={toggleSidebar}
          >
            <Image
              src="/voxguard-logo-min.svg"
              alt="VoxGuard AI"
              width={28}
              height={28}
              className="h-7 w-7"
            />
            {/* Expand button appears on hover */}
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        ) : (
          /* Expanded state: logo left, toggle right */
          <div className="flex items-center justify-between">
            <div className="ml-1">
              <Image
                src="/voxguard-logo.svg"
                alt="VoxGuard AI"
                width={140}
                height={29}
                className="h-7 w-auto"
              />
            </div>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 pb-4 pt-3 space-y-1 ${isCollapsed ? "flex flex-col items-center" : "px-3"}`} aria-label="Primary navigation">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={getNavItemClasses(isActive, isCollapsed)}
              aria-current={isActive ? "page" : undefined}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" aria-hidden="true" />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className={`pb-4 pt-3 border-t border-gray-200 space-y-1 ${isCollapsed ? "flex flex-col items-center" : "px-3"}`} role="navigation" aria-label="Secondary navigation">
        <Link
          href="/dashboard/guide"
          className={getNavItemClasses(pathname === "/dashboard/guide", isCollapsed)}
          title={isCollapsed ? "Guide" : undefined}
        >
          <BookOpen className="w-5 h-5 shrink-0" aria-hidden="true" />
          {!isCollapsed && <span>Guide</span>}
        </Link>
        <button
          onClick={handleSignOut}
          className={getNavItemClasses(false, isCollapsed)}
          aria-label="Sign out"
          title={isCollapsed ? "Sign Out" : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" aria-hidden="true" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
