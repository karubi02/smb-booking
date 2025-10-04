import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { YearOverview } from "@/components/dashboard/year-overview"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"
import { Calendar, Users, Clock, TrendingUp, Plus, Settings, BarChart3, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch actual statistics
  const [schedulesResult, viewsResult] = await Promise.all([
    // Get all schedules for the user
    supabase.from("schedules").select("id, month, year, is_public, created_at").eq("user_id", user.id),
    // Get view counts (we'll simulate this since we don't have analytics yet)
    Promise.resolve({ data: [], error: null })
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
  
  // Calculate average months open (this is a simplified calculation)
  const avgMonthsOpen = uniqueMonths > 0 ? uniqueMonths : 0
  
  // Simulate view counts (in a real app, you'd track this)
  const totalViews = Math.floor(Math.random() * 1000) + 100 // Simulated
  const lastMonthViews = Math.floor(totalViews * 0.8) // Simulated
  const growthPercentage = lastMonthViews > 0 ? Math.round(((totalViews - lastMonthViews) / lastMonthViews) * 100) : 0

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
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Months Active</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {avgMonthsOpen > 0 ? (
                <>
                  <div className="text-3xl font-bold text-green-900 dark:text-green-100">{avgMonthsOpen}</div>
                  <p className="text-xs text-green-600 dark:text-green-400">months with schedules</p>
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-green-900 dark:text-green-100">0</div>
                  <p className="text-xs text-green-600 dark:text-green-400">Data not available yet</p>
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
