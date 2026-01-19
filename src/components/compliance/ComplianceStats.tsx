'use client';

import { RulesStats } from '@/types/compliance.types';
import { ClipboardList, Shield, AlertTriangle } from 'lucide-react';

interface ComplianceStatsProps {
  stats: RulesStats;
}

export function ComplianceStats({ stats }: ComplianceStatsProps) {
  const mainStats = [
    {
      label: 'Total Rules',
      value: stats.total_rules,
      description: 'Compliance rules configured',
      icon: ClipboardList,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      trend: null,
    },
    {
      label: 'Active Rules',
      value: stats.active_rules,
      description: 'Currently monitoring',
      icon: Shield,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      trend: null,
    },
    {
      label: 'High Priority',
      value: stats.critical_rules + stats.high_rules,
      description: 'Critical & high severity',
      icon: AlertTriangle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      trend: null,
    },
  ];

  const severityBreakdown = [
    {
      label: 'Critical',
      value: stats.critical_rules,
      color: 'bg-red-500',
      textColor: 'text-red-600',
    },
    {
      label: 'High',
      value: stats.high_rules,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
    },
    {
      label: 'Medium',
      value: stats.medium_rules,
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
    },
    {
      label: 'Low',
      value: stats.low_rules,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats - 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mainStats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
              {stat.trend && (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  {stat.trend}
                </span>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm font-medium text-gray-900">{stat.label}</p>
              <p className="text-xs text-gray-500">{stat.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Severity Breakdown - Horizontal bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Severity Distribution</h3>
        <div className="grid grid-cols-4 gap-4">
          {severityBreakdown.map((severity, index) => (
            <div key={index} className="text-center">
              <div className="mb-2">
                <div className={`w-3 h-3 rounded-full ${severity.color} mx-auto mb-2`} />
                <p className={`text-2xl font-bold ${severity.textColor}`}>{severity.value}</p>
              </div>
              <p className="text-xs text-gray-600">{severity.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
