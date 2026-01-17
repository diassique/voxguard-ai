"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import StatsCard from "@/components/dashboard/StatsCard";
import { Mic, CheckCircle, AlertTriangle, Clock, MoreVertical, LogIn } from "lucide-react";

import { useSidebar } from "@/contexts/SidebarContext";

export default function DashboardPage() {
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

      {/* Main Content */}
      <div className={`p-8 transition-all duration-300 ${isCollapsed ? "ml-20" : "ml-64"}`}>
        {/* Header */}
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
            <button className="px-5 py-2.5 bg-[#FF6B35] text-white rounded-full hover:bg-[#E85A2A] active:bg-[#D14E1F] transition-colors font-medium">
              New Recording
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Recordings"
            value="156"
            icon={Mic}
            trend={{ value: "12%", positive: true }}
          />
          <StatsCard
            title="Compliance Rate"
            value="94.2%"
            icon={CheckCircle}
            trend={{ value: "2.1%", positive: true }}
          />
          <StatsCard
            title="Issues Detected"
            value="8"
            icon={AlertTriangle}
            trend={{ value: "15%", positive: false }}
          />
          <StatsCard
            title="Avg Duration"
            value="12m 34s"
            icon={Clock}
            subtitle="Per recording"
          />
        </div>

        {/* Recent Recordings */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Recordings</h2>
            <button className="text-sm text-gray-600 hover:text-gray-900 font-medium">
              See All
            </button>
          </div>
          <div className="overflow-x-auto">
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
                {[
                  { name: "Client Call - ABC Corp", duration: "15:23", date: "Today, 2:30 PM", status: "Compliant" },
                  { name: "Team Meeting Q4 Review", duration: "45:12", date: "Yesterday, 10:00 AM", status: "Compliant" },
                  { name: "Sales Call - Prospect XYZ", duration: "08:45", date: "Jan 14, 3:15 PM", status: "Issue Detected" },
                  { name: "Customer Support Call #1234", duration: "12:08", date: "Jan 13, 4:20 PM", status: "Compliant" },
                  { name: "Strategy Session", duration: "32:55", date: "Jan 12, 11:00 AM", status: "Compliant" },
                ].map((recording, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
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
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {recording.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                      </button>
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
