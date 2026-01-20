'use client';

import { Shield, FileText, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import BaseModal from './BaseModal';
import {
  ComplianceRule,
  getSeverityBadgeClass,
  getCategoryLabel,
  getJurisdictionLabel,
} from '@/types/compliance.types';

interface ComplianceRuleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rule: ComplianceRule | null;
}

export default function ComplianceRuleDetailsModal({
  isOpen,
  onClose,
  rule,
}: ComplianceRuleDetailsModalProps) {
  if (!rule) return null;

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

  const colors = getSeverityColor(rule.severity);

  const footer = (
    <button
      onClick={onClose}
      className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
    >
      Close
    </button>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={rule.name}
      subtitle={rule.rule_code}
      icon={Shield}
      iconBgColor={colors.bg}
      iconColor={colors.icon}
      footer={footer}
      maxWidth="3xl"
    >
      <div className={`border ${colors.border} ${colors.bg} rounded-xl p-5`}>
        {/* Rule Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
                {rule.severity.toUpperCase()}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {getCategoryLabel(rule.category)}
              </span>
            </div>
            {rule.description && (
              <p className="text-sm text-gray-600 mt-2">{rule.description}</p>
            )}
          </div>
          {rule.risk_score && (
            <div className="ml-4 text-right">
              <div className="text-2xl font-bold text-gray-900">
                {rule.risk_score}
              </div>
              <div className="text-xs text-gray-500">Risk Score</div>
            </div>
          )}
        </div>

        {/* Key Information Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Category</div>
            <div className="text-gray-900">{getCategoryLabel(rule.category)}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Jurisdiction</div>
            <div className="text-gray-900">{getJurisdictionLabel(rule.jurisdiction)}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Status</div>
            <div>
              {rule.is_active ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Inactive
                </span>
              )}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Version</div>
            <div className="text-gray-900">v{rule.version}</div>
          </div>
        </div>

        {/* Regulation Info */}
        {rule.regulation_name && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Regulation</span>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="font-medium text-gray-900 mb-1">
                {rule.regulation_name}
              </p>
              {rule.regulation_code && (
                <code className="text-sm text-gray-600">{rule.regulation_code}</code>
              )}
              {rule.regulation_url && (
                <a
                  href={rule.regulation_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  View Regulation →
                </a>
              )}
            </div>
          </div>
        )}

        {/* Detection Keywords */}
        {rule.keywords && rule.keywords.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Detection Keywords</span>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex flex-wrap gap-2">
                {rule.keywords.slice(0, 10).map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono"
                  >
                    {keyword}
                  </span>
                ))}
                {rule.keywords.length > 10 && (
                  <span className="px-2 py-1 text-gray-500 text-xs">
                    +{rule.keywords.length - 10} more
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Alert Messages */}
        {(rule.alert_message || rule.supervisor_message) && (
          <div className="mb-4 space-y-3">
            {rule.alert_message && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Agent Alert</div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-gray-700">
                  {rule.alert_message}
                </div>
              </div>
            )}
            {rule.supervisor_message && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Supervisor Alert</div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-gray-700">
                  {rule.supervisor_message}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Actions</div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
              {rule.primary_action.replace(/_/g, ' ')}
            </span>
            {rule.secondary_action && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                {rule.secondary_action.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Statistics</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {rule.total_triggers.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Total Triggers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {rule.false_positive_count.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">False Positives</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {rule.false_positive_rate
                  ? (rule.false_positive_rate * 100).toFixed(1)
                  : 0}
                %
              </div>
              <div className="text-xs text-gray-600">FP Rate</div>
            </div>
          </div>
        </div>

        {/* Thresholds & Limits */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Clock className="w-4 h-4" />
              <span>Cooldown Period</span>
            </div>
            <div className="text-gray-900 font-medium">
              {rule.cooldown_seconds}s
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span>Max Alerts/Session</span>
            </div>
            <div className="text-gray-900 font-medium">
              {rule.max_alerts_per_session}
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
