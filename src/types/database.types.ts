/**
 * VoxGuard AI - Database Types
 * Auto-generated from Supabase schema
 */

export interface Database {
  public: {
    Tables: {
      call_sessions: {
        Row: {
          id: string;
          recording_id: string | null;
          user_id: string;
          session_type: 'recording' | 'call' | 'meeting';
          status: 'recording' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'flagged';
          started_at: string;
          ended_at: string | null;
          duration_seconds: number | null;
          // Real-time metrics
          total_segments: number;
          total_words: number;
          total_chars: number;
          avg_latency_ms: number | null;
          min_latency_ms: number | null;
          max_latency_ms: number | null;
          connection_state: Record<string, any>;
          // Batch processing results
          batch_processed: boolean;
          entities_detected: Array<{ type: string; count: number }>;
          speakers_detected: number | null;
          // Compliance summary
          total_alerts: number;
          max_severity: 'info' | 'warning' | 'critical' | null;
          risk_score: number;
          // Audio
          audio_url: string | null;
          // Metadata
          device_info: Record<string, any>;
          network_quality: 'excellent' | 'good' | 'fair' | 'poor' | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recording_id?: string | null;
          user_id: string;
          session_type?: 'recording' | 'call' | 'meeting';
          status?: 'recording' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'flagged';
          started_at?: string;
          ended_at?: string | null;
          total_segments?: number;
          total_words?: number;
          total_chars?: number;
          avg_latency_ms?: number | null;
          min_latency_ms?: number | null;
          max_latency_ms?: number | null;
          connection_state?: Record<string, any>;
          batch_processed?: boolean;
          entities_detected?: Array<{ type: string; count: number }>;
          speakers_detected?: number | null;
          total_alerts?: number;
          max_severity?: 'info' | 'warning' | 'critical' | null;
          risk_score?: number;
          audio_url?: string | null;
          device_info?: Record<string, any>;
          network_quality?: 'excellent' | 'good' | 'fair' | 'poor' | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          recording_id?: string | null;
          user_id?: string;
          session_type?: 'recording' | 'call' | 'meeting';
          status?: 'recording' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'flagged';
          started_at?: string;
          ended_at?: string | null;
          total_segments?: number;
          total_words?: number;
          total_chars?: number;
          avg_latency_ms?: number | null;
          min_latency_ms?: number | null;
          max_latency_ms?: number | null;
          connection_state?: Record<string, any>;
          batch_processed?: boolean;
          entities_detected?: Array<{ type: string; count: number }>;
          speakers_detected?: number | null;
          total_alerts?: number;
          max_severity?: 'info' | 'warning' | 'critical' | null;
          risk_score?: number;
          audio_url?: string | null;
          device_info?: Record<string, any>;
          network_quality?: 'excellent' | 'good' | 'fair' | 'poor' | null;
          created_at?: string;
        };
      };
      call_transcripts: {
        Row: {
          id: string;
          session_id: string;
          segment_index: number;
          text: string;
          // Timing
          start_time: number | null;
          end_time: number | null;
          timestamp_ms: number;
          relative_time_ms: number | null;
          // Word-level data
          words: Array<{
            word: string;
            start: number;
            end: number;
            logprob?: number;
          }>;
          word_count: number | null;
          char_count: number | null;
          language: string | null;
          confidence: number | null;
          is_partial: boolean;
          // Batch enrichment
          speaker_id: string | null;
          speaker_role: string | null;
          entities: Array<{
            type: string;
            text: string;
            start: number;
            end: number;
          }>;
          // Compliance
          has_alert: boolean;
          alert_ids: string[] | null;
          // Source
          source: 'realtime' | 'batch';
          // Performance
          latency_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          segment_index: number;
          text: string;
          start_time?: number | null;
          end_time?: number | null;
          timestamp_ms: number;
          relative_time_ms?: number | null;
          words?: Array<{
            word: string;
            start: number;
            end: number;
            logprob?: number;
          }>;
          word_count?: number | null;
          char_count?: number | null;
          language?: string | null;
          confidence?: number | null;
          is_partial?: boolean;
          speaker_id?: string | null;
          speaker_role?: string | null;
          entities?: Array<{
            type: string;
            text: string;
            start: number;
            end: number;
          }>;
          has_alert?: boolean;
          alert_ids?: string[] | null;
          source?: 'realtime' | 'batch';
          latency_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          segment_index?: number;
          text?: string;
          start_time?: number | null;
          end_time?: number | null;
          timestamp_ms?: number;
          relative_time_ms?: number | null;
          words?: Array<{
            word: string;
            start: number;
            end: number;
            logprob?: number;
          }>;
          word_count?: number | null;
          char_count?: number | null;
          language?: string | null;
          confidence?: number | null;
          is_partial?: boolean;
          speaker_id?: string | null;
          speaker_role?: string | null;
          entities?: Array<{
            type: string;
            text: string;
            start: number;
            end: number;
          }>;
          has_alert?: boolean;
          alert_ids?: string[] | null;
          source?: 'realtime' | 'batch';
          latency_ms?: number | null;
          created_at?: string;
        };
      };
      compliance_alerts: {
        Row: {
          id: string;
          session_id: string;
          transcript_id: string | null;
          rule_id: string | null;
          // Rule info
          rule_code: string;
          rule_name: string;
          category: string;
          severity: 'info' | 'warning' | 'critical';
          // Match details
          matched_text: string;
          matched_pattern: string | null;
          context_text: string | null;
          // Location
          audio_start: number | null;
          audio_end: number | null;
          // Speaker info
          speaker_id: string | null;
          speaker_role: string | null;
          // Entity info
          entity_type: string | null;
          entity_value: string | null;
          // Status
          status: 'new' | 'reviewed' | 'resolved' | 'false_positive';
          reviewed_by: string | null;
          reviewed_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          transcript_id?: string | null;
          rule_id?: string | null;
          rule_code: string;
          rule_name: string;
          category: string;
          severity: 'info' | 'warning' | 'critical';
          matched_text: string;
          matched_pattern?: string | null;
          context_text?: string | null;
          audio_start?: number | null;
          audio_end?: number | null;
          speaker_id?: string | null;
          speaker_role?: string | null;
          entity_type?: string | null;
          entity_value?: string | null;
          status?: 'new' | 'reviewed' | 'resolved' | 'false_positive';
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          transcript_id?: string | null;
          rule_id?: string | null;
          rule_code?: string;
          rule_name?: string;
          category?: string;
          severity?: 'info' | 'warning' | 'critical';
          matched_text?: string;
          matched_pattern?: string | null;
          context_text?: string | null;
          audio_start?: number | null;
          audio_end?: number | null;
          speaker_id?: string | null;
          speaker_role?: string | null;
          entity_type?: string | null;
          entity_value?: string | null;
          status?: 'new' | 'reviewed' | 'resolved' | 'false_positive';
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      call_sessions_summary: {
        Row: {
          id: string;
          user_id: string;
          session_type: string;
          status: string;
          started_at: string;
          ended_at: string | null;
          duration_seconds: number | null;
          avg_latency_ms: number | null;
          total_segments: number;
          transcript_count: number;
          full_transcript: string | null;
          avg_confidence: number | null;
        };
      };
    };
  };
}

// Convenience types
export type CallSession = Database['public']['Tables']['call_sessions']['Row'];
export type CallSessionInsert = Database['public']['Tables']['call_sessions']['Insert'];
export type CallSessionUpdate = Database['public']['Tables']['call_sessions']['Update'];

export type CallTranscript = Database['public']['Tables']['call_transcripts']['Row'];
export type CallTranscriptInsert = Database['public']['Tables']['call_transcripts']['Insert'];
export type CallTranscriptUpdate = Database['public']['Tables']['call_transcripts']['Update'];

export type ComplianceAlert = Database['public']['Tables']['compliance_alerts']['Row'];
export type ComplianceAlertInsert = Database['public']['Tables']['compliance_alerts']['Insert'];
export type ComplianceAlertUpdate = Database['public']['Tables']['compliance_alerts']['Update'];

export type CallSessionSummary = Database['public']['Views']['call_sessions_summary']['Row'];
