"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useScribeRecording } from "@/hooks/useScribeRecording";
import { useAudioAnalyzer } from "@/hooks/useAudioAnalyzer";
import { AudioVisualizer } from "@/components/audio";
import { toast } from "sonner";
import {
  createCallSession,
  saveTranscriptSegment,
  updateSessionLatency,
  completeCallSession,
  uploadAudioFile,
} from "@/lib/supabase-recording";
import {
  Mic,
  Loader2,
  AlertCircle,
  Clock,
  Languages,
  Wifi,
  WifiOff,
  Save,
  RotateCcw,
  FileText,
} from "lucide-react";

interface ScribeRecorderProps {
  onTranscriptComplete?: (transcript: string, segments: TranscriptSegment[]) => void;
  onSave?: (data: RecordingData) => void;
}

interface TranscriptSegment {
  id: string;
  text: string;
  words?: { word: string; start: number; end: number }[];
  language?: string;
  confidence?: number;
  timestamp: number;
}

interface RecordingData {
  transcript: string;
  segments: TranscriptSegment[];
  duration: number;
  language?: string;
}

export default function ScribeRecorder({
  onTranscriptComplete,
  onSave,
}: ScribeRecorderProps) {
  const {
    isRecording,
    partialTranscript,
    committedTranscripts,
    error,
    connectionState,
    latencyMetrics,
    connect,
    startRecording,
    stopRecording,
    getMediaStream,
    getAudioBlob,
  } = useScribeRecording({
    modelId: "scribe_v2_realtime",
    sampleRate: 16000,
    commitStrategy: "vad",
    includeTimestamps: true,
    includeLanguageDetection: true,
    maxReconnectAttempts: 5,
    reconnectDelay: 1000,
  });

  const { analysis, connectStream, disconnect: disconnectAnalyzer } = useAudioAnalyzer({
    fftSize: 256,
    smoothingTimeConstant: 0.8,
  });

  const [recordingDuration, setRecordingDuration] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const savedSegmentsRef = useRef<Set<number>>(new Set());

  // Автоскролл внутри контейнера транскриптов (не на всей странице)
  useEffect(() => {
    if (transcriptContainerRef.current && (committedTranscripts.length > 0 || partialTranscript)) {
      const container = transcriptContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [committedTranscripts, partialTranscript]);

  // Таймер записи
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Подключение анализатора к потоку при записи
  useEffect(() => {
    if (isRecording) {
      const stream = getMediaStream();
      if (stream) {
        connectStream(stream);
      }
    } else {
      disconnectAnalyzer();
    }
  }, [isRecording, getMediaStream, connectStream, disconnectAnalyzer]);

  // NOTE: We intentionally DO NOT auto-connect on mount.
  // ElevenLabs closes idle WebSocket connections after ~30 seconds,
  // which causes an infinite reconnect loop if we maintain a persistent connection.
  // Instead, connection is established on-demand when startRecording() is called.

  // Сохранять новые сегменты в БД
  useEffect(() => {
    if (!currentSessionId) return;

    const saveLatestSegment = async () => {
      const lastSegment = committedTranscripts[committedTranscripts.length - 1];
      if (!lastSegment) return;

      // Segment index should be 0-based (length - 1)
      const segmentIndex = committedTranscripts.length - 1;

      // Check if this segment was already saved
      if (savedSegmentsRef.current.has(segmentIndex)) {
        console.log(`⚠️ Segment ${segmentIndex} already saved, skipping`);
        return;
      }

      // Вычислить start_time и end_time
      let startTime = 0;
      let endTime = undefined;

      if (lastSegment.words && lastSegment.words.length > 0) {
        // Filter only "word" type entries (not "spacing")
        const wordEntries = lastSegment.words.filter((w: any) => w.type === 'word');
        if (wordEntries.length > 0) {
          startTime = wordEntries[0].start;
          const lastWord = wordEntries[wordEntries.length - 1];
          endTime = lastWord.end;
        }
      } else {
        // Fallback: использовать относительное время
        const relativeSeconds = (lastSegment.timestamp - recordingStartTime) / 1000;
        startTime = relativeSeconds;
      }

      // Сохранить в БД
      const saved = await saveTranscriptSegment(
        currentSessionId,
        segmentIndex,
        lastSegment.text,
        startTime,
        endTime,
        lastSegment.words,
      );

      if (saved) {
        // Mark this segment as saved
        savedSegmentsRef.current.add(segmentIndex);
        console.log(`💾 Segment ${segmentIndex} saved:`, lastSegment.text.substring(0, 50));

        // Обновить латентность
        if (latencyMetrics.lastLatency > 0) {
          await updateSessionLatency(currentSessionId, latencyMetrics.lastLatency);
        }
      }
    };

    saveLatestSegment();
  }, [committedTranscripts.length, currentSessionId, recordingStartTime, latencyMetrics.lastLatency]);

  const handleToggleRecording = useCallback(async () => {
    if (isRecording) {
      // STOP recording
      stopRecording();

      // Завершить сессию в БД
      if (currentSessionId) {
        await completeCallSession(currentSessionId);
        console.log('✅ Session completed:', currentSessionId);
      }

      const fullTranscript = committedTranscripts.map((t) => t.text).join(" ");
      if (onTranscriptComplete && fullTranscript) {
        onTranscriptComplete(fullTranscript, committedTranscripts);
      }
    } else {
      // START recording
      // Очистить список сохранённых сегментов для новой записи
      savedSegmentsRef.current.clear();

      // Создать сессию в БД
      const session = await createCallSession();
      if (session) {
        setCurrentSessionId(session.id);
        setRecordingStartTime(Date.now());
        console.log('✅ Session created:', session.id);
      }

      startRecording();
    }
  }, [isRecording, stopRecording, startRecording, committedTranscripts, onTranscriptComplete, currentSessionId]);

  const handleSave = useCallback(async () => {
    const fullTranscript = committedTranscripts.map((t) => t.text).join(" ");
    const detectedLanguage = committedTranscripts.find((t) => t.language)?.language;

    // Загрузить аудиофайл в Storage
    if (currentSessionId) {
      const audioBlob = getAudioBlob();
      if (audioBlob) {
        const loadingToast = toast.loading("Uploading audio...");
        const audioUrl = await uploadAudioFile(currentSessionId, audioBlob);
        toast.dismiss(loadingToast);

        if (audioUrl) {
          console.log("✅ Audio saved to:", audioUrl);
        } else {
          toast.error("Failed to upload audio");
        }
      } else {
        toast.error("No audio data available");
      }
    }

    // Вызвать callback onSave
    if (onSave && fullTranscript) {
      onSave({
        transcript: fullTranscript,
        segments: committedTranscripts,
        duration: recordingDuration,
        language: detectedLanguage,
      });
    }
  }, [committedTranscripts, recordingDuration, onSave, currentSessionId, getAudioBlob]);

  const handleReset = useCallback(() => {
    window.location.reload();
  }, []);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const fullTranscript = committedTranscripts.map((t) => t.text).join(" ");
  const wordCount = fullTranscript.split(" ").filter(Boolean).length;
  const detectedLanguage = committedTranscripts.find((t) => t.language)?.language;

  // Get first segment timestamp for relative time calculation
  const firstSegmentTimestamp = committedTranscripts.length > 0 ? committedTranscripts[0].timestamp : 0;

  // Статус соединения
  const connectionStatusConfig = {
    connected: {
      icon: Wifi,
      color: "text-green-500",
      bgColor: "bg-green-500",
      label: "Connected",
    },
    connecting: {
      icon: Loader2,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500",
      label: "Connecting...",
    },
    reconnecting: {
      icon: Loader2,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500",
      label: "Reconnecting...",
    },
    disconnected: {
      icon: WifiOff,
      color: "text-gray-400",
      bgColor: "bg-gray-400",
      label: "Ready to Connect",
    },
    error: {
      icon: AlertCircle,
      color: "text-red-500",
      bgColor: "bg-red-500",
      label: "Error",
    },
  };

  const status = connectionStatusConfig[connectionState];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT PANEL - Recording Controls */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col min-h-[500px] lg:h-[580px]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isRecording ? "bg-red-100" : "bg-[#FF6B35]/10"
              }`}
            >
              {isRecording ? (
                <div className="w-3 h-3 bg-red-500 rounded-sm animate-pulse" />
              ) : (
                <Mic className="w-5 h-5 text-[#FF6B35]" />
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {isRecording ? "Recording" : "Voice Recorder"}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${status.bgColor} ${
                  connectionState === "connecting" || connectionState === "reconnecting"
                    ? "animate-pulse"
                    : ""
                }`} />
                <span className={`text-xs ${status.color}`}>
                  {status.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-50/80 to-white">
          {/* Timer */}
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-500 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Duration</span>
            </div>
            <div className="text-4xl font-mono font-semibold text-gray-900 tracking-tight">
              {formatDuration(recordingDuration)}
            </div>
          </div>

          {/* Audio Visualizer */}
          <div className="w-full mb-8">
            <AudioVisualizer
              analysis={analysis}
              isRecording={isRecording}
              variant="bars"
              className="w-full"
            />
          </div>

          {/* Record Button */}
          <div className="relative">
            {/* Outer ring - subtle glow on recording */}
            {isRecording && (
              <div className="absolute inset-[-8px] rounded-full bg-red-500/10 animate-pulse" />
            )}

            <button
              onClick={handleToggleRecording}
              disabled={
                connectionState === "connecting" ||
                connectionState === "reconnecting"
              }
              className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-colors duration-200 ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-[#FF6B35] hover:bg-[#E85A2A]"
              } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {/* Inner content */}
              {connectionState === "connecting" || connectionState === "reconnecting" ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : isRecording ? (
                <div className="w-6 h-6 bg-white rounded-sm" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>
          </div>

          <span className="mt-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
            {isRecording ? "Stop" : "Record"}
          </span>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-5 mb-5 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 flex-1">{error}</p>
            <button
              onClick={() => connect()}
              className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Footer Actions */}
        {committedTranscripts.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-500 flex-wrap">
                <span className="font-medium whitespace-nowrap">
                  {committedTranscripts.length} segment{committedTranscripts.length !== 1 ? "s" : ""}
                </span>
                <span className="text-gray-300 hidden sm:inline">|</span>
                <span className="whitespace-nowrap">{wordCount} words</span>
                {detectedLanguage && (
                  <>
                    <span className="text-gray-300 hidden sm:inline">|</span>
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Languages className="w-3 h-3" />
                      {detectedLanguage.toUpperCase()}
                    </span>
                  </>
                )}
                {latencyMetrics.sampleCount > 0 && (
                  <>
                    <span className="text-gray-300 hidden sm:inline">|</span>
                    <span
                      className={`font-mono whitespace-nowrap ${
                        latencyMetrics.avgLatency < 200 ? "text-green-600" :
                        latencyMetrics.avgLatency < 500 ? "text-yellow-600" : "text-red-600"
                      }`}
                      title={`Min: ${latencyMetrics.minLatency}ms, Max: ${latencyMetrics.maxLatency}ms, Samples: ${latencyMetrics.sampleCount}`}
                    >
                      {latencyMetrics.avgLatency}ms avg
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                {onSave && (
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#FF6B35] rounded-xl hover:bg-[#E85A2A] transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL - Real-time Transcription */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col min-h-[500px] lg:h-[580px]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Live Transcription</h3>
                <p className="text-xs text-gray-500 mt-0.5">Real-time speech to text</p>
              </div>
            </div>
            {isRecording && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-red-600">LIVE</span>
              </div>
            )}
          </div>
        </div>

        {/* Transcription Content */}
        <div
          ref={transcriptContainerRef}
          className="relative flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
        >
          {/* Committed Segments */}
          {committedTranscripts.map((segment, index) => (
            <div
              key={segment.id}
              className="group relative p-5 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 hover:border-gray-200 transition-all duration-200 animate-fade-in"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] text-gray-900 leading-relaxed font-normal">
                    {segment.text}
                  </p>
                  <div className="flex items-center gap-2 sm:gap-3 mt-3 pt-3 border-t border-gray-100 flex-wrap">
                    {/* Timestamp - relative to recording start */}
                    <span className="flex items-center gap-1.5 text-xs text-gray-500 whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-mono font-medium">
                        {(() => {
                          // Use word timing if available, otherwise calculate relative time
                          let timeInSeconds = 0;
                          if (segment.words && segment.words.length > 0 && segment.words[0].start !== undefined) {
                            timeInSeconds = Math.floor(segment.words[0].start);
                          } else {
                            // Fallback: relative time from first segment
                            timeInSeconds = Math.floor((segment.timestamp - firstSegmentTimestamp) / 1000);
                          }
                          const minutes = Math.floor(timeInSeconds / 60);
                          const seconds = timeInSeconds % 60;
                          return `${minutes}:${String(seconds).padStart(2, '0')}`;
                        })()}
                      </span>
                    </span>

                    {/* Duration if we have word timings */}
                    {segment.words && segment.words.length > 0 && (
                      <>
                        <span className="text-gray-300 hidden sm:inline">•</span>
                        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                          {segment.words.length} {segment.words.length === 1 ? 'word' : 'words'}
                        </span>
                      </>
                    )}

                    {segment.language && (
                      <>
                        <span className="text-gray-300 hidden sm:inline">•</span>
                        <span className="flex items-center gap-1.5 text-xs text-gray-500 whitespace-nowrap">
                          <Languages className="w-3.5 h-3.5" />
                          <span className="font-medium">{segment.language.toUpperCase()}</span>
                        </span>
                      </>
                    )}
                    {segment.confidence && (
                      <>
                        <span className="text-gray-300 hidden sm:inline">•</span>
                        <span className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium whitespace-nowrap">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {Math.round(segment.confidence * 100)}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(segment.text);
                  toast.success("Text copied to clipboard");
                }}
                className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                title="Copy text"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          ))}

          {/* Partial (live) transcript */}
          {partialTranscript && (
            <div className="relative p-5 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-2xl border border-yellow-300/40 animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <div className="relative flex items-center justify-center w-4 h-4">
                  <div className="absolute w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                  <div className="absolute w-2 h-2 bg-yellow-500 rounded-full animate-ping opacity-75" style={{ transformOrigin: 'center' }} />
                </div>
                <span className="text-xs font-bold text-yellow-700 uppercase tracking-wider">
                  Listening...
                </span>
              </div>
              <p className="text-[15px] text-gray-800 leading-relaxed font-normal">
                {partialTranscript}
              </p>
            </div>
          )}

          {/* Empty State */}
          {!partialTranscript && committedTranscripts.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <div className="relative mb-6 inline-flex">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl flex items-center justify-center">
                  <FileText className="w-10 h-10 text-blue-500" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Mic className="w-4 h-4 text-white" />
                </div>
              </div>
              <h4 className="text-base font-semibold text-gray-700 mb-2">Ready to transcribe</h4>
              <p className="text-sm text-gray-500 max-w-[240px] leading-relaxed mx-auto">
                Click the record button to start converting your speech to text in real-time
              </p>
            </div>
          )}

        </div>

        {/* Footer Stats */}
        {committedTranscripts.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-sm font-semibold text-gray-700">{committedTranscripts.length}</span>
                  <span className="text-xs text-gray-500">segments</span>
                </div>
                <div className="h-4 w-px bg-gray-200" />
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-700">{wordCount}</span>
                  <span className="text-xs text-gray-500">words</span>
                </div>
                <div className="h-4 w-px bg-gray-200" />
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-700">{fullTranscript.length}</span>
                  <span className="text-xs text-gray-500">chars</span>
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(fullTranscript);
                  toast.success("All text copied to clipboard");
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF6B35] to-[#FF8F5F] hover:from-[#E85A2A] hover:to-[#E8744A] text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
