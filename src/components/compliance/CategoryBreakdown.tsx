'use client';

import {
  RulesByCategory,
  getCategoryLabel,
  getSeverityBadgeClass,
} from '@/types/compliance.types';

interface CategoryBreakdownProps {
  data: RulesByCategory[];
}

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  // Group by category
  const categoryGroups = data.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, RulesByCategory[]>);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col" style={{ maxHeight: '480px' }}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Rules by Category
      </h3>
      <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
        {Object.entries(categoryGroups).map(([category, items]) => {
          const totalRules = items.reduce((sum, item) => sum + item.rule_count, 0);
          const avgRisk = items.reduce(
            (sum, item) => sum + item.avg_risk_score * item.rule_count,
            0
          ) / totalRules;

          return (
            <div
              key={category}
              className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-900"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                  {getCategoryLabel(category as any)}
                </h4>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {totalRules} {totalRules === 1 ? 'rule' : 'rules'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {items.map((item, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 rounded-md text-xs font-medium ${getSeverityBadgeClass(
                        item.severity
                      )}`}
                    >
                      {item.severity.charAt(0).toUpperCase()}: {item.rule_count}
                    </span>
                  ))}
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 ml-2">
                  {avgRisk.toFixed(0)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}
