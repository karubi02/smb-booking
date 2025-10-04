import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import Image from "next/image"
import { PublicScheduleNavigation } from "@/components/schedule/public-schedule-navigation"

interface Break {
  id: string
  start: string
  end: string
}

interface DaySchedule {
  open: string
  close: string
  closed: boolean
  breaks: Break[]
}

interface MonthlySchedule {
  [date: string]: DaySchedule
}

const monthNames = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
]

const dayNames = ["日", "月", "火", "水", "木", "金", "土"] // Sunday through Saturday in Japanese kanji
const dayNamesEnglish = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const defaultDaySchedule: DaySchedule = {
  open: "09:00",
  close: "17:00",
  closed: false,
  breaks: [],
}

function formatTime(time: string): string {
  if (!time || !time.includes(":")) return "Invalid time"

  try {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  } catch (error) {
    return "Invalid time"
  }
}

// Migration function to handle old data structure
function migrateScheduleData(rawSchedule: any): MonthlySchedule {
  const migratedSchedule: MonthlySchedule = {}
  
  for (const [dateStr, dayData] of Object.entries(rawSchedule)) {
    const daySchedule = dayData as any
    
    // Check if this is old format (has hasBreak, breakStart, breakEnd)
    if (daySchedule.hasBreak !== undefined) {
      const breaks: any[] = []
      
      // Convert old break data to new format
      if (daySchedule.hasBreak && daySchedule.breakStart && daySchedule.breakEnd) {
        breaks.push({
          id: `migrated-${Date.now()}`,
          start: daySchedule.breakStart,
          end: daySchedule.breakEnd
        })
      }
      
      migratedSchedule[dateStr] = {
        open: daySchedule.open || "09:00",
        close: daySchedule.close || "17:00",
        closed: daySchedule.closed || false,
        breaks: breaks
      }
    } else {
      // Already new format or no break data
      migratedSchedule[dateStr] = {
        open: daySchedule.open || "09:00",
        close: daySchedule.close || "17:00",
        closed: daySchedule.closed || false,
        breaks: daySchedule.breaks || []
      }
    }
  }
  
  return migratedSchedule
}

// Helper function to calculate effective opening hours accounting for breaks
function calculateEffectiveHours(daySchedule: any) {
  if (daySchedule.closed) {
    return { periods: [], totalHours: 0 }
  }

  const breaks = daySchedule.breaks || []
  const periods = []
  let currentStart = daySchedule.open

  // Sort breaks by start time
  const sortedBreaks = breaks.sort((a: any, b: any) => a.start.localeCompare(b.start))

  for (const breakItem of sortedBreaks) {
    // Add period before this break (if there's time between current start and break start)
    if (currentStart < breakItem.start) {
      periods.push({
        start: currentStart,
        end: breakItem.start
      })
    }
    // Move current start to after this break
    currentStart = breakItem.end
  }

  // Add final period from last break end to close time (if there's time)
  if (currentStart < daySchedule.close) {
    periods.push({
      start: currentStart,
      end: daySchedule.close
    })
  }

  // If no breaks, return single period
  if (breaks.length === 0) {
    return {
      periods: [{
        start: daySchedule.open,
        end: daySchedule.close
      }],
      totalHours: 8 // Default 8 hours
    }
  }

  // Calculate total hours
  const totalMinutes = periods.reduce((total, period) => {
    const [startHour, startMin] = period.start.split(':').map(Number)
    const [endHour, endMin] = period.end.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    return total + (endMinutes - startMinutes)
  }, 0)

  return {
    periods,
    totalHours: totalMinutes / 60
  }
}

