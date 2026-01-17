"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function AuthButton() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="px-4 py-2 text-gray-600">
        Loading...
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-sm hover:shadow-md"
        >
          {user.user_metadata?.avatar_url && (
            <img
              src={user.user_metadata.avatar_url}
              alt={user.user_metadata?.name || "User"}
              className="w-6 h-6 rounded-full"
            />
          )}
          <span>Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/login"
        className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
      >
        Log in
      </Link>
      <Link
        href="/login"
        className="px-5 py-2.5 bg-[#FF6B35] text-white rounded-full hover:bg-[#E85A2A] active:bg-[#D14E1F] transition-colors font-medium"
      >
        Get Started
      </Link>
    </div>
  );
}
