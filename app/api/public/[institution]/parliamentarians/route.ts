// Public API: Parliamentarians for Institution
// Returns public parliamentarian profiles

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
    const party = searchParams.get('party');
    const includeStats = searchParams.get('stats') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const format = (searchParams.get('format') as 'json' | 'csv') || 'json';

    // Build query
    let query = supabase
      .from('parliamentarians')
      .select('*')
      .eq('institution_id', institutionConfig.institutionId)
      .eq('is_active', true);

    // Apply filters
    if (party) {
      query = query.eq('political_party', party);
    }

    // Apply limit/offset
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('[public-api] Error fetching parliamentarians:', error);
      return NextResponse.json(
        createErrorResponse('Failed to fetch parliamentarians'),
        { status: 500 }
      );
    }

    // Get list of unique parties for filter
    const { data: partiesData } = await supabase
      .from('parliamentarians')
      .select('political_party')
      .eq('institution_id', institutionConfig.institutionId)
      .eq('is_active', true);

    const parties = [...new Set((partiesData || []).map(p => p.political_party))].sort();

    // If include stats, fetch voting statistics
    let parliamentarianData = data || [];
    
    if (includeStats && parliamentarianData.length > 0) {
      const parliamentarianIds = parliamentarianData.map(p => p.id);
      
      // Get vote counts per parliamentarian
      const { data: voteCounts } = await supabase
        .from('votes')
        .select('parliamentarian_id, vote_type')
        .in('parliamentarian_id', parliamentarianIds);

      // Aggregate by parliamentarian
      const statsMap = new Map<string, { favor: number; against: number; abstention: number; total: number }>();
      
      for (const vote of voteCounts || []) {
        if (!statsMap.has(vote.parliamentarian_id)) {
          statsMap.set(vote.parliamentarian_id, { favor: 0, against: 0, abstention: 0, total: 0 });
        }
        const stats = statsMap.get(vote.parliamentarian_id)!;
        stats.total++;
        if (vote.vote_type === 'favor') stats.favor++;
        else if (vote.vote_type === 'against') stats.against++;
        else if (vote.vote_type === 'abstention') stats.abstention++;
      }

      // Transform with stats
      const publicData = parliamentarianData.map(p => {
        const stats = statsMap.get(p.id);
        return {
          id: p.id,
          full_name: p.full_name,
          political_party: p.political_party,
          circumscription: p.circumscription,
          photo_url: p.photo_url,
          is_active: p.is_active,
          ...(includeStats && stats && {
            voting_stats: {
              total_votes: stats.total,
              favor_count: stats.favor,
              against_count: stats.against,
              abstention_count: stats.abstention,
              participation_rate: stats.total > 0 ? (stats.total / stats.total * 100).toFixed(1) : '0',
            }
          }),
        };
      });

      return NextResponse.json({
        success: true,
        data: publicData,
        meta: {
          parties,
          count: publicData.length,
          institution: institution,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Transform for public API without stats
    const publicData = parliamentarianData.map(p => ({
      id: p.id,
      full_name: p.full_name,
      political_party: p.political_party,
      circumscription: p.circumscription,
      photo_url: p.photo_url,
      is_active: p.is_active,
    }));

    // CSV export mode
    if (format === 'csv') {
      const csv = arrayToCsv(publicData, [
        'id',
        'full_name',
        'political_party',
        'circumscription',
      ]);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="parliamentarians-${institution}.csv"`,
        },
      });
    }

    return NextResponse.json(
      createPublicResponse(publicData, { institution })
    );
  } catch (error) {
    console.error('[public-api] Parliamentarians GET error:', error);
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