export default async function PublicSchedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  try {
    const currentDate = new Date()
    const resolvedParams = await params
    const resolvedSearchParams = await searchParams
    
    const targetMonth = resolvedSearchParams.month ? Number.parseInt(resolvedSearchParams.month) : currentDate.getMonth() + 1
    const targetYear = resolvedSearchParams.year ? Number.parseInt(resolvedSearchParams.year) : currentDate.getFullYear()

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      },
    )

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, display_name, business_name, logo_url, banner_url")
          .eq("public_slug", resolvedParams.slug)
          .single()

    console.log("[v0] Profile data fetched:", profile)

    if (profileError || !profile) {
      console.log("[v0] Profile error:", profileError)
      notFound()
    }

    const { data: schedule, error } = await supabase
      .from("schedules")
      .select("schedule_data, month, year, user_id")
      .eq("user_id", profile.id)
      .eq("is_public", true)
      .eq("month", targetMonth)
      .eq("year", targetYear)
      .single()

    if (error || !schedule) {
      notFound()
    }

    const prevMonth = targetMonth === 1 ? 12 : targetMonth - 1
    const prevYear = targetMonth === 1 ? targetYear - 1 : targetYear
    const nextMonth = targetMonth === 12 ? 1 : targetMonth + 1
    const nextYear = targetMonth === 12 ? targetYear + 1 : targetYear

    const { data: prevSchedule } = await supabase
      .from("schedules")
      .select("id")
      .eq("user_id", profile.id)
      .eq("is_public", true)
      .eq("month", prevMonth)
      .eq("year", prevYear)
      .maybeSingle()

    const { data: nextSchedule } = await supabase
      .from("schedules")
      .select("id")
      .eq("user_id", profile.id)
      .eq("is_public", true)
      .eq("month", nextMonth)
      .eq("year", nextYear)
      .maybeSingle()

    const businessName = profile.business_name || profile.display_name || "Business"
    console.log("[v0] Business name being used:", businessName)

    const rawScheduleData = schedule.schedule_data as MonthlySchedule

    if (!rawScheduleData || typeof rawScheduleData !== "object") {
      notFound()
    }

    // Migrate old data structure to new breaks format
    const scheduleData = migrateScheduleData(rawScheduleData)

    const year = schedule.year
    const month = schedule.month - 1 // JavaScript months are 0-indexed

    if (!year || !schedule.month || year < 2020 || year > 2030 || schedule.month < 1 || schedule.month > 12) {
      notFound()
    }

    const firstDayOfMonth = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const weeks = []
    let currentWeek = []

    for (let i = 0; i < firstDayOfMonth; i++) {
      currentWeek.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const dayOfWeek = new Date(year, month, day).getDay()

      currentWeek.push({
        day,
        dateStr,
        dayOfWeek,
        dayName: dayNames[dayOfWeek],
        dayNameEnglish: dayNamesEnglish[dayOfWeek],
        schedule: scheduleData[dateStr] || defaultDaySchedule,
      })

      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null)
      }
      weeks.push(currentWeek)
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Banner Section */}
          <div className="relative mb-[26px]">
            {/* Banner Background */}
            {profile.banner_url ? (
              <div 
                className="absolute inset-x-0 top-0 h-[200px] rounded-lg bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${profile.banner_url})` }}
              ></div>
            ) : (
              <div className="absolute inset-x-0 top-0 h-[200px] bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg"></div>
            )}
            
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-x-0 top-0 h-[200px] bg-black/20 rounded-lg"></div>
            
            {/* Content over Banner */}
            <div className="relative z-10 h-[200px] flex flex-col items-center justify-center text-center">
              {/* Business Logo */}
              <div className="flex justify-center mb-4">
                {profile.logo_url ? (
                  <div className="w-[75px] h-[75px] rounded-full border-2 border-white shadow-lg overflow-hidden">
                    <Image 
                      src={profile.logo_url} 
                      alt={`${businessName} logo`}
                      width={75}
                      height={75}
                      className="w-full h-full object-cover"
                      priority
                    />
                  </div>
                ) : (
                  <div className="w-[75px] h-[75px] rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">{businessName}</h1>
              <p className="text-white/90 drop-shadow">
                {monthNames[month]} {year} スケジュール
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="grid grid-cols-7 bg-teal-600">
              {dayNames.map((dayName, index) => (
                <div key={index} className="p-4 text-center">
                  <div className="text-white font-semibold text-lg">{dayName}</div>
                  <div className="text-teal-100 text-sm mt-1">{dayNamesEnglish[index]}</div>
                </div>
              ))}
            </div>

            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 border-b border-gray-200 last:border-b-0">
                {week.map((day, dayIndex) => {
                  if (!day) {
                    return <div key={dayIndex} className="h-32 border-r border-gray-200 last:border-r-0" />
                  }

                  const daySchedule = day.schedule
                  const isToday = new Date().toDateString() === new Date(day.dateStr).toDateString()

                  return (
                    <div
                      key={day.dateStr}
                      className={`h-32 border-r border-gray-200 last:border-r-0 p-2 flex flex-col ${
                        daySchedule.closed 
                          ? "bg-red-100 dark:bg-red-700" 
                          : "bg-green-50 dark:bg-green-950/50"
                      } ${isToday ? "border-b-4 border-b-green-600" : ""}`}
                    >
                      <div className="text-right mb-2">
                        <span className={`text-lg font-semibold ${
                          daySchedule.closed 
                            ? "text-black dark:text-white" 
                            : isToday 
                              ? "text-blue-600" 
                              : "text-gray-700"
                        }`}>
                          {String(day.day).padStart(2, "0")}
                        </span>
                      </div>

                      {daySchedule.closed ? (
                        <div className="flex-1 flex items-start justify-center pt-1">
                          <div className="text-black dark:text-white text-sm">休業</div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-end justify-start text-xs space-y-1 pt-1">
                          {(() => {
                            const effectiveHours = calculateEffectiveHours(daySchedule)
                            if (effectiveHours.periods.length === 1) {
                              // Single period - show simple format
                              const period = effectiveHours.periods[0]
                              return (
                                <div className="text-gray-700 font-medium">
                                  {formatTime(period.start)} - {formatTime(period.end)}
                                </div>
                              )
                            } else if (effectiveHours.periods.length > 1) {
                              // Multiple periods - show each period
                              return (
                                <div className="space-y-0.5">
                                  {effectiveHours.periods.map((period, index) => (
                                    <div key={index} className="text-gray-700 font-medium">
                                      {formatTime(period.start)} - {formatTime(period.end)}
                                    </div>
                                  ))}
                                </div>
                              )
                            } else {
                              // Fallback - should not happen with updated logic
                              return (
                                <div className="text-gray-700 font-medium">
                                  {formatTime(daySchedule.open)} - {formatTime(daySchedule.close)}
                                </div>
                              )
                            }
                          })()}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Navigation and Last Updated Row */}
          <div className="mt-6">
            <PublicScheduleNavigation
              slug={resolvedParams.slug}
              currentMonth={targetMonth}
              currentYear={targetYear}
              hasPrevious={!!prevSchedule}
              hasNext={!!nextSchedule}
              prevMonth={prevMonth}
              prevYear={prevYear}
              nextMonth={nextMonth}
              nextYear={nextYear}
            >
              <p className="text-sm text-gray-500">スケジュール最終更新: {new Date().toLocaleDateString()}</p>
            </PublicScheduleNavigation>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Public schedule page error:", error)
    notFound()
  }
}
