"use client";

import { useEffect } from "react";
import { useScribeRecording } from "@/hooks/useScribeRecording";
import { Mic, MicOff, Loader2, AlertCircle } from "lucide-react";

interface ScribeRecorderProps {
  onTranscriptComplete?: (transcript: string) => void;
}

export default function ScribeRecorder({ onTranscriptComplete }: ScribeRecorderProps) {
  const {
    isConnected,
    isRecording,
    partialTranscript,
    committedTranscripts,
    error,
    connectionState,
    connect,
    startRecording,
    stopRecording,
  } = useScribeRecording({
    modelId: "scribe_v2_realtime",
    sampleRate: 16000,
    commitStrategy: "vad",
    includeTimestamps: true,
    includeLanguageDetection: true,
    maxReconnectAttempts: 5,
    reconnectDelay: 1000,
  });

  // Auto-connect on component mount (with cleanup to prevent double-connect in React Strict Mode)
  useEffect(() => {
    let cancelled = false;

    const initConnection = async () => {
      if (!cancelled && !isConnected) {
        console.log("🎤 ScribeRecorder component mounted, connecting...");
        await connect();
      }
    };

    initConnection();

    // Cleanup function to prevent double connection in React Strict Mode
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();

      // Combine all transcripts
      const fullTranscript = committedTranscripts.map(t => t.text).join(" ");
      if (onTranscriptComplete && fullTranscript) {
        onTranscriptComplete(fullTranscript);
      }
    } else {
      startRecording();
    }
  };

  const fullTranscript = committedTranscripts.map(t => t.text).join(" ");

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Live Recording</h3>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${
              connectionState === 'connected' ? 'bg-green-500' :
              connectionState === 'connecting' || connectionState === 'reconnecting' ? 'bg-yellow-500 animate-pulse' :
              connectionState === 'error' ? 'bg-red-500' :
              'bg-gray-400'
            }`} />
            <p className="text-sm text-gray-600">
              {connectionState === 'connected' && (isRecording ? "Recording..." : "Ready")}
              {connectionState === 'connecting' && "Connecting..."}
              {connectionState === 'reconnecting' && "Reconnecting..."}
              {connectionState === 'disconnected' && "Disconnected"}
              {connectionState === 'error' && "Connection Error"}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleRecording}
          disabled={
            connectionState === 'connecting' ||
            connectionState === 'reconnecting' ||
            (connectionState !== 'connected' && !isRecording)
          }
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
            isRecording
              ? "bg-red-500 hover:bg-red-600 active:bg-red-700"
              : "bg-[#FF6B35] hover:bg-[#E85A2A] active:bg-[#D14E1F]"
          } text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
        >
          {connectionState === 'connecting' || connectionState === 'reconnecting' ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : isRecording ? (
            <MicOff className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Transcription Display */}
      <div className="space-y-4">
        {/* Partial (Real-time) Transcript */}
        {partialTranscript && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-xs font-medium text-yellow-800 mb-1">Real-time (partial)</p>
            <p className="text-sm text-gray-900 italic">{partialTranscript}</p>
          </div>
        )}

        {/* Committed Transcripts */}
        {committedTranscripts.length > 0 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-xs font-medium text-green-800 mb-2">Transcription</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {committedTranscripts.map((segment) => (
                <div key={segment.id} className="text-sm text-gray-900">
                  <span>{segment.text}</span>
                  {segment.language && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({segment.language})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!partialTranscript && committedTranscripts.length === 0 && !error && (
          <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-xl">
            <Mic className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900">Ready to record</p>
            <p className="text-xs text-gray-600 mt-1">
              Click the microphone button to start recording
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      {committedTranscripts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
          <span>
            {committedTranscripts.length} segment{committedTranscripts.length !== 1 ? "s" : ""}
          </span>
          <span>{fullTranscript.split(" ").filter(Boolean).length} words</span>
        </div>
      )}
    </div>
  );
}
