"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import { Ban, FileText, Smile, Clock, Check } from "lucide-react";

export default function CompliancePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const rules = [
    {
      name: "Prohibited Keywords",
      description: "Detect specific words or phrases that violate compliance policies",
      enabled: true,
      icon: Ban,
    },
    {
      name: "Disclosure Requirements",
      description: "Ensure mandatory disclosures are communicated to clients",
      enabled: true,
      icon: FileText,
    },
    {
      name: "Sentiment Analysis",
      description: "Monitor conversation tone and detect potential issues",
      enabled: false,
      icon: Smile,
    },
    {
      name: "Call Duration Limits",
      description: "Alert when calls exceed specified duration thresholds",
      enabled: false,
      icon: Clock,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">Compliance</h1>
          <p className="text-gray-600 mt-1">Configure compliance rules and monitoring</p>
        </div>

        {/* Compliance Status */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-semibold">Compliance Status: Excellent</h2>
              </div>
              <p className="text-green-100">All systems are operating within compliance parameters</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold">100%</p>
              <p className="text-green-100">Compliance Rate</p>
            </div>
          </div>
        </div>

        {/* Compliance Rules */}
        <div className="bg-white rounded-2xl border border-gray-200 mb-6">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Compliance Rules</h2>
              <button className="text-sm text-[#FF6B35] hover:text-[#E85A2A] font-medium">
                + Add Rule
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {rules.map((rule, index) => (
              <div key={index} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    rule.enabled ? "bg-gray-100 text-gray-600" : "bg-gray-50 text-gray-400"
                  }`}>
                    <rule.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{rule.name}</h3>
                    <p className="text-sm text-gray-600">{rule.description}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={rule.enabled} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6B35]"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Violations */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Violations</h2>
          </div>

          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No violations detected</h3>
            <p className="text-gray-600">Your recordings are fully compliant</p>
          </div>
        </div>
      </div>
    </div>
  );
}
