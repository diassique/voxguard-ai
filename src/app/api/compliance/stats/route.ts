import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch stats from the view
    const { data: stats, error: statsError } = await supabase
      .from('v_rules_stats')
      .select('*')
      .single();

    if (statsError) {
      console.error('Error fetching compliance stats:', statsError);
      return NextResponse.json({ error: statsError.message }, { status: 500 });
    }

    // Fetch rules by category
    const { data: byCategory, error: categoryError } = await supabase
      .from('v_rules_by_category')
      .select('*');

    if (categoryError) {
      console.error('Error fetching rules by category:', categoryError);
      return NextResponse.json(
        { error: categoryError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      stats,
      by_category: byCategory,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
