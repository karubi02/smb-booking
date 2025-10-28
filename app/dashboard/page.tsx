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
  const now = new Date()
  const startOfTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const diffToMonday = (now.getUTCDay() + 6) % 7
  const startOfThisWeek = new Date(startOfTodayUTC)
  startOfThisWeek.setUTCDate(startOfThisWeek.getUTCDate() - diffToMonday)
  const startOfNextWeek = new Date(startOfThisWeek)
  startOfNextWeek.setUTCDate(startOfNextWeek.getUTCDate() + 7)
  const startOfLastWeek = new Date(startOfThisWeek)
  startOfLastWeek.setUTCDate(startOfLastWeek.getUTCDate() - 7)

  const [schedulesResult, viewsResult, thisWeekViewsResult, lastWeekViewsResult] = await Promise.all([
    // Get all schedules for the user
    supabase.from("schedules").select("id, month, year, is_public, created_at, updated_at, total_hours").eq("user_id", user.id),
    // Get view counts using the database function
    supabase.rpc('get_user_view_counts', { user_uuid: user.id }),
    supabase
      .from("schedule_views")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("viewed_at", startOfThisWeek.toISOString())
      .lt("viewed_at", startOfNextWeek.toISOString()),
    supabase
      .from("schedule_views")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("viewed_at", startOfLastWeek.toISOString())
      .lt("viewed_at", startOfThisWeek.toISOString()),
  ])

  const schedules = schedulesResult.data || []
  const views = viewsResult.data || []
  if (thisWeekViewsResult.error) {
    console.error("Failed to fetch this week's views:", thisWeekViewsResult.error)
  }
  if (lastWeekViewsResult.error) {
    console.error("Failed to fetch last week's views:", lastWeekViewsResult.error)
  }
  const thisWeekViews = thisWeekViewsResult.count ?? 0
  const lastWeekViews = lastWeekViewsResult.count ?? 0

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
  const growthPercentage = Math.round(((thisWeekViews - lastWeekViews) / Math.max(lastWeekViews, 1)) * 100)

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              ようこそ{profile?.display_name ? `、${profile.display_name.split(' ')[0]}さん` : ""}！
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 mt-2">
              今日のスケジュール状況を確認しましょう。
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/schedule">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                新しいスケジュール
              </Button>
            </Link>
            <PublicViewButton slug={profile?.public_slug} />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">スケジュール総数</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {totalSchedules > 0 ? (
                <>
                  <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{totalSchedules}</div>
                  <p className="text-xs text-blue-600 dark:text-blue-400">今月 {schedulesThisMonth} 件</p>
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">0</div>
                  <p className="text-xs text-blue-600 dark:text-blue-400">まだスケジュールがありません</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">月平均営業時間</CardTitle>
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
                      {trend.direction === 'up' ? `直近3か月比 +${trend.percentage}%` : trend.direction === 'down' ? `直近3か月比 -${trend.percentage}%` : '直近3か月比 ±0%'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-green-900 dark:text-green-100">0h</div>
                  <p className="text-xs text-green-600 dark:text-green-400">データはまだありません</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">閲覧数</CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{totalViews.toLocaleString()}</div>
              <p className="text-xs text-purple-600 dark:text-purple-400">累計閲覧数</p>
              <p className="text-xs text-purple-500 dark:text-purple-300 mt-1">
                今月: <span className="font-semibold">{thisMonthViews.toLocaleString()}</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">成長率（週次）</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${growthPercentage >= 0 ? 'text-orange-900 dark:text-orange-100' : 'text-red-900 dark:text-red-100'}`}>
                {growthPercentage >= 0 ? '+' : ''}{growthPercentage}%
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400">先週比での閲覧数変化</p>
              <p className="text-xs text-orange-500 dark:text-orange-300 mt-1">
                今週: <span className="font-semibold">{thisWeekViews.toLocaleString()}</span> ／ 先週: <span className="font-semibold">{lastWeekViews.toLocaleString()}</span>
              </p>
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
              最近のアクティビティ
            </CardTitle>
            <CardDescription>最新のスケジュール更新情報</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {schedules.length > 0 ? (
                schedules
                  .sort(
                    (a, b) =>
                      new Date(b.updated_at ?? b.created_at).getTime() -
                      new Date(a.updated_at ?? a.created_at).getTime(),
                  )
                  .slice(0, 3)
                  .map((schedule, index) => {
                    const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]
                    const monthName = monthNames[schedule.month - 1]
                    const activityTimestamp = new Date(schedule.updated_at ?? schedule.created_at)
                    const now = new Date()
                    const diffTime = Math.abs(now.getTime() - activityTimestamp.getTime())
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    const actionType =
                      schedule.updated_at && schedule.updated_at !== schedule.created_at ? "更新" : "作成"
                    const timeText =
                      diffDays === 1
                        ? `${actionType}：1日前`
                        : diffDays < 7
                          ? `${actionType}：${diffDays}日前`
                          : `${actionType}：${activityTimestamp.toLocaleDateString("ja-JP")}`
                    
                    return (
                      <div key={schedule.id} className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                        <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-green-500' : index === 1 ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {schedule.year}年{monthName}のスケジュールを{actionType}しました
                            {schedule.is_public && "（公開）"}
                          </p>
                          <p className="text-xs text-slate-500">{timeText}</p>
                        </div>
                      </div>
                    )
                  })
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-sm">まだスケジュールが作成されていません</p>
                  <p className="text-xs mt-1">最初のスケジュールを作成するとここに表示されます</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
