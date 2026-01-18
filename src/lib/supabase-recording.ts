/**
 * Supabase Recording Utils
 * Функции для сохранения real-time записей в БД
 */

import { createClient } from '@/lib/supabase';

export interface CallSession {
  id: string;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  status: 'recording' | 'processing' | 'completed' | 'flagged';
  total_segments: number;
  total_words: number;
  total_chars: number;
  avg_latency_ms?: number;
  batch_processed: boolean;
  entities_detected: Array<{ type: string; count: number }>;
  speakers_detected?: number;
  total_alerts: number;
  max_severity?: string;
  risk_score: number;
  audio_url?: string;
  created_at: string;
}

export interface CallTranscript {
  id: string;
  session_id: string;
  segment_index: number;
  text: string;
  start_time: number;
  end_time?: number;
  words?: Array<{ text: string; start: number; end: number; logprob?: number }>;
  word_count?: number;
  char_count?: number;
  speaker_id?: string;
  speaker_role?: string;
  entities?: Array<{ type: string; text: string; start: number; end: number }>;
  has_alert: boolean;
  alert_ids?: string[];
  source: 'realtime' | 'batch';
  created_at: string;
}

export interface ComplianceAlert {
  id: string;
  session_id: string;
  transcript_id?: string;
  rule_code: string;
  category: string;
  severity: string;
  matched_text: string;
  matched_pattern?: string;
  context_text?: string;
  audio_start?: number;
  audio_end?: number;
  speaker_id?: string;
  entity_type?: string;
  status: string;
  created_at: string;
}

/**
 * Создать новую сессию записи
 */
export async function createCallSession(): Promise<CallSession | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('call_sessions')
    .insert({
      status: 'recording',
      started_at: new Date().toISOString(),
      total_segments: 0,
      total_words: 0,
      total_chars: 0,
      batch_processed: false,
      entities_detected: [],
      total_alerts: 0,
      risk_score: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create call session:', error);
    return null;
  }

  return data as CallSession;
}

/**
 * Сохранить транскрипт сегмента
 */
