"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import StatsCard from "@/components/dashboard/StatsCard";
import Select from "@/components/ui/Select";
import { LogIn, AlertTriangle, Clock, User, Filter, Search, AlertOctagon, AlertCircle, Zap, Info } from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import { createClient } from "@/lib/supabase";
import type { ComplianceAlert } from "@/lib/supabase-recording";
import AlertDetailsModal from "@/components/modals/AlertDetailsModal";

interface AlertWithDetails extends ComplianceAlert {
  recording_name?: string;
  duration?: number;
}

export default function AlertsCenterPage() {
  const { user, loading, refreshSession } = useAuth();
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const [alerts, setAlerts] = useState<AlertWithDetails[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAlert, setSelectedAlert] = useState<AlertWithDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    async function loadAlerts() {
      if (!user) return;

      setLoadingAlerts(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("compliance_alerts")
        .select(`
          *,
          call_sessions!inner(id, started_at, duration_seconds)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load alerts:", error);
      } else {
        setAlerts(data as AlertWithDetails[]);
      }

      setLoadingAlerts(false);
    }

    loadAlerts();
  }, [user]);

  const stats = {
    critical: alerts.filter((a) => a.severity === "critical").length,
    high: alerts.filter((a) => a.severity === "high").length,
    medium: alerts.filter((a) => a.severity === "medium").length,
    low: alerts.filter((a) => a.severity === "low").length,
  };

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      searchQuery === "" ||
      alert.matched_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.rule_code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity =
      severityFilter === "all" || alert.severity === severityFilter;

    const matchesStatus =
      statusFilter === "all" || alert.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const formatTime = (seconds?: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  const severityConfig = {
    critical: {
      bgColor: "bg-red-50",
      textColor: "text-red-700",
      borderColor: "border-red-200",
      dotColor: "bg-red-500",
    },
    high: {
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-700",
      borderColor: "border-yellow-200",
      dotColor: "bg-yellow-500",
    },
    medium: {
      bgColor: "bg-orange-50",
      textColor: "text-orange-700",
      borderColor: "border-orange-200",
      dotColor: "bg-orange-500",
    },
    low: {
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
      dotColor: "bg-blue-500",
    },
  };

  if (loading || loadingAlerts) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />

        <div className={`p-8 transition-all duration-300 ${isCollapsed ? "ml-20" : "ml-64"}`}>
          <div className="mb-8">
            <div className="h-9 w-64 bg-gray-200 rounded-lg mb-2 animate-pulse" />
            <div className="h-5 w-96 bg-gray-200 rounded animate-pulse" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="h-4 w-16 bg-gray-200 rounded mb-3 animate-pulse" />
                    <div className="h-8 w-12 bg-gray-200 rounded mb-2 animate-pulse" />
                    <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gray-200 animate-pulse" />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <div className="h-11 bg-gray-100 rounded-xl border border-gray-200 animate-pulse" />
              </div>
              <div className="h-11 bg-gray-100 rounded-xl border border-gray-200 animate-pulse" />
              <div className="h-11 bg-gray-100 rounded-xl border border-gray-200 animate-pulse" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            </div>

            <div className="divide-y divide-gray-100">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="px-6 py-5 border-l-4 border-gray-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
                        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                        <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
                      </div>

                      <div className="mb-2">
                        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
                      </div>

                      <div className="bg-gray-50 rounded-lg px-3 py-2 mb-2">
                        <div className="h-4 w-full bg-gray-200 rounded mb-1 animate-pulse" />
                        <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                      </div>

                      <div className="h-3 w-full bg-gray-200 rounded mb-1 animate-pulse" />
                      <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please sign in to access alerts
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div
        className={`p-8 transition-all duration-300 ${
          isCollapsed ? "ml-20" : "ml-64"
        }`}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">
            Alerts Center
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage compliance alerts
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatsCard
            title="Critical"
            value={stats.critical}
            icon={AlertOctagon}
            subtitle="Immediate action required"
            variant="critical"
          />
          <StatsCard
            title="High"
            value={stats.high}
            icon={AlertCircle}
            subtitle="Review recommended"
            variant="high"
          />
          <StatsCard
            title="Medium"
            value={stats.medium}
            icon={Zap}
            subtitle="Minor issues detected"
            variant="medium"
          />
          <StatsCard
            title="Low"
            value={stats.low}
            icon={Info}
            subtitle="Informational alerts"
            variant="low"
          />
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
            <Select
              value={severityFilter}
              onChange={setSeverityFilter}
              placeholder="All Severities"
              options={[
                { value: "all", label: "All Severities" },
                { value: "critical", label: "Critical" },
                { value: "high", label: "High" },
                { value: "medium", label: "Medium" },
                { value: "low", label: "Low" },
              ]}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="All Statuses"
              options={[
                { value: "all", label: "All Statuses" },
                { value: "new", label: "New" },
                { value: "reviewed", label: "Reviewed" },
                { value: "resolved", label: "Resolved" },
              ]}
            />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                All Alerts ({filteredAlerts.length})
              </h2>
            </div>
          </div>

          {loadingAlerts ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading alerts...</p>
            </div>
          ) : filteredAlerts.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredAlerts.map((alert) => {
                const config = severityConfig[alert.severity as keyof typeof severityConfig];
                return (
                  <div
                    key={alert.id}
                    onClick={() => {
                      setSelectedAlert(alert);
                      setIsModalOpen(true);
                    }}
                    className={`px-6 py-5 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 ${config.borderColor}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${config.dotColor}`}></span>
                            {alert.severity.toUpperCase()}
                          </span>
                          <span className="text-sm font-medium text-gray-700">
                            {alert.category}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(alert.created_at)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              alert.status === "new"
                                ? "bg-blue-100 text-blue-700"
                                : alert.status === "reviewed"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            [{alert.status}]
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          Session: {alert.session_id.slice(0, 8)}...
                          {alert.speaker_id && (
                            <span className="ml-2 inline-flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {alert.speaker_id}
                            </span>
                          )}
                          {alert.audio_start !== undefined && alert.audio_end !== undefined && (
                            <span className="ml-2">
                              {formatTime(alert.audio_start)}-{formatTime(alert.audio_end)}
                            </span>
                          )}
                        </div>
                        <div className="bg-gray-50 rounded-lg px-3 py-2 mb-2">
                          <p className="text-sm font-mono text-gray-900">
                            "{alert.matched_text}"
                          </p>
                        </div>
                        {alert.context_text && (
                          <p className="text-xs text-gray-500 line-clamp-2">
                            Context: {alert.context_text}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No alerts found
              </h3>
              <p className="text-gray-600">
                {searchQuery || severityFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "All recordings are compliant"}
              </p>
            </div>
          )}
        </div>

        <AlertDetailsModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAlert(null);
          }}
          alert={selectedAlert}
          onViewRecording={(sessionId) => {
            setIsModalOpen(false);
            setSelectedAlert(null);
            router.push(`/dashboard/recordings/${sessionId}`);
          }}
        />
      </div>
    </div>
  );
}
