import { useCallback, useEffect, useRef, useState } from "react";

interface TranscriptWord {
  word: string;
  start: number;
  end: number;
}

interface TranscriptSegment {
  id: string;
  text: string;
  words?: TranscriptWord[];
  language?: string;
  confidence?: number;
  timestamp: number;
}

interface ScribeConfig {
  modelId?: string;
  sampleRate?: number;
  commitStrategy?: "manual" | "vad";
  includeTimestamps?: boolean;
  includeLanguageDetection?: boolean;
  vadThreshold?: number;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
}

const WORKLET_URL = "/audio-processor.worklet.js";

// =============================================================================
// Token Management
// ElevenLabs single-use tokens can only be used ONCE to establish a connection.
// Each WebSocket connection MUST have its own unique token.
// We DO NOT deduplicate token requests because each connection needs a fresh token.
// =============================================================================

// Module-level connection lock to prevent multiple simultaneous connections
// This is needed because React Strict Mode mounts components twice in development
let globalConnectionLock = false;
let activeWebSocket: WebSocket | null = null;

async function fetchNewToken(): Promise<string> {
  const response = await fetch("/api/elevenlabs-token", {
    credentials: "include", // Important: include cookies for Supabase auth
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data.token) {
    throw new Error("No token available");
  }

  console.log("✅ Got new token from server");
  return data.token;
}

// Latency metrics interface
interface LatencyMetrics {
  lastChunkSentAt: number;
  lastResponseAt: number;
  lastLatency: number;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  sampleCount: number;
}

export function useScribeRecording(config: ScribeConfig = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState("");
  const [committedTranscripts, setCommittedTranscripts] = useState<TranscriptSegment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<"disconnected" | "connecting" | "connected" | "reconnecting" | "error">("disconnected");
  const [latencyMetrics, setLatencyMetrics] = useState<LatencyMetrics>({
    lastChunkSentAt: 0,
    lastResponseAt: 0,
    lastLatency: 0,
    avgLatency: 0,
    minLatency: Infinity,
    maxLatency: 0,
    sampleCount: 0,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isIntentionalDisconnectRef = useRef(false);
  const isConnectingRef = useRef(false); // Prevent concurrent connection attempts
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  // Audio recording for storage
  const audioChunksRef = useRef<Blob[]>([]);

  // Latency tracking refs
  const lastChunkSentTimeRef = useRef<number>(0);
  const latencyHistoryRef = useRef<number[]>([]);

  // Track recording state in ref for use in WebSocket close handler
  const isRecordingRef = useRef<boolean>(false);

  const {
    modelId = "scribe_v2_realtime",
    sampleRate = 16000,
    commitStrategy = "vad",
    includeTimestamps = true,
    includeLanguageDetection = true,
    vadThreshold = 0.4,
    maxReconnectAttempts = 5,
    reconnectDelay = 1000,
  } = config;

  // Helper: Exponential backoff for reconnect
  const getReconnectDelay = useCallback((attempt: number) => {
    return Math.min(reconnectDelay * Math.pow(2, attempt), 30000); // Max 30s
  }, [reconnectDelay]);

  // Helper: Update latency metrics
  const updateLatencyMetrics = useCallback((latency: number) => {
    latencyHistoryRef.current.push(latency);
    // Keep last 100 samples
    if (latencyHistoryRef.current.length > 100) {
      latencyHistoryRef.current.shift();
    }

    const history = latencyHistoryRef.current;
    const avg = history.reduce((a, b) => a + b, 0) / history.length;
    const min = Math.min(...history);
    const max = Math.max(...history);

    setLatencyMetrics({
      lastChunkSentAt: lastChunkSentTimeRef.current,
      lastResponseAt: performance.now(),
      lastLatency: Math.round(latency),
      avgLatency: Math.round(avg),
      minLatency: Math.round(min),
      maxLatency: Math.round(max),
      sampleCount: history.length,
    });

    // Log every 10th sample for debugging
    if (history.length % 10 === 0) {
      console.log(`📊 Latency: ${Math.round(latency)}ms (avg: ${Math.round(avg)}ms, min: ${Math.round(min)}ms, max: ${Math.round(max)}ms)`);
    }
  }, []);

  // Connect to ElevenLabs WebSocket
  const connect = useCallback(async () => {
    // Use module-level lock to prevent multiple simultaneous connections
    // This handles React Strict Mode double-mounting and concurrent calls
    if (globalConnectionLock) {
      console.log("⚠️ Global connection lock active, skipping");
      return;
    }

    // Check if there's already an active WebSocket
    if (activeWebSocket?.readyState === WebSocket.CONNECTING ||
        activeWebSocket?.readyState === WebSocket.OPEN) {
      console.log("⚠️ Already connected or connecting (global WebSocket)");
      // Sync local ref with global state
      wsRef.current = activeWebSocket;
      setIsConnected(activeWebSocket.readyState === WebSocket.OPEN);
      setConnectionState(activeWebSocket.readyState === WebSocket.OPEN ? "connected" : "connecting");
      return;
    }

    // Also check local ref
    if (wsRef.current?.readyState === WebSocket.CONNECTING ||
        wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("⚠️ Already connected or connecting (local ref)");
      return;
    }

    globalConnectionLock = true;
    isConnectingRef.current = true;

    try {
      setConnectionState("connecting");
      console.log("🔄 Fetching token for WebSocket connection...");

      // Always get a fresh token - single-use tokens cannot be reused
      const token = await fetchNewToken();

      // Build WebSocket URL with token in query params
      const url = new URL("wss://api.elevenlabs.io/v1/speech-to-text/realtime");
      url.searchParams.set("token", token);
      url.searchParams.set("model_id", modelId);
      url.searchParams.set("commit_strategy", commitStrategy);
      url.searchParams.set("include_timestamps", String(includeTimestamps));
      url.searchParams.set("include_language_detection", String(includeLanguageDetection));
      url.searchParams.set("vad_threshold", String(vadThreshold));

      const ws = new WebSocket(url.toString());

      ws.addEventListener("open", () => {
        console.log("✅ Connected to ElevenLabs Scribe WebSocket");
        setIsConnected(true);
        setConnectionState("connected");
        setError(null);
        reconnectAttemptsRef.current = 0; // Reset reconnect counter on successful connection
        isConnectingRef.current = false;
        globalConnectionLock = false; // Release lock on successful connection
      });

      ws.addEventListener("message", (event) => {
        try {
          const responseTime = performance.now();
          const message = JSON.parse(event.data);
          const messageType = message.type || message.message_type;

          switch (messageType) {
            case "session_started":
              console.log("✅ Session started:", message);
              break;

            case "partial_transcript":
              // Calculate latency from last sent chunk
              if (lastChunkSentTimeRef.current > 0) {
                const latency = responseTime - lastChunkSentTimeRef.current;
                updateLatencyMetrics(latency);
              }
              setPartialTranscript(message.text || message.partial_transcript || "");
              break;

            case "committed_transcript":
            case "committed_transcript_with_timestamps":
              // Skip empty or whitespace-only transcripts
              const text = (message.text || "").trim();
              if (!text || text.length < 2) {
                console.log("⚠️ Skipping empty or too short transcript");
                setPartialTranscript("");
                break;
              }

              const segment: TranscriptSegment = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                text: text,
                words: message.words,
                language: message.language,
                confidence: message.confidence,
                timestamp: Date.now(),
              };
              setCommittedTranscripts((prev) => {
                // Check if this exact segment already exists (prevent duplicates)
                // Compare by text content - if last segment has same text, skip
                const lastSegment = prev[prev.length - 1];
                if (lastSegment && lastSegment.text === segment.text) {
                  console.warn("⚠️ Duplicate transcript detected (same as last segment), skipping");
                  return prev;
                }

                // Also check if any recent segment (within 2 seconds) has same text
                const recentDuplicate = prev.some(s =>
                  s.text === segment.text &&
                  Math.abs(s.timestamp - segment.timestamp) < 2000
                );
                if (recentDuplicate) {
                  console.warn("⚠️ Duplicate transcript detected (recent), skipping");
                  return prev;
                }

                return [...prev, segment];
              });
              setPartialTranscript("");
              break;

            case "error":
            case "auth_error":
              setError(message.message || message.error || "Authentication error");
              setConnectionState("error");
              break;

            case "invalid_request":
              setError(`Invalid request: ${message.error || "Unknown error"}`);
              setConnectionState("error");
              console.error("❌ Invalid request:", message);
              break;

            case "input_error":
              console.error("❌ Input error:", message.error);
              break;

            case "quota_exceeded":
              setError("Quota exceeded. Please check your ElevenLabs plan.");
              setConnectionState("error");
              break;

            case "rate_limited":
              setError("Rate limited. Please slow down requests.");
              setConnectionState("error");
              break;

            default:
              console.log("⚠️ Unknown message type:", messageType, message);
          }
        } catch (err) {
          console.error("Failed to parse message:", err);
        }
      });

      ws.addEventListener("error", () => {
        // Error event doesn't contain useful info - details come in 'close' event
        // Just update state, logging happens in close event
        setIsConnected(false);
        setConnectionState("error");
        isConnectingRef.current = false;
        globalConnectionLock = false; // Release lock on error
        activeWebSocket = null;
      });

      ws.addEventListener("close", (event) => {
        // Clear global WebSocket reference
        if (activeWebSocket === ws) {
          activeWebSocket = null;
        }

        // ElevenLabs normal close codes:
        // 1000 = normal closure (after commit)
        // 1005 = no status received (normal for VAD mode)
        // 1006 = abnormal closure (can happen on network issues, but also on normal session end)
        const normalCloseCodes = [1000, 1005, 1006];
        const isNormalClose = normalCloseCodes.includes(event.code);

        // Only treat as error if it's an abnormal code AND has an error reason
        const isErrorClose = !isNormalClose || (event.reason && event.reason.toLowerCase().includes("error"));

        if (isErrorClose) {
          console.warn("⚠️ WebSocket closed unexpectedly", {
            code: event.code,
            reason: event.reason || "No reason provided",
            wasClean: event.wasClean,
          });
          setError(`Connection closed (code ${event.code}). ${event.reason || "Please try again."}`);
        } else {
          // Normal close - just log for debugging, not as error
          console.log("🔌 WebSocket closed", {
            code: event.code,
            reason: event.reason || "Session ended",
          });
        }

        setIsConnected(false);
        setConnectionState("disconnected");
        globalConnectionLock = false; // Release lock on close

        // Auto-reconnect logic - ONLY if recording is active
        // Don't reconnect if idle - ElevenLabs closes idle connections after ~30s
        // and we don't want an infinite reconnect loop when not recording
        if (!isIntentionalDisconnectRef.current && isRecordingRef.current) {
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            setConnectionState("reconnecting");
            const delay = getReconnectDelay(reconnectAttemptsRef.current);
            console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})...`);

            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current++;
              connect();
            }, delay);
          } else {
            setError(`Connection lost. Maximum reconnection attempts (${maxReconnectAttempts}) reached.`);
            setConnectionState("error");
          }
        } else if (isIntentionalDisconnectRef.current) {
          // Was intentional, reset flag
          isIntentionalDisconnectRef.current = false;
        }
        // If not recording and not intentional, just stay disconnected (normal idle close)
      });

      wsRef.current = ws;
      activeWebSocket = ws; // Track globally
    } catch (err) {
      console.error("❌ Failed to connect:", err);
      const errorMessage = err instanceof Error ? err.message : "Connection failed";
      setError(errorMessage);
      setIsConnected(false);
      setConnectionState("error");
      isConnectingRef.current = false;
      globalConnectionLock = false; // Release lock on catch

      // Retry on connection failure
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = getReconnectDelay(reconnectAttemptsRef.current);
        console.log(`🔄 Retrying connection in ${delay}ms...`);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          connect();
        }, delay);
      }
    }
  }, [modelId, commitStrategy, includeTimestamps, includeLanguageDetection, vadThreshold, maxReconnectAttempts, getReconnectDelay]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    isIntentionalDisconnectRef.current = true;

    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      // Only close if WebSocket is in OPEN or CONNECTING state
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        try {
          wsRef.current.close();
        } catch (err) {
          console.warn("WebSocket close error during disconnect:", err);
        }
      }
      // Clear global reference if it matches
      if (activeWebSocket === wsRef.current) {
        activeWebSocket = null;
      }
      wsRef.current = null;
    }
    setIsConnected(false);
    setConnectionState("disconnected");
    isConnectingRef.current = false;
    globalConnectionLock = false; // Release lock
  }, []);

  // Send audio chunk to ElevenLabs
  const sendAudioChunk = useCallback(
    (audioData: ArrayBuffer, commit: boolean = false) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.warn("⚠️ WebSocket not connected, cannot send audio");
        return;
      }

      // Convert ArrayBuffer to base64
      const base64Audio = arrayBufferToBase64(audioData);

      const message = {
        message_type: "input_audio_chunk",
        audio_base_64: base64Audio,
        commit,
        sample_rate: sampleRate,
      };

      try {
        // Record send time for latency measurement
        lastChunkSentTimeRef.current = performance.now();
        wsRef.current.send(JSON.stringify(message));
      } catch (err) {
        console.error("❌ Failed to send audio chunk:", err);
      }
    },
    [sampleRate]
  );

  // Start recording from microphone using AudioWorklet
  const startRecording = useCallback(async () => {
    try {
      // Clear previous transcripts when starting new recording
      setCommittedTranscripts([]);
      setPartialTranscript("");

      // Reset latency metrics
      latencyHistoryRef.current = [];
      lastChunkSentTimeRef.current = 0;
      setLatencyMetrics({
        lastChunkSentAt: 0,
        lastResponseAt: 0,
        lastLatency: 0,
        avgLatency: 0,
        minLatency: Infinity,
        maxLatency: 0,
        sampleCount: 0,
      });

      if (!isConnected) {
        await connect();
        // Wait a bit for connection to establish
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log("🎤 Starting recording with AudioWorklet...");

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      mediaStreamRef.current = stream;

      // Create MediaRecorder for visualization library and audio storage
      try {
        const recorder = new MediaRecorder(stream);

        // Collect audio chunks for storage
        audioChunksRef.current = [];
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.start(1000); // Collect chunks every 1 second
        mediaRecorderRef.current = recorder;
        setMediaRecorder(recorder);
        console.log("✅ MediaRecorder started for audio storage");
      } catch (err) {
        console.warn("MediaRecorder not supported, visualization may be limited:", err);
      }

      // Create AudioContext
      const audioContext = new AudioContext({ sampleRate });
      audioContextRef.current = audioContext;

      // Load AudioWorklet module
      try {
        await audioContext.audioWorklet.addModule(WORKLET_URL);
      } catch (err) {
        console.error("❌ Failed to load AudioWorklet:", err);
        throw new Error("Failed to load audio processor. Please refresh the page.");
      }

      // Create AudioWorklet node
      const workletNode = new AudioWorkletNode(audioContext, 'audio-capture-processor');
      audioWorkletNodeRef.current = workletNode;

      // Handle messages from worklet (audio data)
      workletNode.port.onmessage = (event) => {
        if (event.data.type === 'audio') {
          sendAudioChunk(event.data.data);
        }
      };

      // Connect audio graph
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(workletNode);
      workletNode.connect(audioContext.destination);

      setIsRecording(true);
      isRecordingRef.current = true;
      setError(null);
      console.log("✅ Recording started");
    } catch (err) {
      console.error("❌ Failed to start recording:", err);
      setError(err instanceof Error ? err.message : "Failed to start recording");

      // Cleanup on error
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    }
  }, [isConnected, connect, sendAudioChunk, sampleRate]);

  // Stop recording
  const stopRecording = useCallback(() => {
    console.log("⏹️ Stopping recording...");

    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setMediaRecorder(null);
    }

    // Disconnect audio worklet
    if (audioWorkletNodeRef.current) {
      audioWorkletNodeRef.current.disconnect();
      audioWorkletNodeRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Send final commit
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = {
        message_type: "input_audio_chunk",
        audio_base_64: "",
        commit: true,
        sample_rate: sampleRate,
      };
      wsRef.current.send(JSON.stringify(message));
    }

    setIsRecording(false);
    isRecordingRef.current = false;
    console.log("✅ Recording stopped");
  }, [sampleRate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("🧹 Cleaning up useScribeRecording (component unmount)...");

      // Stop recording
      if (audioWorkletNodeRef.current) {
        audioWorkletNodeRef.current.disconnect();
        audioWorkletNodeRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

      // Disconnect WebSocket
      isIntentionalDisconnectRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        // Only close if WebSocket is in OPEN or CONNECTING state
        if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
          try {
            wsRef.current.close();
          } catch (err) {
            console.warn("WebSocket close error during cleanup:", err);
          }
        }
        // Clear global reference if it matches
        if (activeWebSocket === wsRef.current) {
          activeWebSocket = null;
        }
        wsRef.current = null;
      }
      // Reset flags to prevent stale state
      isConnectingRef.current = false;
      globalConnectionLock = false;
    };
  }, []); // Empty deps - only run on unmount

  // Getter для mediaStream (для визуализации аудио)
  const getMediaStream = useCallback(() => {
    return mediaStreamRef.current;
  }, []);

  // Get audio blob for storage
  const getAudioBlob = useCallback((): Blob | null => {
    if (audioChunksRef.current.length === 0) {
      console.warn("No audio chunks available");
      return null;
    }

    try {
      const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      console.log(`📦 Created audio blob: ${blob.size} bytes (${mimeType})`);
      return blob;
    } catch (err) {
      console.error("Failed to create audio blob:", err);
      return null;
    }
  }, []);

  return {
    isConnected,
    isRecording,
    partialTranscript,
    committedTranscripts,
    error,
    connectionState,
    latencyMetrics,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    sendAudioChunk,
    getMediaStream,
    getAudioBlob,
    mediaRecorder,
  };
}

// Helper function to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
