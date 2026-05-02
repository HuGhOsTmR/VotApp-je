// Public API: Analytics for Institution
// Returns historical analytics summaries

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { resolveInstitutionFromSlug, createPublicResponse, createErrorResponse } from '@/lib/public-api-utils';
import { NextRequest, NextResponse } from 'next/server';
import { QUORUM_PERCENTAGE, QUORUM_REQUIRED } from '@/lib/constants';

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
    const period = searchParams.get('period') || 'all'; // all, year, month, week
    const fromYear = parseInt(searchParams.get('from_year') || '2020', 10);
    const toYear = parseInt(searchParams.get('to_year') || new Date().getFullYear().toString(), 10);

    // Get date range
    const fromDate = `${fromYear}-01-01`;
    const toDate = `${toYear}-12-31`;

    // Get sessions in date range
    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('id, session_date, status')
      .eq('institution_id', institutionConfig.institutionId)
      .gte('session_date', fromDate)
      .lte('session_date', toDate);

    if (!sessionsData || sessionsData.length === 0) {
      return NextResponse.json(
        createPublicResponse({
          overview: {
            total_sessions: 0,
            total_motions: 0,
            total_votes: 0,
          },
          sessions: [],
          motions_by_status: [],
          motions_by_type: [],
          party_performance: [],
        }, { institution })
      );
    }

    const sessionIds = sessionsData.map(s => s.id);

    // Get motions for sessions
    const { data: motionsData } = await supabase
      .from('motions')
      .select('id, session_id, motion_type, status, created_at')
      .in('session_id', sessionIds);

    // Get votes for sessions
    const { data: votesData } = await supabase
      .from('votes')
      .select('motion_id, vote_type, timestamp')
      .in('motion_id', motionsData?.map(m => m.id) || []);

    // Get parliamentarians
    const { data: parliamentariansData } = await supabase
      .from('parliamentarians')
      .select('id, political_party')
      .eq('institution_id', institutionConfig.institutionId)
      .eq('is_active', true);

    // ============ ANALYTICS CALCULATIONS ============

    // Overview stats
    const overview = {
      total_sessions: sessionsData.length,
      active_sessions: sessionsData.filter(s => s.status === 'active').length,
      closed_sessions: sessionsData.filter(s => s.status === 'closed').length,
      total_motions: motionsData?.length || 0,
      total_votes: votesData?.length || 0,
      total_parliamentarians: parliamentariansData?.length || 0,
    };

    // Sessions by year
    const sessionsByYear = new Map<string, number>();
    for (const session of sessionsData) {
      const year = session.session_date?.split('-')[0] || 'unknown';
      sessionsByYear.set(year, (sessionsByYear.get(year) || 0) + 1);
    }

    // Motions by status
    const motionsByStatus = new Map<string, number>();
    for (const motion of motionsData || []) {
      const status = motion.status || 'unknown';
      motionsByStatus.set(status, (motionsByStatus.get(status) || 0) + 1);
    }

    // Motions by type
    const motionsByType = new Map<string, number>();
    for (const motion of motionsData || []) {
      const type = motion.motion_type || 'unknown';
      motionsByType.set(type, (motionsByType.get(type) || 0) + 1);
    }

    // Approval rate (motions that passed)
    const approvedMotions = (motionsData || []).filter(m => 
      m.status === 'approved' || m.status === 'closed'
    ).length;
    const approvalRate = overview.total_motions > 0
      ? ((approvedMotions / overview.total_motions) * 100).toFixed(1)
      : '0';

    // Votes by party
    const partyVotes = new Map<string, { favor: number; against: number; abstention: number; total: number }>();
    
    // Need to join votes with parliamentarians - simplified calculation
    for (const vote of votesData || []) {
      // This is a simplified version - in production you'd do proper SQL join
      const party = 'Unknown'; // Would need to join with parliamentarians
      if (!partyVotes.has(party)) {
        partyVotes.set(party, { favor: 0, against: 0, abstention: 0, total: 0 });
      }
      const stats = partyVotes.get(party)!;
      stats.total++;
      if (vote.vote_type === 'favor') stats.favor++;
      else if (vote.vote_type === 'against') stats.against++;
      else if (vote.vote_type === 'abstention') stats.abstention++;
    }

    // Attendance rate (simplified)
    const attendanceStats = {
      average_present: 0, // Would need attendance table join
      average_absent: 0,
    };

    // Assemble response
    const analytics = {
      overview: {
        ...overview,
        approval_rate: parseFloat(approvalRate),
        participation_rate: '0', // Would calculate from attendance
      },
      sessions_by_year: Array.from(sessionsByYear.entries()).map(([year, count]) => ({
        year,
        count,
      })),
      motions_by_status: Array.from(motionsByStatus.entries()).map(([status, count]) => ({
        status,
        count,
      })),
      motions_by_type: Array.from(motionsByType.entries()).map(([type, count]) => ({
        type,
        count,
      })),
      party_performance: Array.from(partyVotes.entries()).map(([party, stats]) => ({
        party,
        ...stats,
        support_rate: stats.total > 0 
          ? ((stats.favor / stats.total) * 100).toFixed(1)
          : '0',
      })),
      period: {
        from_year: fromYear,
        to_year: toYear,
      },
    };

    return NextResponse.json(
      createPublicResponse(analytics, { institution })
    );
  } catch (error) {
    console.error('[public-api] Analytics GET error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
