import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../lib/newsletter';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createSupabaseAdminClient();

    // Validate token and get user
    // supabase.auth.getUser accepts an access token
    // @ts-ignore
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = userData.user.id;

    const [{ data: signups }, { data: resources }, { data: posts }] = await Promise.all([
      supabase.from('event_signups').select('event_id').eq('user_id', userId),
      supabase.from('resources').select('id, title, status, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
      supabase.from('navilink_posts').select('id, title, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
    ]);

    let signedUpEvents: any[] = [];
    if (Array.isArray(signups) && signups.length > 0) {
      const ids = signups.map((s: any) => s.event_id).filter(Boolean);
      if (ids.length > 0) {
        const { data: events } = await supabase.from('events').select('id, title, description, event_date, start_time, end_time, location_name, address, is_virtual, category, status').in('id', ids).order('event_date', { ascending: true });
        signedUpEvents = events ?? [];
      }
    }

    return NextResponse.json({
      signedUpEvents,
      resourceSubmissions: resources ?? [],
      posts: posts ?? [],
    });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
