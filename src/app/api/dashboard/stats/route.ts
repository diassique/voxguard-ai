import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all sessions
    // Note: user_id filtering temporarily disabled until column is added to DB
    const { data: sessions, error: sessionsError } = await supabase
      .from('call_sessions')
      .select('id, status, duration_seconds, total_alerts, created_at')
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json({ error: sessionsError.message }, { status: 500 });
    }

    const sessionIds = sessions?.map(s => s.id) || [];

    let totalAlerts = 0;
    let criticalAlerts = 0;
    let highAlerts = 0;
    let mediumAlerts = 0;

    if (sessionIds.length > 0) {
      const { data: alerts, error: alertsError } = await supabase
        .from('compliance_alerts')
        .select('severity, created_at')
        .in('session_id', sessionIds);

      if (!alertsError && alerts) {
        totalAlerts = alerts.length;
        criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
        highAlerts = alerts.filter(a => a.severity === 'high').length;
        mediumAlerts = alerts.filter(a => a.severity === 'medium').length;
      }
    }

    const totalRecordings = sessions?.length || 0;
    const completedSessions = sessions?.filter(s => s.status === 'completed') || [];
    const sessionsWithAlerts = sessions?.filter(s => s.total_alerts > 0).length || 0;
    const compliantSessions = totalRecordings - sessionsWithAlerts;
    const complianceRate = totalRecordings > 0
      ? ((compliantSessions / totalRecordings) * 100).toFixed(1)
      : '0.0';

    const totalDuration = completedSessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
    const avgDuration = completedSessions.length > 0
      ? totalDuration / completedSessions.length
      : 0;

    const minutes = Math.floor(avgDuration / 60);
    const seconds = Math.floor(avgDuration % 60);
    const avgDurationFormatted = `${minutes}m ${seconds}s`;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recentSessions = sessions?.filter(s =>
      new Date(s.created_at) >= sevenDaysAgo
    ).length || 0;

    const previousSessions = sessions?.filter(s => {
      const date = new Date(s.created_at);
      return date >= fourteenDaysAgo && date < sevenDaysAgo;
    }).length || 0;

    const recordingsTrend = previousSessions > 0
      ? (((recentSessions - previousSessions) / previousSessions) * 100).toFixed(1)
      : '0.0';

    const recentIssues = sessions?.filter(s =>
      new Date(s.created_at) >= sevenDaysAgo && s.total_alerts > 0
    ).length || 0;

    const previousIssues = sessions?.filter(s => {
      const date = new Date(s.created_at);
      return date >= fourteenDaysAgo && date < sevenDaysAgo && s.total_alerts > 0;
    }).length || 0;

    const issuesTrend = previousIssues > 0
      ? (((recentIssues - previousIssues) / previousIssues) * 100).toFixed(1)
      : '0.0';

    return NextResponse.json({
      totalRecordings,
      complianceRate: parseFloat(complianceRate),
      totalAlerts,
      avgDuration: avgDurationFormatted,
      trends: {
        recordings: {
          value: recordingsTrend,
          positive: parseFloat(recordingsTrend) >= 0,
        },
        compliance: {
          value: complianceRate,
          positive: parseFloat(complianceRate) >= 90,
        },
        issues: {
          value: issuesTrend,
          positive: parseFloat(issuesTrend) <= 0,
        },
      },
      alerts: {
        total: totalAlerts,
        critical: criticalAlerts,
        high: highAlerts,
        medium: mediumAlerts,
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
