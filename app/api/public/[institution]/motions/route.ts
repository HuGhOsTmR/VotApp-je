// Public API: Motions for Institution
// Returns public motion data for a specific institution

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
    const status = searchParams.get('status');
    const sessionId = searchParams.get('session_id');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    const format = (searchParams.get('format') as 'json' | 'csv') || 'json';
    const includeResults = searchParams.get('results') === 'true';

    // Build query - only show open/closed motions (not pending)
    let query = supabase
      .from('motions')
      .select('*, parliamentarians(id, full_name, political_party, photo_url)')
      .eq('institution_id', institutionConfig.institutionId)
      .in('status', ['open', 'closed', 'approved', 'rejected'])
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }
    if (fromDate) {
      query = query.gte('created_at', fromDate);
    }
    if (toDate) {
      query = query.lte('created_at', toDate);
    }

    // Apply limit/offset
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('[public-api] Error fetching motions:', error);
      return NextResponse.json(
        createErrorResponse('Failed to fetch motions'),
        { status: 500 }
      );
    }

    // If include results, fetch vote counts for each motion
    let motionData = data || [];
    
    if (includeResults && motionData.length > 0) {
      const motionIds = motionData.map(m => m.id);
      
      // Get vote counts per motion
      const { data: voteCounts } = await supabase
        .from('votes')
        .select('motion_id, vote_type')
        .in('motion_id', motionIds);

      // Aggregate results
      const resultsMap = new Map<string, { favor: number; against: number; abstention: number; absent: number; total: number }>();
      
      for (const vote of voteCounts || []) {
        if (!resultsMap.has(vote.motion_id)) {
          resultsMap.set(vote.motion_id, { favor: 0, against: 0, abstention: 0, absent: 0, total: 0 });
        }
        const counts = resultsMap.get(vote.motion_id)!;
        counts.total++;
        if (vote.vote_type === 'favor') counts.favor++;
        else if (vote.vote_type === 'against') counts.against++;
        else if (vote.vote_type === 'abstention') counts.abstention++;
        else if (vote.vote_type === 'absent') counts.absent++;
      }

      // Transform for public API
      const publicData = motionData.map((motion) => {
        const results = resultsMap.get(motion.id);
        return {
          id: motion.id,
          session_id: motion.session_id,
          title: motion.title,
          description: motion.description,
          motion_type: motion.motion_type,
          status: motion.status,
          voting_start_time: motion.voting_start_time,
          voting_end_time: motion.voting_end_time,
          minimum_votes_required: motion.minimum_votes_required,
          created_at: motion.created_at,
          updated_at: motion.updated_at,
          proposer: {
            id: motion.parliamentarians?.id,
            full_name: motion.parliamentarians?.full_name,
            political_party: motion.parliamentarians?.political_party,
          },
          ...(includeResults && results && {
            results: {
              favor_count: results.favor,
              against_count: results.against,
              abstention_count: results.abstention,
              absent_count: results.absent,
              total_votes: results.total,
            }
          }),
        };
      });

      return NextResponse.json(
        createPublicResponse(publicData, { institution: institution })
      );
    }

    // Transform for public API without results
    const publicData = motionData.map((motion) => ({
      id: motion.id,
      session_id: motion.session_id,
      title: motion.title,
      description: motion.description,
      motion_type: motion.motion_type,
      status: motion.status,
      voting_start_time: motion.voting_start_time,
      voting_end_time: motion.voting_end_time,
      minimum_votes_required: motion.minimum_votes_required,
      created_at: motion.created_at,
      updated_at: motion.updated_at,
      proposer: {
        id: motion.parliamentarians?.id,
        full_name: motion.parliamentarians?.full_name,
        political_party: motion.parliamentarians?.political_party,
      },
    }));

    // CSV export mode
    if (format === 'csv') {
      const csv = arrayToCsv(publicData, [
        'id',
        'title',
        'motion_type',
        'status',
        'voting_start_time',
        'voting_end_time',
        'created_at',
      ]);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="motions-${institution}.csv"`,
        },
      });
    }

    return NextResponse.json(
      createPublicResponse(publicData, { institution: institution })
    );
  } catch (error) {
    console.error('[public-api] Motions GET error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
