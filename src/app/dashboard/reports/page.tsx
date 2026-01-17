"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import StatsCard from "@/components/dashboard/StatsCard";
import { BarChart3, CheckCircle, Clock, Download, LogIn } from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";

export default function ReportsPage() {
  const { user, loading, refreshSession } = useAuth();
  const router = useRouter();
  const { isCollapsed } = useSidebar();

  // Refresh session on mount
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to access reports</p>
          <a
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className={`p-8 transition-all duration-300 ${isCollapsed ? "ml-20" : "ml-64"}`}>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Reports</h1>
              <p className="text-gray-600 mt-1">View compliance and analytics reports</p>
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6B35] text-white rounded-full hover:bg-[#E85A2A] active:bg-[#D14E1F] transition-colors font-medium">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Total Analyzed"
            value="0"
            icon={BarChart3}
            subtitle="recordings this month"
          />
          <StatsCard
            title="Compliance Score"
            value="100%"
            icon={CheckCircle}
            subtitle="No violations detected"
          />
          <StatsCard
            title="Processing Time"
            value="0h"
            icon={Clock}
            subtitle="total audio processed"
          />
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Report History</h2>
          </div>

          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reports yet</h3>
            <p className="text-gray-600">Reports will appear here after you analyze recordings</p>
          </div>
        </div>
      </div>
    </div>
  );
}
