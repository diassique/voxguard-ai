"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import { Upload, LogIn } from "lucide-react";
import ScribeRecorder from "@/components/ScribeRecorder";
import { useSidebar } from "@/contexts/SidebarContext";

export default function RecordingsPage() {
  const { user, loading, refreshSession } = useAuth();
  const router = useRouter();
  const [savedTranscripts, setSavedTranscripts] = useState<string[]>([]);
  const { isCollapsed } = useSidebar();

  // Refresh session on mount to ensure we have latest auth state
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    // Only redirect if we're done loading and there's no user
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  const handleTranscriptComplete = (transcript: string) => {
    setSavedTranscripts(prev => [...prev, transcript]);
    // TODO: Save to Supabase database
    console.log("Transcript completed:", transcript);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated (will redirect shortly)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to access recordings</p>
          <a
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className={`p-8 transition-all duration-300 ${isCollapsed ? "ml-20" : "ml-64"}`}>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Recordings</h1>
              <p className="text-gray-600 mt-1">Record and manage your voice recordings</p>
            </div>
          </div>
        </div>

        {/* Live Recording with WebSocket */}
        <div className="mb-8">
          <ScribeRecorder onTranscriptComplete={handleTranscriptComplete} />
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center mb-8 hover:border-gray-400 transition-colors">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Audio Files</h3>
          <p className="text-gray-600 mb-4">Drag and drop your audio files here, or click to browse</p>
          <p className="text-sm text-gray-500">Supports MP3, WAV, M4A, FLAC (max 500MB)</p>
        </div>

        {/* Recordings List */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">All Recordings</h2>
              <input
                type="text"
                placeholder="Search recordings..."
                className="px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
              />
            </div>
          </div>

          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recordings yet</h3>
            <p className="text-gray-600">Upload your first recording to get started</p>
          </div>
        </div>
      </div>
    </div>
  );
}
