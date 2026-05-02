// Public API: Motion Export
// Bulk export endpoint for motions

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { resolveInstitutionFromSlug, createPublicResponse, createErrorResponse } from '@/lib/public-api-utils';
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
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    const motionType = searchParams.get('motion_type');
    const includeProposer = searchParams.get('proposer') !== 'false';
    const includeResults = searchParams.get('results') === 'true';
    const format = (searchParams.get('format') as 'json' | 'csv') || 'json';
    const limit = parseInt(searchParams.get('limit') || '500', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build query
    let query = supabase
      .from('motions')
      .select('*, parliamentarians(id, full_name, political_party)')
      .eq('institution_id', institutionConfig.institutionId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (fromDate) {
      query = query.gte('created_at', fromDate);
    }
    if (toDate) {
      query = query.lte('created_at', toDate);
    }
    if (motionType) {
      query = query.eq('motion_type', motionType);
    }

    // Apply limit/offset
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('[public-api] Error exporting motions:', error);
      return NextResponse.json(
        createErrorResponse('Failed to export motions'),
        { status: 500 }
      );
    }

    // Get vote counts if results requested
    let motionData = data || [];
    
    if (includeResults && motionData.length > 0) {
      const motionIds = motionData.map(m => m.id);
      
      const { data: voteCounts } = await supabase
        .from('votes')
        .select('motion_id, vote_type')
        .in('motion_id', motionIds);

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

      motionData = motionData.map(motion => {
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
          ...(includeProposer && {
            proposer: {
              id: motion.parliamentarians?.id,
              full_name: motion.parliamentarians?.full_name,
              political_party: motion.parliamentarians?.political_party,
            },
          }),
          ...(includeResults && results && {
            favor_count: results.favor,
            against_count: results.against,
            abstention_count: results.abstention,
            absent_count: results.absent,
            total_votes: results.total,
          }),
        };
      });
    } else {
      motionData = motionData.map(motion => ({
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
        ...(includeProposer && {
          proposer: {
            id: motion.parliamentarians?.id,
            full_name: motion.parliamentarians?.full_name,
            political_party: motion.parliamentarians?.political_party,
          },
        }),
      }));
    }

    // CSV export mode
    if (format === 'csv') {
      const headers = [
        'id', 'session_id', 'title', 'description', 'motion_type', 'status',
        'voting_start_time', 'voting_end_time', 'created_at'
      ];
      if (includeProposer) headers.push('proposer_name', 'proposer_party');
      if (includeResults) headers.push('favor', 'against', 'abstention', 'absent', 'total');
      
      const rows = motionData.map((m: Record<string, unknown>) => [
        m.id,
        m.session_id,
        m.title,
        m.description,
        m.motion_type,
        m.status,
        m.voting_start_time,
        m.voting_end_time,
        m.created_at,
        ...(includeProposer ? [
          (m.proposer as { full_name?: string })?.full_name || '',
          (m.proposer as { political_party?: string })?.political_party || '',
        ] : []),
        ...(includeResults ? [
          m.favor_count,
          m.against_count,
          m.abstention_count,
          m.absent_count,
          m.total_votes,
        ] : []),
      ]);

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="motions-${institution}-export.csv"`,
        },
      });
    }

    return NextResponse.json(
      createPublicResponse(motionData, { institution })
    );
  } catch (error) {
    console.error('[public-api] Motion export GET error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
