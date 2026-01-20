"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import StatsCard from "@/components/dashboard/StatsCard";
import { Mic, CheckCircle, AlertTriangle, Clock, MoreVertical, LogIn } from "lucide-react";

import { useSidebar } from "@/contexts/SidebarContext";
import type { DashboardStats, RecentRecording } from "@/types/dashboard.types";

export default function DashboardPage() {
  const { user, loading, refreshSession } = useAuth();
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRecordings, setRecentRecordings] = useState<RecentRecording[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoadingData(true);

      const statsRes = await fetch('/api/dashboard/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      const recordingsRes = await fetch('/api/dashboard/recent-recordings?limit=5');
      if (recordingsRes.ok) {
        const recordingsData = await recordingsRes.json();
        setRecentRecordings(recordingsData.recordings);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />

        <div className={`p-8 transition-all duration-300 ${isCollapsed ? "ml-20" : "ml-64"}`}>
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="h-9 w-64 bg-gray-200 rounded-lg mb-3 animate-pulse" />
                <div className="h-5 w-80 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-10 w-36 bg-gray-200 rounded-full animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
                </div>
                <div className="h-8 w-20 bg-gray-200 rounded mb-2 animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-left">
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    </th>
                    <th className="px-6 py-4 text-left">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    </th>
                    <th className="px-6 py-4 text-left">
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                    </th>
                    <th className="px-6 py-4 text-left">
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                    </th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
                          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-9 h-9 bg-gray-200 rounded-lg animate-pulse" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
          <p className="text-gray-600 mb-6">Please sign in to access the dashboard</p>
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const firstName = user.user_metadata?.name?.split(" ")[0] || "User";

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className={`p-8 transition-all duration-300 ${isCollapsed ? "ml-20" : "ml-64"}`}>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">
                {getGreeting()}, {firstName}!
              </h1>
              <p className="text-gray-600 mt-1">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard/recordings")}
              className="px-5 py-2.5 bg-[#FF6B35] text-white rounded-full hover:bg-[#E85A2A] active:bg-[#D14E1F] transition-colors font-medium"
            >
              New Recording
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatsCard
            title="Total Recordings"
            value={stats?.totalRecordings.toString() || "0"}
            icon={Mic}
            trend={stats?.trends.recordings}
          />
          <StatsCard
            title="Compliance Rate"
            value={`${stats?.complianceRate.toFixed(1) || "0.0"}%`}
            icon={CheckCircle}
            trend={stats?.trends.compliance}
          />
          <StatsCard
            title="Issues Detected"
            value={stats?.totalAlerts.toString() || "0"}
            icon={AlertTriangle}
            trend={stats?.trends.issues}
          />
          <StatsCard
            title="Avg Duration"
            value={stats?.avgDuration || "0m 0s"}
            icon={Clock}
            subtitle="Per recording"
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Recordings</h2>
            <button
              onClick={() => router.push("/dashboard/recordings")}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              See All
            </button>
          </div>
          <div className="overflow-x-auto">
            {recentRecordings.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Mic className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No recordings yet</p>
                <button
                  onClick={() => router.push("/dashboard/recordings")}
                  className="text-sm text-[#FF6B35] hover:text-[#E85A2A] font-medium"
                >
                  Create your first recording
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Recording Name</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Duration</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentRecordings.map((recording) => (
                    <tr
                      key={recording.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/recordings/${recording.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                            <Mic className="w-5 h-5 text-gray-600" />
                          </div>
                          <span className="font-medium text-gray-900">{recording.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{recording.duration}</td>
                      <td className="px-6 py-4 text-gray-600">{recording.date}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                            recording.status === "Compliant"
                              ? "bg-green-50 text-green-700"
                              : recording.status === "Critical Issue"
                              ? "bg-red-50 text-red-700"
                              : recording.status === "High Priority"
                              ? "bg-orange-50 text-orange-700"
                              : recording.status === "Processing"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {recording.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
