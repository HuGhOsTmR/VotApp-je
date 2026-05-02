// Public API: Attendance for Institution
// Returns attendance records for sessions

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { resolveInstitutionFromSlug, createPublicResponse, createErrorResponse, arrayToCsv } from '@/lib/public-api-utils';
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
    const sessionId = searchParams.get('session_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    const format = (searchParams.get('format') as 'json' | 'csv') || 'json';

    // Get sessions for the date range first
    let sessionsQuery = supabase
      .from('sessions')
      .select('id, session_date')
      .eq('institution_id', institutionConfig.institutionId);

    if (fromDate) {
      sessionsQuery = sessionsQuery.gte('session_date', fromDate);
    }
    if (toDate) {
      sessionsQuery = sessionsQuery.lte('session_date', toDate);
    }

    const { data: sessionsData } = await sessionsQuery;

    if (!sessionsData || sessionsData.length === 0) {
      return NextResponse.json(
        createPublicResponse([], { institution })
      );
    }

    const sessionIds = sessionsData.map(s => s.id);

    // Build attendance query
    let query = supabase
      .from('attendance')
      .select('*, parliamentarians(id, full_name, political_party, circumscription)')
      .in('session_id', sessionIds);

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // Apply limit/offset
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('[public-api] Error fetching attendance:', error);
      return NextResponse.json(
        createErrorResponse('Failed to fetch attendance'),
        { status: 500 }
      );
    }

    // Create session map for easy lookup
    const sessionMap = new Map(sessionsData.map(s => [s.id, s.session_date]));

    // Transform for public API
    const publicData = (data || []).map(record => ({
      session_id: record.session_id,
      session_date: sessionMap.get(record.session_id),
      parliamentarian: {
        id: record.parliamentarians?.id,
        full_name: record.parliamentarians?.full_name,
        political_party: record.parliamentarians?.political_party,
        circumscription: record.parliamentarians?.circumscription,
      },
      status: record.status,
      created_at: record.created_at,
    }));

// CSV export mode
    if (format === 'csv') {
      const csvData = (publicData as Record<string, unknown>[]).map(r => ({
        session_date: r.session_date,
        parliamentarian_name: (r.parliamentarian as { full_name?: string })?.full_name || '',
        parliamentarian_party: (r.parliamentarian as { political_party?: string })?.political_party || '',
        status: r.status,
      }));
      const csv = arrayToCsv(csvData, [
        'session_date',
        'parliamentarian_name',
        'parliamentarian_party',
        'status',
      ]);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="attendance-${institution}.csv"`,
        },
      });
    }

    // Get summary stats
    const summary = {
      total_records: publicData.length,
      present: publicData.filter(r => r.status === 'present').length,
      absent: publicData.filter(r => r.status === 'absent').length,
      excused: publicData.filter(r => r.status === 'excused').length,
    };

    return NextResponse.json({
      success: true,
      data: publicData,
      summary,
      institution: institution,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[public-api] Attendance GET error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
