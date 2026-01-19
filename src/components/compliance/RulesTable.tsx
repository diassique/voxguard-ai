'use client';

import { useState } from 'react';
import {
  ComplianceRule,
  getSeverityBadgeClass,
  getCategoryLabel,
  getJurisdictionLabel,
} from '@/types/compliance.types';

interface RulesTableProps {
  rules: ComplianceRule[];
}

export function RulesTable({ rules }: RulesTableProps) {
  const [selectedRule, setSelectedRule] = useState<ComplianceRule | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRules = rules.filter(
    (rule) =>
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.rule_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div>
        <input
          type="text"
          placeholder="Search rules by name, code, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-96 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-gray-300 dark:focus:border-gray-600"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <style jsx>{`
          .custom-table-scrollbar::-webkit-scrollbar {
            height: 6px;
          }
          .custom-table-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-table-scrollbar::-webkit-scrollbar-thumb {
            background: #e5e7eb;
            border-radius: 8px;
          }
          .custom-table-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #d1d5db;
          }
        `}</style>
        <div className="overflow-x-auto custom-table-scrollbar">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rule Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Risk Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Jurisdiction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Triggers
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRules.map((rule) => (
                <tr
                  key={rule.id}
                  onClick={() => setSelectedRule(rule)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm font-mono text-blue-600 dark:text-blue-400">
                      {rule.rule_code}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {rule.name}
                    </div>
                    {rule.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {rule.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {getCategoryLabel(rule.category)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityBadgeClass(
                        rule.severity
                      )}`}
                    >
                      {rule.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {rule.risk_score}
                      </div>
                      <div className="ml-2 w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-yellow-400 to-red-600"
                          style={{ width: `${rule.risk_score}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {getJurisdictionLabel(rule.jurisdiction)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {rule.is_active ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {rule.total_triggers.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rule Details Modal */}
      {selectedRule && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedRule(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {selectedRule.name}
                </h2>
                <code className="text-sm font-mono text-blue-600 dark:text-blue-400">
                  {selectedRule.rule_code}
                </code>
              </div>
              <button
                onClick={() => setSelectedRule(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 custom-modal-scrollbar">
              <style jsx>{`
                .custom-modal-scrollbar::-webkit-scrollbar {
                  width: 6px;
                }
                .custom-modal-scrollbar::-webkit-scrollbar-track {
                  background: transparent;
                }
                .custom-modal-scrollbar::-webkit-scrollbar-thumb {
                  background: #d1d5db;
                  border-radius: 8px;
                }
                .custom-modal-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: #9ca3af;
                }
              `}</style>
              <div className="p-6">

              {/* Description */}
              {selectedRule.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedRule.description}
                  </p>
                </div>
              )}

              {/* Key Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Severity
                  </h3>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSeverityBadgeClass(
                      selectedRule.severity
                    )}`}
                  >
                    {selectedRule.severity.toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Risk Score
                  </h3>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedRule.risk_score}/100
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </h3>
                  <p className="text-gray-900 dark:text-white">
                    {getCategoryLabel(selectedRule.category)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Jurisdiction
                  </h3>
                  <p className="text-gray-900 dark:text-white">
                    {getJurisdictionLabel(selectedRule.jurisdiction)}
                  </p>
                </div>
              </div>

              {/* Regulation Info */}
              {selectedRule.regulation_name && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Regulation
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                    <p className="font-medium text-gray-900 dark:text-white mb-1">
                      {selectedRule.regulation_name}
                    </p>
                    {selectedRule.regulation_code && (
                      <code className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedRule.regulation_code}
                      </code>
                    )}
                    {selectedRule.regulation_url && (
                      <a
                        href={selectedRule.regulation_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View Regulation →
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Keywords */}
              {selectedRule.keywords && selectedRule.keywords.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Detection Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRule.keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-lg text-xs font-mono"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Alert Messages */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {selectedRule.alert_message && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Agent Alert
                    </h3>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 text-sm text-gray-700 dark:text-gray-300">
                      {selectedRule.alert_message}
                    </div>
                  </div>
                )}
                {selectedRule.supervisor_message && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Supervisor Alert
                    </h3>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-gray-700 dark:text-gray-300">
                      {selectedRule.supervisor_message}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Actions
                </h3>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 rounded-full text-sm">
                    {selectedRule.primary_action.replace(/_/g, ' ')}
                  </span>
                  {selectedRule.secondary_action && (
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 rounded-full text-sm">
                      {selectedRule.secondary_action.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Statistics
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedRule.total_triggers.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Total Triggers
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedRule.false_positive_count.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      False Positives
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedRule.false_positive_rate
                        ? (selectedRule.false_positive_rate * 100).toFixed(1)
                        : 0}
                      %
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      FP Rate
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
