import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: stats } = await supabase
      .from('v_rules_stats')
      .select('*')
      .single();

    const { data: rules } = await supabase
      .from('compliance_rules')
      .select('*')
      .order('risk_score', { ascending: false });

    const { data: byCategory } = await supabase
      .from('v_rules_by_category')
      .select('*');

    return NextResponse.json({
      stats,
      rules: rules || [],
      byCategory: byCategory || [],
    });
  } catch (error) {
    console.error('Error fetching compliance data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance data' },
      { status: 500 }
    );
  }
}
