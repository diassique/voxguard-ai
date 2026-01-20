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

    const { data: sessions, error: sessionsError } = await supabase
      .from('call_sessions')
      .select('id')
      .eq('user_id', user.id);

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json({ error: sessionsError.message }, { status: 500 });
    }

    const sessionIds = sessions?.map(s => s.id) || [];

    if (sessionIds.length === 0) {
      return NextResponse.json({
        alerts: [],
        bySeverity: [],
        byCategory: [],
        timeline: [],
      });
    }

    const { data: alerts, error: alertsError } = await supabase
      .from('compliance_alerts')
      .select('severity, category, created_at, status')
      .in('session_id', sessionIds)
      .order('created_at', { ascending: false });

    if (alertsError) {
      console.error('Error fetching alerts:', alertsError);
      return NextResponse.json({ error: alertsError.message }, { status: 500 });
    }

    const bySeverity = [
      {
        name: 'Critical',
        value: alerts?.filter(a => a.severity === 'critical').length || 0,
        color: '#dc2626',
      },
      {
        name: 'High',
        value: alerts?.filter(a => a.severity === 'high').length || 0,
        color: '#ea580c',
      },
      {
        name: 'Medium',
        value: alerts?.filter(a => a.severity === 'medium').length || 0,
        color: '#f59e0b',
      },
      {
        name: 'Low',
        value: alerts?.filter(a => a.severity === 'info').length || 0,
        color: '#3b82f6',
      },
    ].filter(item => item.value > 0);

    const categoryMap = new Map<string, number>();
    alerts?.forEach(alert => {
      const count = categoryMap.get(alert.category) || 0;
      categoryMap.set(alert.category, count + 1);
    });

    const byCategory = Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const timelineMap = new Map<string, number>();
    alerts?.forEach(alert => {
      const date = new Date(alert.created_at);
      if (date >= thirtyDaysAgo) {
        const dateKey = date.toISOString().split('T')[0];
        const count = timelineMap.get(dateKey) || 0;
        timelineMap.set(dateKey, count + 1);
      }
    });

    const timeline = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      timeline.push({
        date: dateKey,
        count: timelineMap.get(dateKey) || 0,
      });
    }

    return NextResponse.json({
      alerts: alerts || [],
      bySeverity,
      byCategory,
      timeline,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
