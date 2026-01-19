import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const severity = searchParams.get('severity');
    const jurisdiction = searchParams.get('jurisdiction');
    const active = searchParams.get('active');

    const supabase = await createClient();

    let query = supabase
      .from('compliance_rules')
      .select('*')
      .order('risk_score', { ascending: false });

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    if (severity) {
      query = query.eq('severity', severity);
    }
    if (jurisdiction) {
      query = query.eq('jurisdiction', jurisdiction);
    }
    if (active === 'true') {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching compliance rules:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rules: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
