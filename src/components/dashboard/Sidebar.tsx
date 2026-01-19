"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Home, Mic, FileText, Settings, HelpCircle, LogOut, ChevronLeft, ChevronRight, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Recordings", href: "/dashboard/recordings", icon: Mic },
  { name: "Reports", href: "/dashboard/reports", icon: FileText },
  { name: "Compliance", href: "/dashboard/compliance", icon: Shield },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { signOut: authSignOut } = useAuth();

  return (
    <div className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
      isCollapsed ? "w-20" : "w-64"
    }`}>
      {/* Logo & Toggle */}
      <div className="p-4 border-b border-gray-200">
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
            <Image
              src="/voxguard-logo.svg"
              alt="VoxGuard AI"
              width={140}
              height={29}
              className="h-7 w-auto"
            />
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
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} px-4 py-3 rounded-xl transition-colors ${
                isActive
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 space-y-1">
        <Link
          href="/help"
          className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors`}
          title={isCollapsed ? "Help & Support" : undefined}
        >
          <HelpCircle className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span>Help & Support</span>}
        </Link>
        <button
          onClick={() => {
            router.push("/login");
            authSignOut();
          }}
          className={`w-full flex items-center ${isCollapsed ? "justify-center" : "gap-3"} px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors`}
          title={isCollapsed ? "Sign Out" : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}
