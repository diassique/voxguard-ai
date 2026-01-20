import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    // Fetch recent sessions
    // Note: user_id filtering temporarily disabled until column is added to DB
    const { data: sessions, error: sessionsError } = await supabase
      .from('call_sessions')
      .select('id, started_at, duration_seconds, total_alerts, status, max_severity')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json({ error: sessionsError.message }, { status: 500 });
    }

    const recordings = sessions?.map(session => {
      const duration = session.duration_seconds || 0;
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      const durationFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      const startedAt = new Date(session.started_at);
      const now = new Date();
      const isToday = startedAt.toDateString() === now.toDateString();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const isYesterday = startedAt.toDateString() === yesterday.toDateString();

      let dateFormatted;
      if (isToday) {
        dateFormatted = `Today, ${startedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
      } else if (isYesterday) {
        dateFormatted = `Yesterday, ${startedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
      } else {
        dateFormatted = startedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
      }

      let status = 'Compliant';
      if (session.total_alerts > 0) {
        if (session.max_severity === 'critical') {
          status = 'Critical Issue';
        } else if (session.max_severity === 'high') {
          status = 'High Priority';
        } else {
          status = 'Issue Detected';
        }
      } else if (session.status === 'processing') {
        status = 'Processing';
      } else if (session.status === 'recording') {
        status = 'Recording';
      }

      return {
        id: session.id,
        name: `Recording ${session.id.slice(0, 8)}`,
        duration: durationFormatted,
        date: dateFormatted,
        status,
        alertCount: session.total_alerts,
        severity: session.max_severity,
      };
    }) || [];

    return NextResponse.json({ recordings });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
