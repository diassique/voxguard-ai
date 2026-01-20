'use client';

import Sidebar from "@/components/dashboard/Sidebar";
import { ComplianceStats } from '@/components/compliance/ComplianceStats';
import { RulesTable } from '@/components/compliance/RulesTable';
import { CategoryBreakdown } from '@/components/compliance/CategoryBreakdown';
import { ComplianceRule, RulesStats, RulesByCategory } from '@/types/compliance.types';
import { AlertCircle, TrendingUp, Settings, FileDown, ClipboardList } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CompliancePage() {
  const { isCollapsed } = useSidebar();
  const router = useRouter();
  const [stats, setStats] = useState<RulesStats | null>(null);
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [byCategory, setByCategory] = useState<RulesByCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/api/compliance');
        if (!response.ok) {
          throw new Error('Failed to fetch compliance data');
        }
        const data = await response.json();
        setStats(data.stats);
        setRules(data.rules);
        setByCategory(data.byCategory);
      } catch (error) {
        console.error('Error loading compliance data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />

        <div className={`p-8 transition-all duration-300 ${isCollapsed ? "ml-20" : "ml-64"}`}>
          <div className="mb-8">
            <div className="h-9 w-96 bg-gray-200 rounded-lg mb-3 animate-pulse" />
            <div className="h-5 w-full max-w-2xl bg-gray-200 rounded animate-pulse" />
          </div>

          <div className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="h-4 w-24 bg-gray-200 rounded mb-3 animate-pulse" />
                      <div className="h-8 w-16 bg-gray-200 rounded mb-2 animate-pulse" />
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gray-200 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="h-6 w-48 bg-gray-200 rounded mb-6 animate-pulse" />
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse" />
                        <div className="flex-1">
                          <div className="h-4 w-32 bg-gray-200 rounded mb-2 animate-pulse" />
                          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="h-5 w-12 bg-gray-200 rounded-full animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 flex-1">
                <div className="h-6 w-32 bg-gray-200 rounded mb-4 animate-pulse" />
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-gray-200">
                      <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 w-24 bg-gray-200 rounded mb-2 animate-pulse" />
                        <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="h-6 w-48 bg-gray-200 rounded mb-4 animate-pulse" />
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="text-center">
                        <div className="h-4 w-8 bg-gray-200 rounded mx-auto mb-2 animate-pulse" />
                        <div className="h-4 w-24 bg-gray-200 rounded mx-auto mb-1 animate-pulse" />
                        <div className="h-3 w-20 bg-gray-200 rounded mx-auto animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="h-7 w-64 bg-gray-200 rounded mb-4 animate-pulse" />
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-3 h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="col-span-4 h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="col-span-2 h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="col-span-1 h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="col-span-2 h-4 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="px-6 py-4 border-b border-gray-100">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3">
                      <div className="h-4 w-24 bg-gray-200 rounded mb-2 animate-pulse" />
                      <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="col-span-4">
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="col-span-2">
                      <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
                    </div>
                    <div className="col-span-1">
                      <div className="h-4 w-8 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="col-span-2">
                      <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse" />
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className={`p-8 transition-all duration-300 ${isCollapsed ? "ml-20" : "ml-64"}`}>
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Compliance Rules Engine
          </h1>
          <p className="text-gray-600">
            Monitor and manage compliance rules for voice recordings. Powered by
            ElevenLabs Scribe V2 and AI detection.
          </p>
        </div>

        {stats && (
          <div className="mb-6">
            <ComplianceStats stats={stats} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1">
            {byCategory && byCategory.length > 0 && (
              <CategoryBreakdown data={byCategory} />
            )}
          </div>

          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => router.push('/dashboard/alerts')}
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">
                      View Alerts
                    </div>
                    <div className="text-sm text-gray-600">
                      Recent violations
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">
                      Analytics
                    </div>
                    <div className="text-sm text-gray-600">
                      Trends & insights
                    </div>
                  </div>
                </button>

                <button className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">
                      Configure Rules
                    </div>
                    <div className="text-sm text-gray-600">
                      Add or modify
                    </div>
                  </div>
                </button>

                <button className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <FileDown className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">
                      Export Report
                    </div>
                    <div className="text-sm text-gray-600">
                      PDF/CSV export
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Regulatory Coverage
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="text-center">
                    <div className="text-xs font-semibold text-blue-600 mb-2">US</div>
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      SEC / FINRA
                    </div>
                    <div className="text-xs text-gray-600">
                      United States
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                  <div className="text-center">
                    <div className="text-xs font-semibold text-purple-600 mb-2">EU</div>
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      MiFID II / GDPR
                    </div>
                    <div className="text-xs text-gray-600">
                      European Union
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                  <div className="text-center">
                    <div className="text-xs font-semibold text-green-600 mb-2">GLOBAL</div>
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      PCI DSS / HIPAA
                    </div>
                    <div className="text-xs text-gray-600">
                      Global Standards
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {rules && rules.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              All Compliance Rules ({rules.length})
            </h2>
            <RulesTable rules={rules} />
          </div>
        )}

        {(!rules || rules.length === 0) && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No compliance rules found
            </h3>
            <p className="text-gray-600 mb-6">
              Get started by importing the compliance rules schema into your
              database.
            </p>
            <button className="px-6 py-3 bg-[#FF6B35] hover:bg-[#E85A2A] text-white rounded-xl font-medium transition-colors">
              Import Rules Schema
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
