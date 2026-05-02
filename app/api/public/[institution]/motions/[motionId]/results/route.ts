// Public API: Motion Results
// Returns detailed vote results for a specific motion

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { resolveInstitutionFromSlug, createPublicResponse, createErrorResponse, arrayToCsv, checkRateLimit, validateApiKey } from '@/lib/public-api-utils';
import { NextRequest, NextResponse } from 'next/server';
import { QUORUM_PERCENTAGE, QUORUM_REQUIRED } from '@/lib/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ institution: string; motionId: string }> }
) {
  try {
    const { institution: institutionSlug, motionId } = await params;
    const supabase = await createServerSupabaseClient();

    // Resolve institution
    const institutionConfig = await resolveInstitutionFromSlug(institutionSlug);
    if (!institutionConfig) {
      return NextResponse.json(
        createErrorResponse('Institution not found or public API disabled', 404),
        { status: 404 }
      );
    }

    // Check API key for rate limiting
    const authHeader = request.headers.get('authorization');
    const apiKeyInfo = await validateApiKey(authHeader);
    const rateLimitInfo = await checkRateLimit(apiKeyInfo);

    // Get motion details
    const { data: motionData, error: motionError } = await supabase
      .from('motions')
      .select('*, parliamentarians(id, full_name, political_party)')
      .eq('id', motionId)
      .eq('institution_id', institutionConfig.institutionId)
      .single();

    if (motionError || !motionData) {
      return NextResponse.json(
        createErrorResponse('Motion not found', 404),
        { status: 404 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const includeVotes = searchParams.get('votes') === 'true';
    const format = (searchParams.get('format') as 'json' | 'csv') || 'json';

    // Get total parliamentarians for quorum calculation
    const { count: totalParliamentarians } = await supabase
      .from('parliamentarians')
      .select('id', { count: 'exact', head: true })
      .eq('institution_id', institutionConfig.institutionId)
      .eq('is_active', true);

    const totalActiveParliamentarians = totalParliamentarians || 0;
    const quorumThreshold = Math.ceil(totalActiveParliamentarians * QUORUM_PERCENTAGE);

    // Get votes
    const { data: votesData, error: votesError } = await supabase
      .from('votes')
      .select('*, parliamentarians(id, full_name, political_party)')
      .eq('motion_id', motionId)
      .order('timestamp', { ascending: false });

    if (votesError) {
      console.error('[public-api] Error fetching votes:', votesError);
      return NextResponse.json(
        createErrorResponse('Failed to fetch votes'),
        { status: 500 }
      );
    }

    // Calculate results
    const presentVotes = (votesData || []).filter(v => v.vote_type !== 'absent').length;
    const results = {
      favor_count: (votesData || []).filter(v => v.vote_type === 'favor').length,
      against_count: (votesData || []).filter(v => v.vote_type === 'against').length,
      abstention_count: (votesData || []).filter(v => v.vote_type === 'abstention').length,
      absent_count: (votesData || []).filter(v => v.vote_type === 'absent').length,
      total_votes: (votesData || []).length,
      quorum_met: presentVotes >= Math.max(quorumThreshold, QUORUM_REQUIRED),
      quorum_threshold: Math.max(quorumThreshold, QUORUM_REQUIRED),
      total_parliamentarians: totalActiveParliamentarians,
    };

    // Build response
    const response: Record<string, unknown> = {
      motion: {
        id: motionData.id,
        title: motionData.title,
        description: motionData.description,
        motion_type: motionData.motion_type,
        status: motionData.status,
        voting_start_time: motionData.voting_start_time,
        voting_end_time: motionData.voting_end_time,
        created_at: motionData.created_at,
        proposer: {
          id: motionData.parliamentarians?.id,
          full_name: motionData.parliamentarians?.full_name,
          political_party: motionData.parliamentarians?.political_party,
        },
      },
      results,
      institution: institutionSlug,
      timestamp: new Date().toISOString(),
    };

    // Include individual votes if requested
    if (includeVotes && votesData) {
      response.votes = votesData.map(vote => ({
        id: vote.id,
        parliamentarian_id: vote.parliamentarian_id,
        parliamentarian: {
          id: vote.parliamentarians?.id,
          full_name: vote.parliamentarians?.full_name,
          political_party: vote.parliamentarians?.political_party,
        },
        vote_type: vote.vote_type,
        timestamp: vote.timestamp,
      }));
    }

    // CSV export mode
    if (format === 'csv' && includeVotes && votesData) {
      const csvData = votesData.map(vote => ({
        motion_id: motionId,
        motion_title: motionData.title,
        parliamentarian_name: vote.parliamentarians?.full_name,
        political_party: vote.parliamentarians?.political_party,
        vote_type: vote.vote_type,
        timestamp: vote.timestamp,
      }));

      const csv = arrayToCsv(csvData, [
        'motion_id',
        'motion_title',
        'parliamentarian_name',
        'political_party',
        'vote_type',
        'timestamp',
      ]);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="votes-${motionId}.csv"`,
        },
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('[public-api] Motion results GET error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
