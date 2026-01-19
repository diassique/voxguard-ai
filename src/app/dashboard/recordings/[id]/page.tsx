"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  ArrowLeft,
  Play,
  Pause,
  Download,
  Trash2,
  Clock,
  FileText,
  Volume2,
  SkipBack,
  SkipForward,
  AlertTriangle,
  CheckCircle,
  User,
} from "lucide-react";
import { toast } from "sonner";
import {
  getSessionWithTranscripts,
  type CallSession,
  type CallTranscript,
} from "@/lib/supabase-recording";
import { createClient } from "@/lib/supabase";

export default function RecordingDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  const { isCollapsed } = useSidebar();

  const [session, setSession] = useState<CallSession | null>(null);
  const [transcripts, setTranscripts] = useState<CallTranscript[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(true);
  const [audioReady, setAudioReady] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  // Load session data
  useEffect(() => {
    async function loadData() {
      if (!sessionId) return;

      setLoadingData(true);
      const data = await getSessionWithTranscripts(sessionId);

      if (data) {
        setSession(data.session);
        setTranscripts(data.transcripts);
      } else {
        toast.error("Recording not found");
        router.push("/dashboard/recordings");
      }

      setLoadingData(false);
    }

    loadData();
  }, [sessionId, router]);

  // Update active segment based on current time
  useEffect(() => {
    if (transcripts.length === 0 || !isPlaying) return;

    const activeIndex = transcripts.findIndex((t, i) => {
      const nextTranscript = transcripts[i + 1];
      const start = t.start_time;
      const end = nextTranscript ? nextTranscript.start_time : Infinity;
      return currentTime >= start && currentTime < end;
    });

    setActiveSegmentIndex(activeIndex >= 0 ? activeIndex : null);
  }, [currentTime, transcripts, isPlaying]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const audioDuration = audioRef.current.duration;
      if (isFinite(audioDuration) && audioDuration > 0) {
        setDuration(audioDuration);
      }
      setAudioLoading(false);
      setAudioReady(true);
    }
  };

  const handleCanPlay = () => {
    setAudioLoading(false);
    setAudioReady(true);
  };

  const handleDurationChange = () => {
    if (audioRef.current) {
      const audioDuration = audioRef.current.duration;
      if (isFinite(audioDuration) && audioDuration > 0) {
        setDuration(audioDuration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSegmentClick = (transcript: CallTranscript) => {
    if (audioRef.current && session?.audio_url) {
      audioRef.current.currentTime = transcript.start_time;
      setCurrentTime(transcript.start_time);
      if (!isPlaying) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Track the max time we've seen during playback (for WebM duration workaround)
  const [maxSeenTime, setMaxSeenTime] = useState(0);

  // Update max seen time during playback
  useEffect(() => {
    if (currentTime > maxSeenTime) {
      setMaxSeenTime(currentTime);
    }
  }, [currentTime, maxSeenTime]);

  // Use audio metadata duration, or fall back to max seen time during playback
  const effectiveDuration = isFinite(duration) && duration > 0
    ? duration
    : (maxSeenTime > 0 ? maxSeenTime : 0);

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      const maxTime = effectiveDuration > 0 ? effectiveDuration : audioRef.current.duration || 0;
      audioRef.current.currentTime = Math.max(0, Math.min(maxTime, currentTime + seconds));
    }
  };

  const handleDownload = async () => {
    if (!session?.audio_url) {
      toast.error("No audio file available");
      return;
    }

    try {
      const response = await fetch(session.audio_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recording-${sessionId.slice(0, 8)}.webm`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Download started");
    } catch {
      toast.error("Failed to download audio");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this recording? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);

    try {
      const supabase = createClient();

      // Delete transcripts first
      await supabase.from("call_transcripts").delete().eq("session_id", sessionId);

      // Delete session
      await supabase.from("call_sessions").delete().eq("id", sessionId);

      // Delete audio file from storage if exists
      if (session?.audio_url) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const fileName = `${user.id}/${sessionId}.webm`;
          await supabase.storage.from("recordings").remove([fileName]);
        }
      }

      toast.success("Recording deleted");
      router.push("/dashboard/recordings");
    } catch {
      toast.error("Failed to delete recording");
      setDeleting(false);
    }
  };

  const formatTime = (seconds: number): string => {
    // Handle NaN, Infinity, and undefined
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
      return "--:--";
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
          <div className="text-gray-600">Loading recording...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className={`p-8 transition-all duration-300 ${isCollapsed ? "ml-20" : "ml-64"}`}>
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard/recordings")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Recordings</span>
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Recording Details
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span>
                  {formatDate(session.started_at)}
                </span>
                {session.duration_seconds && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {formatTime(session.duration_seconds)}
                  </span>
                )}
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    session.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : session.status === "recording"
                      ? "bg-blue-100 text-blue-700"
                      : session.status === "processing"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {session.status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleDownload}
                disabled={!session.audio_url}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Audio Player & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Audio Player Card - Apple-style minimalist design */}
            <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6">
                {session.audio_url && !audioError ? (
                  <>
                    <audio
                      ref={audioRef}
                      src={session.audio_url}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onDurationChange={handleDurationChange}
                      onCanPlay={handleCanPlay}
                      onEnded={() => {
                        setIsPlaying(false);
                        // WebM duration fix: when audio ends, we know the real duration
                        if (audioRef.current && audioRef.current.currentTime > 0) {
                          setDuration(audioRef.current.currentTime);
                        }
                      }}
                      onError={(e) => {
                        console.error('Audio error:', e);
                        setAudioError('Failed to load audio file');
                        setAudioLoading(false);
                        toast.error('Failed to load audio file');
                      }}
                      preload="auto"
                    />

                    {/* Centered play button - Apple Music style */}
                    <div className="flex flex-col items-center">
                      {/* Main Play/Pause Button */}
                      <button
                        onClick={handlePlayPause}
                        disabled={audioLoading}
                        className={`
                          w-16 h-16 rounded-full flex items-center justify-center
                          transition-all duration-200 ease-out
                          ${audioLoading
                            ? 'bg-gray-100 cursor-wait'
                            : 'bg-[#FF6B35] hover:bg-[#E85A2A] hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
                          }
                        `}
                      >
                        {audioLoading ? (
                          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        ) : isPlaying ? (
                          <Pause className="w-6 h-6 text-white" />
                        ) : (
                          <Play className="w-6 h-6 text-white ml-1" />
                        )}
                      </button>

                      {/* Time Display */}
                      <div className="mt-4 flex items-center gap-3 text-sm tabular-nums">
                        <span className="text-gray-900 font-medium min-w-[42px] text-right">
                          {formatTime(currentTime)}
                        </span>
                        <span className="text-gray-300">/</span>
                        <span className="text-gray-500 min-w-[42px]">
                          {formatTime(effectiveDuration)}
                        </span>
                      </div>

                      {/* Progress Bar - Full width, Apple-style thin */}
                      <div className="w-full mt-4">
                        <div
                          className="relative h-1 bg-gray-200 rounded-full cursor-pointer group"
                          onClick={(e) => {
                            if (effectiveDuration <= 0) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                            const newTime = percent * effectiveDuration;
                            if (audioRef.current) {
                              audioRef.current.currentTime = newTime;
                              setCurrentTime(newTime);
                            }
                          }}
                        >
                          {/* Buffer/Track Background */}
                          <div className="absolute inset-0 bg-gray-200 rounded-full" />

                          {/* Played Progress */}
                          <div
                            className="absolute left-0 top-0 h-full bg-[#FF6B35] rounded-full transition-all duration-75"
                            style={{
                              width: `${effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0}%`
                            }}
                          />

                          {/* Scrubber Knob - appears on hover */}
                          <div
                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-[#FF6B35] rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                            style={{
                              left: `calc(${effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0}% - 6px)`
                            }}
                          />
                        </div>
                      </div>

                      {/* Skip Controls - Minimal style */}
                      <div className="flex items-center justify-center gap-1 mt-5">
                        <button
                          onClick={() => handleSkip(-10)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                          title="Skip back 10 seconds"
                        >
                          <SkipBack className="w-5 h-5" />
                        </button>

                        <button
                          onClick={() => {
                            if (audioRef.current) {
                              audioRef.current.currentTime = 0;
                              setCurrentTime(0);
                            }
                          }}
                          className="px-4 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          Restart
                        </button>

                        <button
                          onClick={() => handleSkip(10)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                          title="Skip forward 10 seconds"
                        >
                          <SkipForward className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${audioError ? 'bg-red-50' : 'bg-gray-100'}`}>
                      <Volume2 className={`w-7 h-7 ${audioError ? 'text-red-400' : 'text-gray-400'}`} />
                    </div>
                    <p className={`text-sm font-medium ${audioError ? 'text-red-600' : 'text-gray-700'}`}>
                      {audioError || 'No audio available'}
                    </p>
                    <p className="text-gray-400 text-xs mt-1.5">
                      {audioError ? 'The audio file could not be loaded' : 'Recording was not saved'}
                    </p>
                    {audioError && (
                      <button
                        onClick={() => {
                          setAudioError(null);
                          setAudioLoading(true);
                          window.location.reload();
                        }}
                        className="mt-4 px-4 py-2 text-sm font-medium text-[#FF6B35] hover:bg-[#FF6B35]/10 rounded-full transition-colors"
                      >
                        Try again
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Recording Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Segments
                  </span>
                  <span className="text-sm font-medium text-gray-900">{session.total_segments}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Words
                  </span>
                  <span className="text-sm font-medium text-gray-900">{session.total_words}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Characters
                  </span>
                  <span className="text-sm font-medium text-gray-900">{session.total_chars}</span>
                </div>
                {session.avg_latency_ms && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Avg Latency
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round(session.avg_latency_ms)}ms
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Alerts
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      session.total_alerts > 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {session.total_alerts}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Risk Score
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      session.risk_score > 50
                        ? "text-red-600"
                        : session.risk_score > 20
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}
                  >
                    {session.risk_score}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Transcript */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Transcript</h3>
                      <p className="text-xs text-gray-500">
                        {transcripts.length} segments
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const fullText = transcripts.map((t) => t.text).join(" ");
                      navigator.clipboard.writeText(fullText);
                      toast.success("Transcript copied to clipboard");
                    }}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Copy All
                  </button>
                </div>
              </div>

              <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                {transcripts.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {transcripts.map((transcript, index) => (
                      <div
                        key={transcript.id}
                        onClick={() => handleSegmentClick(transcript)}
                        className={`px-5 py-4 cursor-pointer transition-all duration-200 ${
                          activeSegmentIndex === index
                            ? "bg-[#FF6B35]/5 border-l-4 border-[#FF6B35]"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                                activeSegmentIndex === index
                                  ? "bg-[#FF6B35] text-white"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {index + 1}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] text-gray-900 leading-relaxed">
                              {transcript.text}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3" />
                                {formatTime(transcript.start_time)}
                                {transcript.end_time && ` - ${formatTime(transcript.end_time)}`}
                              </span>
                              {transcript.word_count && (
                                <span>{transcript.word_count} words</span>
                              )}
                              {transcript.speaker_id && (
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-600 rounded">
                                  <User className="w-3 h-3" />
                                  {transcript.speaker_id}
                                </span>
                              )}
                            </div>
                          </div>
                          {transcript.has_alert && (
                            <div className="flex-shrink-0">
                              <span className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-medium">
                                Alert
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No transcript</h3>
                    <p className="text-gray-500 text-sm">
                      No transcript segments were saved for this recording
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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
      `}</style>
    </div>
  );
}
