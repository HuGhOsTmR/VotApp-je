// Public API: Sessions for Institution
// Returns public session data for a specific institution

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { resolveInstitutionFromSlug, createPublicResponse, createErrorResponse, arrayToCsv, parseExportParams } from '@/lib/public-api-utils';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ institution: string }> }
) {
  try {
    const { institution } = await params;
    const supabase = await createServerSupabaseClient();

    // Resolve institution
    const institutionConfig = await resolveInstitutionFromSlug(institution);
    if (!institutionConfig) {
      return NextResponse.json(
        createErrorResponse('Institution not found or public API disabled', 404),
        { status: 404 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    const format = (searchParams.get('format') as 'json' | 'csv') || 'json';

    // Build query
    let query = supabase
      .from('sessions')
      .select('*, motions(id, title, status, motion_type)')
      .eq('institution_id', institutionConfig.institutionId)
      .order('session_date', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (fromDate) {
      query = query.gte('session_date', fromDate);
    }
    if (toDate) {
      query = query.lte('session_date', toDate);
    }

    // Apply limit/offset
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('[public-api] Error fetching sessions:', error);
      return NextResponse.json(
        createErrorResponse('Failed to fetch sessions'),
        { status: 500 }
      );
    }

    // Transform for public API (remove internal fields)
    const publicData = (data || []).map((session) => ({
      id: session.id,
      legislature_number: session.legislature_number,
      session_date: session.session_date,
      start_time: session.start_time,
      end_time: session.end_time,
      status: session.status,
      title: session.title,
      description: session.description,
      quorum_required: session.quorum_required,
      motions_count: session.motions?.length || 0,
      created_at: session.created_at,
    }));

    // CSV export mode
    if (format === 'csv') {
      const csv = arrayToCsv(publicData, [
        'id',
        'legislature_number',
        'session_date',
        'status',
        'title',
        'motions_count',
      ]);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="sessions-${institution}.csv"`,
        },
      });
    }

    return NextResponse.json(
      createPublicResponse(publicData, { institution })
    );
  } catch (error) {
    console.error('[public-api] Sessions GET error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
