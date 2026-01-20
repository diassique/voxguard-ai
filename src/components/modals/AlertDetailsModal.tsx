"use client";

import { AlertOctagon, Clock, User, PlayCircle, FileText } from "lucide-react";
import type { ComplianceAlert } from "@/lib/supabase-recording";
import BaseModal from "./BaseModal";

interface AlertDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: ComplianceAlert | null;
  onViewRecording?: (sessionId: string) => void;
}

export default function AlertDetailsModal({
  isOpen,
  onClose,
  alert,
  onViewRecording,
}: AlertDetailsModalProps) {
  if (!alert) return null;

  // Severity config
  const severityConfig = {
    critical: {
      bgColor: "bg-red-50",
      textColor: "text-red-700",
      borderColor: "border-red-200",
      dotColor: "bg-red-500",
      iconBgColor: "bg-red-50",
      iconColor: "text-red-600",
    },
    high: {
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-700",
      borderColor: "border-yellow-200",
      dotColor: "bg-yellow-500",
      iconBgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
    },
    medium: {
      bgColor: "bg-orange-50",
      textColor: "text-orange-700",
      borderColor: "border-orange-200",
      dotColor: "bg-orange-500",
      iconBgColor: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    low: {
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
      dotColor: "bg-blue-500",
      iconBgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
  };

  const config = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.low;

  // Format time
  const formatTime = (seconds?: number) => {
    if (seconds === undefined || seconds === null) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Format relative time
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

  // Footer buttons
  const footer = (
    <div className="flex items-center justify-between">
      <button
        onClick={onClose}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
      >
        Close
      </button>
      {onViewRecording && (
        <button
          onClick={() => onViewRecording(alert.session_id)}
          className="px-4 py-2 text-sm font-medium text-white bg-[#FF6B35] rounded-xl hover:bg-[#E85A2A] transition-colors flex items-center gap-2"
        >
          <PlayCircle className="w-4 h-4" />
          View Full Recording
        </button>
      )}
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={alert.category}
      subtitle={`Rule: ${alert.rule_code}`}
      icon={AlertOctagon}
      iconBgColor={config.iconBgColor}
      iconColor={config.iconColor}
      maxWidth="3xl"
      footer={footer}
    >
      <div className="space-y-6">
        {/* Severity and Status Badges */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor}`}
          >
            <span className={`w-2 h-2 rounded-full ${config.dotColor}`}></span>
            {alert.severity.toUpperCase()}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            alert.status === "new"
              ? "bg-blue-100 text-blue-700"
              : alert.status === "reviewed"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-green-100 text-green-700"
          }`}>
            {alert.status}
          </span>
        </div>
        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Detected:</span>
            <span className="font-medium text-gray-900">
              {formatRelativeTime(alert.created_at)}
            </span>
          </div>
          {alert.speaker_id && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Speaker:</span>
              <span className="font-medium text-gray-900">{alert.speaker_id}</span>
            </div>
          )}
        </div>

        {/* Audio Timeline */}
        {(alert.audio_start !== undefined && alert.audio_end !== undefined) && (
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <PlayCircle className="w-4 h-4" />
              Audio Timeline
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-mono text-gray-900">
                {formatTime(alert.audio_start)}
              </span>
              <span className="text-gray-400">→</span>
              <span className="font-mono text-gray-900">
                {formatTime(alert.audio_end)}
              </span>
              <span className="text-gray-500">
                ({((alert.audio_end - alert.audio_start)).toFixed(1)}s)
              </span>
            </div>
          </div>
        )}

        {/* Matched Text */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Matched Text
          </h3>
          <div className={`rounded-xl p-4 border-l-4 ${config.borderColor} ${config.bgColor}`}>
            <p className="text-base font-mono text-gray-900">
              "{alert.matched_text}"
            </p>
          </div>
        </div>

        {/* Matched Pattern */}
        {alert.matched_pattern && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Matched Pattern
            </h3>
            <div className="bg-gray-50 rounded-xl p-3">
              <code className="text-xs text-gray-700 font-mono break-all">
                {alert.matched_pattern}
              </code>
            </div>
          </div>
        )}

        {/* Context */}
        {alert.context_text && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Full Context
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-sm text-gray-700 leading-relaxed">
                {alert.context_text}
              </p>
            </div>
          </div>
        )}

        {/* Session Info */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Session Information
          </h3>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Session ID:</span>
              <span className="font-mono text-gray-900 text-xs">
                {alert.session_id}
              </span>
            </div>
            {alert.transcript_id && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Transcript ID:</span>
                <span className="font-mono text-gray-900 text-xs">
                  {alert.transcript_id}
                </span>
              </div>
            )}
            {alert.entity_type && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Entity Type:</span>
                <span className="font-medium text-gray-900">
                  {alert.entity_type}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
