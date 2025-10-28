import { createBrowserClient } from "@supabase/ssr"

interface ViewTrackingData {
  user_id: string
  public_slug: string
  ip_address?: string
  user_agent?: string
  referrer?: string
}

/**
 * Track a view for a public schedule
 */
export async function trackView(data: ViewTrackingData): Promise<void> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    await supabase.from("schedule_views").insert({
      user_id: data.user_id,
      public_slug: data.public_slug,
      ip_address: data.ip_address,
      user_agent: data.user_agent,
      referrer: data.referrer,
    })
  } catch (error) {
    // Silently fail - we don't want view tracking to break the user experience
    console.warn("Failed to track view:", error)
  }
}

/**
 * Get view counts for a user
 */
export async function getUserViewCounts(userId: string): Promise<{
  total_views: number
  last_month_views: number
  this_month_views: number
}> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    const { data, error } = await supabase.rpc('get_user_view_counts', {
      user_uuid: userId
    })

    if (error) {
      console.error("Error fetching view counts:", error)
      return { total_views: 0, last_month_views: 0, this_month_views: 0 }
    }

    return data?.[0] || { total_views: 0, last_month_views: 0, this_month_views: 0 }
  } catch (error) {
    console.error("Error fetching view counts:", error)
    return { total_views: 0, last_month_views: 0, this_month_views: 0 }
  }
}

/**
 * Track view on public schedule page
 */
export async function trackPublicScheduleView(
  userId: string, 
  publicSlug: string,
  request?: Request
): Promise<void> {
  // Only track on client side to avoid server-side issues
  if (typeof window === 'undefined') {
    return Promise.resolve()
  }

  // Get browser info
  const userAgent = navigator.userAgent
  const referrer = document.referrer || undefined

  // Get IP address if available (this is limited in browser context)
  let ipAddress: string | undefined
  if (request) {
    // This would need to be passed from server-side
    ipAddress = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                undefined
  }

  // Track the view
  return trackView({
    user_id: userId,
    public_slug: publicSlug,
    ip_address: ipAddress,
    user_agent: userAgent,
    referrer: referrer,
  })
}
