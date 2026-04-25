import { getSupabaseAdmin } from './supabaseAdmin.js';
import type { ApiRequest } from './request.js';

/**
 * Simple IP-based rate limiter backed by Supabase.
 * Requires the `rate_limits` table — see migrations/rate_limits.sql.
 *
 * Returns true if the request should be blocked, false if it's allowed.
 * Fails open (returns false) if the DB call errors, so a DB outage never
 * locks users out of auth.
 */
export async function isRateLimited(
  req: ApiRequest,
  endpoint: string,
  opts: { maxRequests?: number; windowMinutes?: number } = {},
): Promise<boolean> {
  const { maxRequests = 10, windowMinutes = 15 } = opts;

  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
    (req.headers['x-real-ip'] as string | undefined) ??
    'unknown';

  try {
    const supabase = getSupabaseAdmin();
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

    // Count recent requests from this IP to this endpoint
    const { count, error: countError } = await supabase
      .from('rate_limits')
      .select('id', { count: 'exact', head: true })
      .eq('ip', ip)
      .eq('endpoint', endpoint)
      .gte('created_at', windowStart);

    if (countError) return false; // fail open

    if ((count ?? 0) >= maxRequests) return true;

    // Record this request
    await supabase.from('rate_limits').insert({ ip, endpoint });
    return false;
  } catch {
    return false; // fail open
  }
}
