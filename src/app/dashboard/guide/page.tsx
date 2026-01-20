'use client';

import Sidebar from "@/components/dashboard/Sidebar";
import { useSidebar } from '@/contexts/SidebarContext';
import { BookOpen, Mic, Upload, AlertTriangle, Shield, BarChart3, CheckCircle } from 'lucide-react';

export default function GuidePage() {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className={`p-8 transition-all duration-300 ${isCollapsed ? "ml-20" : "ml-64"}`}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Platform Guide
          </h1>
          <p className="text-gray-600">
            Learn how to use VoxGuard AI for compliance detection
          </p>
        </div>

        {/* Platform Overview */}
        <section className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">What is VoxGuard AI?</h2>
          </div>
          <p className="text-gray-700 leading-relaxed">
            VoxGuard AI is an advanced compliance monitoring platform that uses artificial intelligence
            to analyze voice conversations and detect potential compliance violations in real-time.
            Our system helps organizations maintain regulatory compliance, protect sensitive information,
            and ensure professional communication standards.
          </p>
        </section>

        {/* Getting Started */}
        <section className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Getting Started</h2>
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Mic className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Record or Upload Conversations</h3>
                <p className="text-gray-700 leading-relaxed">
                  Navigate to the <span className="font-medium text-gray-900">Recordings</span> page to start a new recording
                  using your microphone or upload existing audio files. Supported formats include MP3, WAV, and M4A.
                  Simply click the record button or drag and drop your audio files to get started.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Automatic Transcription & Analysis</h3>
                <p className="text-gray-700 leading-relaxed">
                  Once uploaded, our AI automatically transcribes the audio and analyzes it against your
                  configured compliance rules. This process typically takes just a few seconds. The system
                  uses advanced speech recognition and natural language processing to ensure accuracy.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Review Alerts</h3>
                <p className="text-gray-700 leading-relaxed">
                  Visit the <span className="font-medium text-gray-900">Alerts Center</span> to review any compliance
                  violations detected. Each alert includes the violation type, severity level, timestamp,
                  and relevant transcript excerpt. You can filter alerts by severity, type, or date range
                  to focus on what matters most.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Configure Compliance Rules</h3>
                <p className="text-gray-700 leading-relaxed">
                  Go to <span className="font-medium text-gray-900">Compliance</span> to view and manage your compliance
                  rules. You can enable/disable rules, adjust severity levels, and customize detection parameters
                  to match your organization's requirements. Create custom rules for industry-specific regulations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Compliance Detection Features */}
        <section className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Compliance Detection Capabilities</h2>
          <p className="text-gray-700 mb-6 leading-relaxed">
            VoxGuard AI detects various types of compliance violations including:
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">PII (Personally Identifiable Information)</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Detection of social security numbers, credit card numbers, addresses, phone numbers,
                  and other sensitive personal data that should not be shared in conversations.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Profanity & Inappropriate Language</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Identification of unprofessional or offensive language in customer interactions.
                  Helps maintain professional communication standards across your organization.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Regulatory Compliance</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Monitoring for required disclosures, consent statements, and regulatory language
                  (GDPR, HIPAA, financial regulations, telemarketing rules, and more).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Custom Rules</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Configure custom compliance rules specific to your industry and organizational policies.
                  Define keywords, phrases, or patterns that should trigger alerts.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Overview */}
        <section className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h2>
          </div>
          <p className="text-gray-700 leading-relaxed">
            The <span className="font-medium text-gray-900">Dashboard</span> provides a comprehensive overview of your
            compliance monitoring activity including total recordings processed, active alerts, compliance
            score, and recent activity. Use this to track trends and identify areas requiring attention.
            The dashboard updates in real-time as new recordings are processed and analyzed.
          </p>
        </section>

        {/* Best Practices */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-1 border-blue-200 p-8 mb-6">
          <h2 className="text-2xl font-semibold text-blue-900 mb-4">Best Practices</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-blue-900 text-sm">
                Review alerts regularly to address compliance issues promptly
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-blue-900 text-sm">
                Ensure audio quality is clear for accurate transcription
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-blue-900 text-sm">
                Configure compliance rules to match your specific regulatory requirements
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-blue-900 text-sm">
                Use tags and filters to organize recordings by department, agent, or campaign
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-blue-900 text-sm">
                Export compliance reports for audit and training purposes
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-blue-900 text-sm">
                Train your team on compliance requirements using flagged examples
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
