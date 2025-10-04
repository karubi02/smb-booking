import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { YearOverview } from "@/components/dashboard/year-overview"
import { PublicViewButton } from "@/components/dashboard/public-view-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"
import { Calendar, Users, Clock, TrendingUp, Plus, Settings, BarChart3, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { calculateAverageHours, calculateTrend } from "@/lib/schedule-utils"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { data: profile } = await supabase.from("profiles").select("display_name, business_name, phone, public_slug, logo_url, banner_url").eq("id", user.id).single()

  // Fetch actual statistics
  const [schedulesResult, viewsResult] = await Promise.all([
    // Get all schedules for the user
    supabase.from("schedules").select("id, month, year, is_public, created_at, total_hours").eq("user_id", user.id),
    // Get view counts using the database function
    supabase.rpc('get_user_view_counts', { user_uuid: user.id })
  ])

  const schedules = schedulesResult.data || []
  const views = viewsResult.data || []

  // Calculate statistics
  const totalSchedules = schedules.length
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const schedulesThisMonth = schedules.filter(s => s.month === currentMonth && s.year === currentYear).length
  
  // Calculate months with schedules (unique month/year combinations)
  const uniqueMonths = new Set(schedules.map(s => `${s.year}-${s.month}`)).size
  
  // Calculate average hours per month
  const averageHours = calculateAverageHours(schedules)
  
  // Calculate trend (compare last 3 months vs previous 3 months)
  const currentDate = new Date()
  const threeMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1)
  const sixMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 5, 1)
  
  const recentSchedules = schedules.filter(s => {
    const scheduleDate = new Date(s.year, s.month - 1, 1)
    return scheduleDate >= threeMonthsAgo && scheduleDate <= currentDate
  })
  
  const previousSchedules = schedules.filter(s => {
    const scheduleDate = new Date(s.year, s.month - 1, 1)
    return scheduleDate >= sixMonthsAgo && scheduleDate < threeMonthsAgo
  })
  
  const recentAverage = calculateAverageHours(recentSchedules)
  const previousAverage = calculateAverageHours(previousSchedules)
  const trend = calculateTrend(recentAverage, previousAverage)
  
  // Get real view counts from database
  const viewCounts = views?.[0] || { total_views: 0, last_month_views: 0, this_month_views: 0 }
  const totalViews = Number(viewCounts.total_views) || 0
  const lastMonthViews = Number(viewCounts.last_month_views) || 0
  const thisMonthViews = Number(viewCounts.this_month_views) || 0
  const growthPercentage = lastMonthViews > 0 ? Math.round(((thisMonthViews - lastMonthViews) / lastMonthViews) * 100) : 0

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              Welcome back{profile?.display_name ? `, ${profile.display_name.split(' ')[0]}` : ''}!
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 mt-2">
              Here's what's happening with your schedule today
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/schedule">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                New Schedule
              </Button>
            </Link>
            <PublicViewButton slug={profile?.public_slug} />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Schedules</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {totalSchedules > 0 ? (
                <>
                  <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{totalSchedules}</div>
                  <p className="text-xs text-blue-600 dark:text-blue-400">{schedulesThisMonth} this month</p>
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">0</div>
                  <p className="text-xs text-blue-600 dark:text-blue-400">No schedules yet</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Avg Hours/Month</CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {averageHours > 0 ? (
                <>
                  <div className="text-3xl font-bold text-green-900 dark:text-green-100">{averageHours.toFixed(1)}h</div>
                  <div className="flex items-center gap-1 mt-1">
                    {trend.direction === 'up' ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : trend.direction === 'down' ? (
                      <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
                    ) : null}
                    <p className={`text-xs ${trend.direction === 'up' ? 'text-green-600' : trend.direction === 'down' ? 'text-red-600' : 'text-green-600'}`}>
                      {trend.direction === 'up' ? `+${trend.percentage}%` : trend.direction === 'down' ? `-${trend.percentage}%` : '0%'} vs last 3 months
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-green-900 dark:text-green-100">0h</div>
                  <p className="text-xs text-green-600 dark:text-green-400">No data available yet</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Views</CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{totalViews.toLocaleString()}</div>
              <p className="text-xs text-purple-600 dark:text-purple-400">All time views</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Growth</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              {growthPercentage !== 0 ? (
                <>
                  <div className={`text-3xl font-bold ${growthPercentage >= 0 ? 'text-orange-900 dark:text-orange-100' : 'text-red-900 dark:text-red-100'}`}>
                    {growthPercentage >= 0 ? '+' : ''}{growthPercentage}%
                  </div>
                  <p className="text-xs text-orange-600 dark:text-orange-400">vs last month</p>
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">0%</div>
                  <p className="text-xs text-orange-600 dark:text-orange-400">Data not available yet</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Year Overview */}
        <YearOverview schedules={schedules} />

        {/* Recent Activity */}
        <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your latest schedule updates and changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {schedules.length > 0 ? (
                schedules
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 3)
                  .map((schedule, index) => {
                    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                    const monthName = monthNames[schedule.month - 1]
                    const timeAgo = new Date(schedule.created_at)
                    const now = new Date()
                    const diffTime = Math.abs(now.getTime() - timeAgo.getTime())
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    const timeText = diffDays === 1 ? "1 day ago" : diffDays < 7 ? `${diffDays} days ago` : timeAgo.toLocaleDateString()
                    
                    return (
                      <div key={schedule.id} className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                        <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-green-500' : index === 1 ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Schedule created for {monthName} {schedule.year}
                            {schedule.is_public && " (Public)"}
                          </p>
                          <p className="text-xs text-slate-500">{timeText}</p>
                        </div>
                      </div>
                    )
                  })
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-sm">No schedules created yet</p>
                  <p className="text-xs mt-1">Create your first schedule to see activity here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
