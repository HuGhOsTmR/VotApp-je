// Public API: Institutions
// Returns list of public institutions with basic info

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get only public institutions
    const { data, error } = await supabase
      .from('institutions')
      .select(
        'id, name, slug, logo_url, primary_color, secondary_color, public_title, public_description, public_contact_email'
      )
      .eq('is_active', true)
      .eq('public_visibility', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('[public-api] Error fetching institutions:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch institutions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[public-api] Institutions GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
