'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Shield, FileText, Clock, User } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import BaseModal from './modals/BaseModal';

interface ComplianceAlert {
  id: string;
  rule_code: string;
  category: string;
  severity: string;
  matched_text: string;
  matched_pattern: string | null;
  context_text: string | null;
  audio_start: number | null;
  audio_end: number | null;
  speaker_id: string | null;
  status: string;
  created_at: string;
}

interface ComplianceRule {
  rule_code: string;
  name: string;
  description: string | null;
  category: string;
  severity: string;
  risk_score: number;
  patterns: string[];
  keywords: string[];
}

interface ComplianceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  transcriptId?: string;
}

export default function ComplianceAlertModal({
  isOpen,
  onClose,
  sessionId,
  transcriptId,
}: ComplianceAlertModalProps) {
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [rules, setRules] = useState<Map<string, ComplianceRule>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && sessionId) {
      loadAlerts();
    }
  }, [isOpen, sessionId, transcriptId]);

  const loadAlerts = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // Build query - if transcriptId provided, filter by it, otherwise show all session alerts
      let query = supabase
        .from('compliance_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (transcriptId) {
        // Show only alerts for this specific transcript
        query = query.eq('transcript_id', transcriptId);
      } else {
        // Show all alerts for this session
        query = query.eq('session_id', sessionId);
      }

      const { data: alertsData, error: alertsError } = await query;

      if (alertsError) {
        console.error('Error loading alerts:', alertsError);
        return;
      }

      setAlerts(alertsData || []);

      // Load associated rules
      if (alertsData && alertsData.length > 0) {
        const ruleCodes = [...new Set(alertsData.map(a => a.rule_code))];
        const { data: rulesData, error: rulesError } = await supabase
          .from('compliance_rules')
          .select('*')
          .in('rule_code', ruleCodes);

        if (!rulesError && rulesData) {
          const rulesMap = new Map();
          rulesData.forEach((rule: ComplianceRule) => {
            rulesMap.set(rule.rule_code, rule);
          });
          setRules(rulesMap);
        }
      }
    } catch (error) {
      console.error('Error loading compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-50',
          text: 'text-red-700',
          border: 'border-red-200',
          icon: 'text-red-600',
        };
      case 'high':
        return {
          bg: 'bg-orange-50',
          text: 'text-orange-700',
          border: 'border-orange-200',
          icon: 'text-orange-600',
        };
      case 'medium':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200',
          icon: 'text-amber-600',
        };
      default:
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          icon: 'text-blue-600',
        };
    }
  };

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryLabel = (category: string) => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const footer = (
    <button
      onClick={onClose}
      className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
    >
      Close
    </button>
  );

  const emptyState = (
    <div className="text-center py-12">
      <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-600">No compliance alerts found</p>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Compliance Alerts"
      subtitle={loading ? 'Loading...' : `${alerts.length} alert${alerts.length !== 1 ? 's' : ''} found`}
      icon={AlertTriangle}
      iconBgColor="bg-red-100"
      iconColor="text-red-600"
      loading={loading}
      footer={footer}
      maxWidth="3xl"
    >
      {alerts.length === 0 ? emptyState : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const rule = rules.get(alert.rule_code);
            const colors = getSeverityColor(alert.severity);

            return (
              <div
                key={alert.id}
                className={`border ${colors.border} ${colors.bg} rounded-xl p-5`}
              >
                {/* Alert Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {getCategoryLabel(alert.category)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {rule?.name || alert.rule_code}
                    </h3>
                    {rule?.description && (
                      <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                    )}
                  </div>
                  {rule?.risk_score && (
                    <div className="ml-4 text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {rule.risk_score}
                      </div>
                      <div className="text-xs text-gray-500">Risk Score</div>
                    </div>
                  )}
                </div>

                {/* Matched Text */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Matched Text</span>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-sm text-gray-900 font-mono">"{alert.matched_text}"</p>
                  </div>
                </div>

                {/* Context */}
                {alert.context_text && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Full Context</span>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-sm text-gray-700">{alert.context_text}</p>
                    </div>
                  </div>
                )}

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {alert.audio_start !== null && (
                    <div>
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <Clock className="w-4 h-4" />
                        <span>Timestamp</span>
                      </div>
                      <div className="text-gray-900 font-medium">
                        {formatTime(alert.audio_start)}
                        {alert.audio_end && ` - ${formatTime(alert.audio_end)}`}
                      </div>
                    </div>
                  )}
                  {alert.speaker_id && (
                    <div>
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <User className="w-4 h-4" />
                        <span>Speaker</span>
                      </div>
                      <div className="text-gray-900 font-medium">{alert.speaker_id}</div>
                    </div>
                  )}
                  {alert.matched_pattern && (
                    <div className="col-span-2">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <Shield className="w-4 h-4" />
                        <span>Matched Pattern</span>
                      </div>
                      <div className="text-gray-900 font-mono text-xs bg-gray-50 p-2 rounded">
                        {alert.matched_pattern}
                      </div>
                    </div>
                  )}
                </div>

                {/* Detection Keywords (from rule) */}
                {rule?.keywords && rule.keywords.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Detection Keywords</div>
                    <div className="flex flex-wrap gap-2">
                      {rule.keywords.slice(0, 10).map((keyword, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </BaseModal>
  );
}
