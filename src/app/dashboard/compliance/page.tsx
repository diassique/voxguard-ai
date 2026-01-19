import { createClient } from '@/lib/supabase-server';
import Sidebar from "@/components/dashboard/Sidebar";
import { ComplianceStats } from '@/components/compliance/ComplianceStats';
import { RulesTable } from '@/components/compliance/RulesTable';
import { CategoryBreakdown } from '@/components/compliance/CategoryBreakdown';
import { ComplianceRule, RulesStats, RulesByCategory } from '@/types/compliance.types';
import { AlertCircle, TrendingUp, Settings, FileDown, ClipboardList } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getComplianceData() {
  const supabase = await createClient();

  // Fetch stats
  const { data: stats } = await supabase
    .from('v_rules_stats')
    .select('*')
    .single();

  // Fetch rules
  const { data: rules } = await supabase
    .from('compliance_rules')
    .select('*')
    .order('risk_score', { ascending: false });

  // Fetch category breakdown
  const { data: byCategory } = await supabase
    .from('v_rules_by_category')
    .select('*');

  return {
    stats: stats as RulesStats,
    rules: (rules || []) as ComplianceRule[],
    byCategory: (byCategory || []) as RulesByCategory[],
  };
}

export default async function CompliancePage() {
  const { stats, rules, byCategory } = await getComplianceData();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Compliance Rules Engine
          </h1>
          <p className="text-gray-600">
            Monitor and manage compliance rules for voice recordings. Powered by
            ElevenLabs Scribe V2 and AI detection.
          </p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="mb-8">
            <ComplianceStats stats={stats} />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Category Breakdown */}
          <div className="lg:col-span-1">
            {byCategory && byCategory.length > 0 && (
              <CategoryBreakdown data={byCategory} />
            )}
          </div>

          {/* Quick Actions & Regulatory Coverage */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all">
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

                <button className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all">
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

            {/* Jurisdictions Overview */}
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

        {/* Rules Table */}
        {rules && rules.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              All Compliance Rules ({rules.length})
            </h2>
            <RulesTable rules={rules} />
          </div>
        )}

        {/* No Data State */}
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
