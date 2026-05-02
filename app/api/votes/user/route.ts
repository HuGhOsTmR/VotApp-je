import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Get the parliamentarian linked to the current authenticated user.
 * Used by frontend to derive the voting identity.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the parliamentarian linked to this user
    const { data, error } = await supabase.rpc(
      'get_current_user_parliamentarian'
    );

    if (error) {
      console.error('[v0] Error getting user parliamentarian:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Check if there's a linked parliamentarian
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return NextResponse.json(
        {
          success: false,
          error: 'no_linked_parliamentarian',
          message: 'No tiene un parlamentario vinculado',
        },
        { status: 404 }
      );
    }

    // Return the parliamentarian data (first result if array)
    const parliamentarian = Array.isArray(data) ? data[0] : data;

    return NextResponse.json({
      success: true,
      data: parliamentarian,
    });
  } catch (error) {
    console.error('[v0] User parliamentarian GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