export async function saveTranscriptSegment(
  sessionId: string,
  segmentIndex: number,
  text: string,
  startTime: number,
  endTime?: number,
  words?: Array<{ word: string; start: number; end: number }>,
): Promise<CallTranscript | null> {
  const supabase = createClient();

  const wordCount = text.split(' ').filter(Boolean).length;
  const charCount = text.length;

  const { data, error } = await supabase
    .from('call_transcripts')
    .insert({
      session_id: sessionId,
      segment_index: segmentIndex,
      text,
      start_time: startTime,
      end_time: endTime,
      words: words || [],
      word_count: wordCount,
      char_count: charCount,
      has_alert: false,
      source: 'realtime',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to save transcript segment:', error);
    return null;
  }

  console.log(`💾 Segment ${segmentIndex} saved to DB:`, text.substring(0, 50));

  // Обновить метрики сессии
  await updateSessionMetrics(sessionId, wordCount, charCount);

  return data as CallTranscript;
}

/**
 * Обновить метрики сессии
 */
export async function updateSessionMetrics(
  sessionId: string,
  newWords: number,
  newChars: number,
): Promise<void> {
  const supabase = createClient();

  // Получить текущие метрики
  const { data: session } = await supabase
    .from('call_sessions')
    .select('total_segments, total_words, total_chars')
    .eq('id', sessionId)
    .single();

  if (!session) {
    console.error('Session not found for updating metrics:', sessionId);
    return;
  }

  const newMetrics = {
    total_segments: session.total_segments + 1,
    total_words: session.total_words + newWords,
    total_chars: session.total_chars + newChars,
  };

  console.log('📊 Updating session metrics:', {
    sessionId: sessionId.slice(0, 8),
    before: session,
    after: newMetrics,
  });

  // Обновить
  const { error } = await supabase
    .from('call_sessions')
    .update(newMetrics)
    .eq('id', sessionId);

  if (error) {
    console.error('Failed to update session metrics:', error);
  }
}

/**
 * Обновить среднюю латентность
 */
export async function updateSessionLatency(
  sessionId: string,
  latencyMs: number,
): Promise<void> {
  const supabase = createClient();

  const { data: session } = await supabase
    .from('call_sessions')
    .select('total_segments, avg_latency_ms')
    .eq('id', sessionId)
    .single();

  if (!session) return;

  // Вычислить новую среднюю
  const totalLatency = (session.avg_latency_ms || 0) * session.total_segments;
  const newAvgLatency = (totalLatency + latencyMs) / (session.total_segments + 1);

  await supabase
    .from('call_sessions')
    .update({
      avg_latency_ms: newAvgLatency,
    })
    .eq('id', sessionId);
}

/**
 * Завершить сессию
 */
export async function completeCallSession(sessionId: string): Promise<void> {
  const supabase = createClient();

  const endedAt = new Date().toISOString();

  // Получить started_at для вычисления duration
  const { data: session } = await supabase
    .from('call_sessions')
    .select('started_at')
    .eq('id', sessionId)
    .single();

  if (!session) return;

  const startedAt = new Date(session.started_at);
  const duration = (new Date(endedAt).getTime() - startedAt.getTime()) / 1000;

  await supabase
    .from('call_sessions')
    .update({
      status: 'completed',
      ended_at: endedAt,
      duration_seconds: duration,
    })
    .eq('id', sessionId);
}

/**
 * Получить все транскрипты сессии
 */
export async function getSessionTranscripts(
  sessionId: string,
): Promise<CallTranscript[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('call_transcripts')
    .select('*')
    .eq('session_id', sessionId)
    .order('segment_index');

  if (error) {
    console.error('Failed to get session transcripts:', error);
    return [];
  }

  return data as CallTranscript[];
}

/**
 * Получить сессию с транскриптами
 */
export async function getSessionWithTranscripts(sessionId: string) {
  const supabase = createClient();

  const { data: session, error: sessionError } = await supabase
    .from('call_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessionError) {
    console.error('Failed to get session:', sessionError);
    return null;
  }

  const transcripts = await getSessionTranscripts(sessionId);

  return {
    session: session as CallSession,
    transcripts,
  };
}

/**
 * Создать compliance alert
 */
export async function createComplianceAlert(
  sessionId: string,
  transcriptId: string,
  ruleCode: string,
  category: string,
  severity: string,
  matchedText: string,
  contextText: string,
  audioStart?: number,
  audioEnd?: number,
): Promise<ComplianceAlert | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('compliance_alerts')
    .insert({
      session_id: sessionId,
      transcript_id: transcriptId,
      rule_code: ruleCode,
      category,
      severity,
      matched_text: matchedText,
      context_text: contextText,
      audio_start: audioStart,
      audio_end: audioEnd,
      status: 'new',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create compliance alert:', error);
    return null;
  }

  // Обновить has_alert в transcript
  await supabase
    .from('call_transcripts')
    .update({ has_alert: true })
    .eq('id', transcriptId);

  // Обновить total_alerts в session
  const { data: session } = await supabase
    .from('call_sessions')
    .select('total_alerts, max_severity')
    .eq('id', sessionId)
    .single();

  if (session) {
    const newMaxSeverity = getMaxSeverity(session.max_severity, severity);

    await supabase
      .from('call_sessions')
      .update({
        total_alerts: session.total_alerts + 1,
        max_severity: newMaxSeverity,
      })
      .eq('id', sessionId);
  }

  return data as ComplianceAlert;
}

/**
 * Получить максимальную severity
 */
function getMaxSeverity(current: string | null, newSeverity: string): string {
  if (!current) return newSeverity;

  const severityOrder = ['info', 'warning', 'critical'];
  const currentIndex = severityOrder.indexOf(current);
  const newIndex = severityOrder.indexOf(newSeverity);

  return newIndex > currentIndex ? newSeverity : current;
}

/**
 * Получить все сессии текущего пользователя
 */
export async function getAllUserSessions(): Promise<CallSession[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('call_sessions')
    .select('*')
    .order('started_at', { ascending: false });

  if (error) {
    console.error('Failed to get user sessions:', error);
    return [];
  }

  return data as CallSession[];
}

/**
 * Загрузить аудиофайл в Supabase Storage
 */
export async function uploadAudioFile(
  sessionId: string,
  audioBlob: Blob,
): Promise<string | null> {
  const supabase = createClient();

  try {
    // Получить user_id
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Failed to get user:', userError);
      return null;
    }

    // Создать путь файла: {user_id}/{session_id}.webm
    const fileName = `${user.id}/${sessionId}.webm`;

    // Загрузить в Storage
    const { data, error } = await supabase.storage
      .from('recordings')
      .upload(fileName, audioBlob, {
        contentType: audioBlob.type || 'audio/webm',
        upsert: false, // не перезаписывать если существует
      });

    if (error) {
      console.error('Failed to upload audio:', error);
      return null;
    }

    // Получить публичный URL
    const { data: urlData } = supabase.storage
      .from('recordings')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;
    console.log('✅ Audio uploaded:', publicUrl);

    // Обновить session с audio_url
    await supabase
      .from('call_sessions')
      .update({ audio_url: publicUrl })
      .eq('id', sessionId);

    return publicUrl;
  } catch (err) {
    console.error('Error uploading audio:', err);
    return null;
  }
}
