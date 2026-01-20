/**
 * Supabase Recording Utils
 * Функции для сохранения real-time записей в БД
 */

import { supabase } from '@/lib/supabase';
import type { ComplianceRule } from '@/types/compliance.types';

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
  words?: Array<{ text: string; start: number; end: number; type: string; speaker_id?: string; logprob?: number }>;
  word_count?: number;
  char_count?: number;
  speaker_id?: string;
  speaker_role?: string;
  entities?: Array<{ type: string; text: string; start: number; end: number }>;
  sentiment?: string;
  sentiment_confidence?: number;
  language_code?: string;
  language_confidence?: number;
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
  // Use singleton client to avoid duplicate requests

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
  words?: Array<{ text: string; start: number; end: number; type: string; speaker_id?: string; logprob?: number }>,
  metadata?: {
    sentiment?: string;
    sentiment_confidence?: number;
    language_code?: string;
    language_confidence?: number;
    speaker_id?: string;
  }
): Promise<CallTranscript | null> {
  // Use singleton client to avoid duplicate requests

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
      sentiment: metadata?.sentiment,
      sentiment_confidence: metadata?.sentiment_confidence,
      language_code: metadata?.language_code,
      language_confidence: metadata?.language_confidence,
      speaker_id: metadata?.speaker_id,
      has_alert: false,
      source: 'realtime',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to save transcript segment:', error);
    return null;
  }



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
  // Use singleton client to avoid duplicate requests

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
  // Use singleton client to avoid duplicate requests

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
  // Use singleton client to avoid duplicate requests

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
  // Use singleton client to avoid duplicate requests

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
  // Use singleton to avoid creating multiple clients
  // Get session and transcripts in parallel
  const [sessionResult, transcriptsResult, userResult] = await Promise.all([
    supabase
      .from('call_sessions')
      .select('*')
      .eq('id', sessionId)
      .single(),
    supabase
      .from('call_transcripts')
      .select('*')
      .eq('session_id', sessionId)
      .order('segment_index'),
    supabase.auth.getUser(),
  ]);

  const { data: session, error: sessionError } = sessionResult;
  const { data: transcripts = [], error: transcriptsError } = transcriptsResult;
  const { data: { user } } = userResult;

  if (sessionError) {
    console.error('Failed to get session:', sessionError);
    return null;
  }

  if (transcriptsError) {
    console.error('Failed to get transcripts:', transcriptsError);
  }

  // Generate signed URL if needed
  let audioUrl = session.audio_url;
  if (audioUrl && user) {
    const fileName = `${user.id}/${sessionId}.webm`;
    const { data: signedData } = await supabase.storage
      .from('recordings')
      .createSignedUrl(fileName, 3600); // 1 hour

    if (signedData?.signedUrl) {
      audioUrl = signedData.signedUrl.startsWith('/')
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1${signedData.signedUrl}`
        : signedData.signedUrl;
    }
  }

  return {
    session: { ...session, audio_url: audioUrl } as CallSession,
    transcripts: transcripts as CallTranscript[],
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
  // Use singleton client to avoid duplicate requests

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
  // Use singleton client to avoid duplicate requests

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
  // Use singleton client to avoid duplicate requests

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
    const { error } = await supabase.storage
      .from('recordings')
      .upload(fileName, audioBlob, {
        contentType: audioBlob.type || 'audio/webm',
        upsert: false, // не перезаписывать если существует
      });

    if (error) {
      console.error('Failed to upload audio:', error);
      return null;
    }

    // Получить signed URL (работает для приватных bucket'ов)
    // URL действителен 1 год (31536000 секунд)
    const { data: signedData, error: signedError } = await supabase.storage
      .from('recordings')
      .createSignedUrl(fileName, 31536000);

    if (signedError || !signedData?.signedUrl) {
      console.error('Failed to create signed URL:', signedError);
      // Fallback к публичному URL
      const { data: urlData } = supabase.storage
        .from('recordings')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;


      await supabase
        .from('call_sessions')
        .update({ audio_url: publicUrl })
        .eq('id', sessionId);

      return publicUrl;
    }



    // Обновить session с audio_url
    await supabase
      .from('call_sessions')
      .update({ audio_url: signedData.signedUrl })
      .eq('id', sessionId);

    return signedData.signedUrl;
  } catch (err) {
    console.error('Error uploading audio:', err);
    return null;
  }
}

/**
 * Check text against compliance rules from database
 */
export async function checkTextCompliance(
  text: string,
  rules?: ComplianceRule[]
): Promise<{
  violations: Array<{
    rule: ComplianceRule;
    matchedPattern: string;
    matchedText: string;
    confidence: number;
  }>;
  riskScore: number;
}> {
  // Use provided rules or fetch from database
  let complianceRules = rules;

  if (!complianceRules) {
    const { data: fetchedRules, error } = await supabase
      .from('compliance_rules')
      .select('*')
      .eq('is_active', true);

    if (error || !fetchedRules || fetchedRules.length === 0) {
      return { violations: [], riskScore: 0 };
    }

    complianceRules = fetchedRules as ComplianceRule[];
  }

  const violations: Array<{
    rule: ComplianceRule;
    matchedPattern: string;
    matchedText: string;
    confidence: number;
  }> = [];

  const lowerText = text.toLowerCase();

  for (const rule of complianceRules) {
    // Check text length
    if (lowerText.length < rule.min_text_length) continue;

    // Check patterns
    for (const pattern of rule.patterns) {
      try {
        const regex = new RegExp(pattern, 'gi');
        const matches = lowerText.match(regex);

        if (matches && matches.length > 0) {
          // Check exclude patterns
          let excluded = false;
          if (rule.exclude_patterns) {
            for (const excludePattern of rule.exclude_patterns) {
              const excludeRegex = new RegExp(excludePattern, 'gi');
              if (excludeRegex.test(lowerText)) {
                excluded = true;
                break;
              }
            }
          }

          if (!excluded) {
            violations.push({
              rule: rule as ComplianceRule,
              matchedPattern: pattern,
              matchedText: matches[0],
              confidence: rule.confidence_threshold,
            });
            break; // Only one violation per rule per segment
          }
        }
      } catch (error) {
        console.error(`Error processing pattern ${pattern}:`, error);
      }
    }
  }

  // Calculate total risk score
  const riskScore = violations.reduce((sum, v) => sum + v.rule.risk_score, 0);

  return { violations, riskScore };
}

/**
 * Save compliance alerts for a transcript segment (real-time)
 */
export async function saveRealtimeComplianceAlerts(
  sessionId: string,
  transcriptId: string,
  text: string,
  startTime: number,
  endTime: number,
  violations: Array<{
    rule: ComplianceRule;
    matchedPattern: string;
    matchedText: string;
    confidence: number;
  }>,
  speakerId?: string
): Promise<{ alertIds: string[]; criticalCount: number; highCount: number }> {
  const alertIds: string[] = [];
  let criticalCount = 0;
  let highCount = 0;

  // Get context text (surrounding text, if we had it)
  const contextText = text;

  for (const violation of violations) {
    const { rule, matchedText, matchedPattern } = violation;

    // Create compliance alert
    const { data, error } = await supabase
      .from('compliance_alerts')
      .insert({
        session_id: sessionId,
        transcript_id: transcriptId,
        rule_code: rule.rule_code,
        category: rule.category,
        severity: rule.severity,
        matched_text: matchedText,
        matched_pattern: matchedPattern,
        context_text: contextText,
        audio_start: startTime,
        audio_end: endTime,
        speaker_id: speakerId,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save compliance alert:', error);
      continue;
    }

    if (data) {
      alertIds.push(data.id);

      // Count by severity
      if (rule.severity === 'critical') criticalCount++;
      if (rule.severity === 'high') highCount++;
    }
  }

  // Update transcript with alert info
  if (alertIds.length > 0) {
    await supabase
      .from('call_transcripts')
      .update({
        has_alert: true,
        alert_ids: alertIds,
      })
      .eq('id', transcriptId);
  }

  return { alertIds, criticalCount, highCount };
}

/**
 * Load compliance rules (for caching in components)
 */
export async function loadComplianceRules(): Promise<ComplianceRule[]> {
  const { data, error } = await supabase
    .from('compliance_rules')
    .select('*')
    .eq('is_active', true);

  if (error || !data) {
    console.error('Failed to load compliance rules:', error);
    return [];
  }

  return data as ComplianceRule[];
}

/**
 * Process batch transcription and save to database
 * This replaces the real-time segments with accurate batch-processed segments
 */
export async function processBatchTranscription(
  sessionId: string,
  audioUrl: string,
): Promise<{ success: boolean; alerts?: number; criticalAlerts?: number; highAlerts?: number }> {
  try {


    // Call batch transcription API
    const response = await fetch('/api/transcribe-batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ audioUrl }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Batch transcription API error:', errorData);
      return { success: false };
    }

    const result = await response.json();


    // 🛡️ VALIDATION: Check if transcription has any content
    if (!result.words || result.words.length === 0) {
      console.error('❌ Batch transcription returned no words');
      return { success: false };
    }

    // Calculate duration from last word
    const lastWord = result.words[result.words.length - 1];
    const calculatedDuration = lastWord?.end || 0;

    // Validate duration
    const MIN_DURATION = 0.5; // 500ms minimum
    if (calculatedDuration < MIN_DURATION) {
      console.error(`❌ Audio too short: ${calculatedDuration}s (minimum: ${MIN_DURATION}s)`);
      return { success: false };
    }



    // Delete old real-time segments
    // Use singleton client to avoid duplicate requests
    const { error: deleteError } = await supabase
      .from('call_transcripts')
      .delete()
      .eq('session_id', sessionId);

    if (deleteError) {
      console.error('Failed to delete old segments:', deleteError);
      return { success: false };
    }



    // Initialize tracking variables
    let totalAlerts = 0;
    let totalRiskScore = 0;
    let criticalCount = 0;
    let highCount = 0;

    // ElevenLabs batch API returns a flat array of words with speaker_id
    // We need to group them into segments by speaker changes
    if (result.words && result.words.length > 0) {
      const segments: any[] = [];
      let currentSegment: any = null;

      for (const word of result.words) {
        const speaker = word.speaker_id || 'SPEAKER_00';

        // Start new segment if speaker changed or first word
        if (!currentSegment || currentSegment.speaker_id !== speaker) {
          if (currentSegment) {
            segments.push(currentSegment);
          }

          currentSegment = {
            speaker_id: speaker,
            words: [word],
            start_time: word.start,
            end_time: word.end,
          };
        } else {
          // Add word to current segment
          currentSegment.words.push(word);
          currentSegment.end_time = word.end;
        }
      }

      // Push last segment
      if (currentSegment) {
        segments.push(currentSegment);
      }



      // Fetch compliance rules once for all segments
      const { data: complianceRules, error: rulesError } = await supabase
        .from('compliance_rules')
        .select('*')
        .eq('is_active', true);

      if (rulesError) {
        console.error('Failed to fetch compliance rules:', rulesError);
      }

      const rules = (complianceRules || []) as ComplianceRule[];


      // Convert to database format and check compliance
      const segmentsWithViolations = await Promise.all(segments.map(async (segment: any, index: number) => {
        const text = segment.words.map((w: any) => w.text).join('');
        const trimmedText = text.trim();

        // Check compliance for this segment (pass rules to avoid re-fetching)
        const { violations } = await checkTextCompliance(trimmedText, rules);
        const hasAlert = violations.length > 0;

        // Extract sentiment and language metadata from words if available
        const firstWord = segment.words[0];
        const sentiment = firstWord?.sentiment || segment.sentiment;
        const sentiment_confidence = firstWord?.sentiment_confidence || segment.sentiment_confidence;
        const language_code = firstWord?.language || segment.language;
        const language_confidence = firstWord?.language_confidence || segment.language_confidence;

        return {
          session_id: sessionId,
          segment_index: index,
          text: trimmedText,
          start_time: segment.start_time,
          end_time: segment.end_time,
          speaker_id: segment.speaker_id,
          words: segment.words,
          word_count: segment.words.length,
          char_count: text.length,
          sentiment,
          sentiment_confidence,
          language_code,
          language_confidence,
          has_alert: hasAlert,
          source: 'batch',
          violations: violations.length > 0 ? violations : undefined, // Temporary field for processing
        };
      }));

      // Separate violations from segments before inserting to DB
      const newSegments = segmentsWithViolations.map((item) => {
        const segment = { ...item };
        delete segment.violations;
        return segment;
      });

      const { data: insertedTranscripts, error: insertError } = await supabase
        .from('call_transcripts')
        .insert(newSegments)
        .select('id, segment_index');

      if (insertError) {
        console.error('Failed to insert batch segments:', insertError);
        return { success: false };
      }



      // Create a map of segment_index -> transcript_id
      const transcriptIdMap = new Map<number, string>();
      insertedTranscripts?.forEach((t: any) => {
        transcriptIdMap.set(t.segment_index, t.id);
      });



      // Calculate total metrics from segments
      const totalWords = newSegments.reduce((sum, seg) => sum + seg.word_count, 0);
      const totalChars = newSegments.reduce((sum, seg) => sum + seg.char_count, 0);

      // Process compliance violations and create alerts
      const allViolations = segmentsWithViolations
        .filter(seg => seg.violations && seg.violations.length > 0)
        .flatMap(seg => (seg.violations ?? []).map((v: any) => ({ ...v, segment: seg })));

      if (allViolations.length > 0) {


        // Count by severity
        criticalCount = allViolations.filter((v: any) => v.rule.severity === 'critical').length;
        highCount = allViolations.filter((v: any) => v.rule.severity === 'high').length;

        // Create compliance alerts matching the actual DB schema
        const alerts = allViolations.map((violation: any) => {
          const transcriptId = transcriptIdMap.get(violation.segment.segment_index);

          if (!transcriptId) {

          }

          return {
            session_id: sessionId,
            transcript_id: transcriptId || null,
            rule_code: violation.rule.rule_code,
            category: violation.rule.category,
            severity: violation.rule.severity,
            matched_text: violation.matchedText,
            matched_pattern: violation.matchedPattern,
            context_text: violation.segment.text,
            audio_start: violation.segment.start_time,
            audio_end: violation.segment.end_time,
            speaker_id: violation.segment.speaker_id || null,
            entity_type: null,
            status: 'new',
          };
        });



        const { error: alertError } = await supabase
          .from('compliance_alerts')
          .insert(alerts);

        if (alertError) {
          console.error('Failed to create compliance alerts:', alertError);
        } else {
          totalAlerts = alerts.length;
          totalRiskScore = allViolations.reduce((sum: number, v: any) => sum + v.rule.risk_score, 0);
        }
      }

      // Use validated duration (already calculated above)
      const duration = calculatedDuration;

      // Update session with all metadata in ONE request
      const endedAt = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('call_sessions')
        .update({
          status: 'completed',
          ended_at: endedAt,
          duration_seconds: duration,
          batch_processed: true,
          total_segments: newSegments.length,
          total_words: totalWords,
          total_chars: totalChars,
          total_alerts: totalAlerts,
          risk_score: totalRiskScore,
        })
        .eq('id', sessionId);

      if (updateError) {
        console.error('Failed to update session:', updateError);
        return { success: false };
      }


    } else {

      return { success: false };
    }

    return {
      success: true,
      alerts: totalAlerts,
      criticalAlerts: criticalCount,
      highAlerts: highCount,
    };
  } catch (error) {
    console.error('Batch transcription processing error:', error);
    return { success: false };
  }
}
