"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
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
import ComplianceAlertModal from "@/components/ComplianceAlertModal";
import DeleteConfirmModal from "@/components/modals/DeleteConfirmModal";

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
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedTranscriptId, setSelectedTranscriptId] = useState<string | undefined>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const loadingRef = useRef(false); // Prevent duplicate loads
  const activeSegmentRef = useRef<HTMLDivElement>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  // Load session data
  useEffect(() => {
    async function loadData() {
      if (!sessionId || loadingRef.current) return;

      loadingRef.current = true;
      setLoadingData(true);

      const data = await getSessionWithTranscripts(sessionId);

      if (data) {
        setSession(data.session);
        setTranscripts(data.transcripts);

        // CRITICAL FIX: Set duration from DB immediately after loading session
        // This ensures the timeline works correctly from the first playback
        if (data.session.duration_seconds && data.session.duration_seconds > 0) {
          setDuration(data.session.duration_seconds);
          console.log('✅ Initialized duration from DB:', data.session.duration_seconds);
        }
      } else {
        toast.error("Recording not found");
        router.push("/dashboard/recordings");
      }

      setLoadingData(false);
      loadingRef.current = false;
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]); // Only depend on sessionId, not router

  // Optimize active segment calculation with throttling
  useEffect(() => {
    if (transcripts.length === 0 || !isPlaying) {
      setActiveSegmentIndex(null);
      return;
    }

    // Binary search for better performance with large transcript lists
    let left = 0;
    let right = transcripts.length - 1;
    let activeIndex = -1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const transcript = transcripts[mid];
      const nextTranscript = transcripts[mid + 1];
      const start = transcript.start_time;
      const end = nextTranscript ? nextTranscript.start_time : Infinity;

      if (currentTime >= start && currentTime < end) {
        activeIndex = mid;
        break;
      } else if (currentTime < start) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

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
      // CRITICAL FIX: Prefer session.duration_seconds from DB over audio.duration
      // WebM files often have Infinity or incorrect duration until fully played
      const dbDuration = session?.duration_seconds;
      const audioDuration = audioRef.current.duration;

      if (dbDuration && dbDuration > 0) {
        // Use DB duration as source of truth
        setDuration(dbDuration);
        console.log('✅ Using DB duration:', dbDuration);
      } else if (isFinite(audioDuration) && audioDuration > 0) {
        // Fallback to audio metadata if DB doesn't have it
        setDuration(audioDuration);
        console.log('⚠️ Using audio duration (DB unavailable):', audioDuration);
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
      // CRITICAL FIX: Only update duration if we don't have it from DB already
      // This prevents overwriting correct DB duration with incorrect audio metadata
      if (duration === 0 || !session?.duration_seconds) {
        const audioDuration = audioRef.current.duration;
        if (isFinite(audioDuration) && audioDuration > 0) {
          setDuration(audioDuration);
          console.log('⚠️ Updated duration from audio metadata:', audioDuration);
        }
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

  const handleSegmentClick = useCallback((transcript: CallTranscript, index: number) => {
    if (audioRef.current && session?.audio_url) {
      // Immediately update UI state for instant feedback
      setActiveSegmentIndex(index);
      setCurrentTime(transcript.start_time);

      // Then update audio
      audioRef.current.currentTime = transcript.start_time;
      if (!isPlaying) {
        audioRef.current.play().catch(() => {
          // Ignore autoplay errors
        });
        setIsPlaying(true);
      }
    }
  }, [session?.audio_url, isPlaying]);

  // Auto-scroll to active segment
  useEffect(() => {
    if (activeSegmentIndex !== null && activeSegmentRef.current && transcriptContainerRef.current) {
      const container = transcriptContainerRef.current;
      const element = activeSegmentRef.current;

      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      // Only scroll if element is not fully visible
      if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeSegmentIndex]);

  // Use duration from state (which is set from DB or audio metadata)
  const effectiveDuration = duration;

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

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
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
      setShowDeleteModal(false);
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
      <div className="min-h-screen bg-gray-50">
        <Sidebar />

        <div className={`p-8 transition-all duration-300 ${isCollapsed ? "ml-20" : "ml-64"}`}>
          {/* Header Skeleton */}
          <div className="mb-8">
            {/* Back button skeleton */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Title and actions skeleton */}
            <div className="flex items-start justify-between">
              <div>
                <div className="h-8 w-48 bg-gray-200 rounded-lg mb-3 animate-pulse" />
                <div className="flex items-center gap-4">
                  <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-28 bg-gray-200 rounded-xl animate-pulse" />
                <div className="h-10 w-24 bg-gray-200 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Audio Player & Stats Skeleton */}
            <div className="lg:col-span-1 space-y-6">
              {/* Audio Player Skeleton */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex flex-col items-center">
                  {/* Play button skeleton */}
                  <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />

                  {/* Time display skeleton */}
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-2 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                  </div>

                  {/* Progress bar skeleton */}
                  <div className="w-full mt-4">
                    <div className="h-1 bg-gray-200 rounded-full animate-pulse" />
                  </div>

                  {/* Controls skeleton */}
                  <div className="flex items-center justify-center gap-1 mt-5">
                    <div className="w-9 h-9 bg-gray-200 rounded-full animate-pulse" />
                    <div className="w-16 h-7 bg-gray-200 rounded-full animate-pulse" />
                    <div className="w-9 h-9 bg-gray-200 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Stats Card Skeleton */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="h-5 w-32 bg-gray-200 rounded mb-4 animate-pulse" />
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                      </div>
                      <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Transcript Skeleton */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
                      <div>
                        <div className="h-5 w-24 bg-gray-200 rounded mb-2 animate-pulse" />
                        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="h-7 w-20 bg-gray-200 rounded-lg animate-pulse" />
                  </div>
                </div>

                {/* Transcript segments skeleton */}
                <div className="max-h-[600px] overflow-hidden">
                  <div className="divide-y divide-gray-100">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="px-5 py-4">
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                          <div className="flex-1">
                            <div className="space-y-2 mb-2">
                              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                              <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
                              <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse" />
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
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
                onClick={handleDeleteClick}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Audio Player & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Audio Player Card - Apple-style minimalist design */}
            <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-200 overflow-hidden">
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
                          transition-colors duration-200 ease-out
                          ${audioLoading
                            ? 'bg-gray-100 cursor-wait'
                            : 'bg-[#FF6B35] hover:bg-[#E85A2A] active:scale-95 shadow-lg'
                          }
                        `}
                      >
                        {audioLoading ? (
                          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        ) : isPlaying ? (
                          <Pause className="w-6 h-6 text-white" />
                        ) : (
                          <Play className="w-6 h-6 text-white ml-0.5" />
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

              <div ref={transcriptContainerRef} className="max-h-[600px] overflow-y-auto custom-scrollbar">
                {transcripts.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {transcripts.map((transcript, index) => (
                      <div
                        key={transcript.id}
                        ref={activeSegmentIndex === index ? activeSegmentRef : null}
                        onClick={() => handleSegmentClick(transcript, index)}
                        className={`px-5 py-4 cursor-pointer transition-colors duration-100 ${
                          activeSegmentIndex === index
                            ? transcript.has_alert
                              ? "bg-red-50/50 border-l-4 border-red-500"
                              : "bg-[#FF6B35]/5 border-l-4 border-[#FF6B35]"
                            : transcript.has_alert
                            ? "bg-red-50/30 hover:bg-red-50/50"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-100 ${
                                activeSegmentIndex === index
                                  ? "bg-[#FF6B35] text-white scale-110"
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
                            <div className="flex items-center justify-between gap-3 mt-2 text-xs text-gray-500">
                              <div className="flex items-center gap-3">
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
                                {transcript.sentiment && (
                                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded ${
                                    transcript.sentiment === 'positive' ? 'bg-green-50 text-green-600' :
                                    transcript.sentiment === 'negative' ? 'bg-red-50 text-red-600' :
                                    'bg-gray-50 text-gray-600'
                                  }`}>
                                    {transcript.sentiment === 'positive' ? '😊' :
                                     transcript.sentiment === 'negative' ? '😟' : '😐'}
                                    {transcript.sentiment}
                                  </span>
                                )}
                                {transcript.language_code && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                                    🌐 {transcript.language_code}
                                  </span>
                                )}
                                {transcript.has_alert && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 rounded font-medium">
                                    <AlertTriangle className="w-3 h-3" />
                                    Compliance Alert
                                  </span>
                                )}
                              </div>

                              {/* View Details Button - Right aligned */}
                              {transcript.has_alert && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTranscriptId(transcript.id);
                                    setShowAlertModal(true);
                                  }}
                                  className="relative text-red-600 hover:text-red-700 hover:underline transition-all animate-pulse-subtle text-xs font-medium"
                                >
                                  View Details
                                </button>
                              )}
                            </div>
                          </div>
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
        .custom-scrollbar {
          /* Enable hardware acceleration */
          will-change: scroll-position;
          transform: translateZ(0);
        }
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

        /* Optimize transitions with hardware acceleration */
        .custom-scrollbar > div > div {
          will-change: background-color, border-color;
          transform: translateZ(0);
        }

        /* View Details Button Animation */
        @keyframes pulse-subtle {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.85;
          }
        }

        .animate-pulse-subtle {
          animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        /* Accessibility: Respect user's motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .animate-pulse-subtle {
            animation: none;
          }
        }
      `}</style>

      {/* Compliance Alert Modal */}
      <ComplianceAlertModal
        isOpen={showAlertModal}
        onClose={() => {
          setShowAlertModal(false);
          setSelectedTranscriptId(undefined);
        }}
        sessionId={sessionId}
        transcriptId={selectedTranscriptId}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Recording"
        message="Are you sure you want to delete this recording? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDeleting={deleting}
      />
    </div>
  );
}
