import React from "react"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import Image from "next/image"
import { PublicScheduleNavigation } from "@/components/schedule/public-schedule-navigation"
import { ViewTracker } from "@/components/schedule/view-tracker"

interface Break {
  start: string
  end: string
}

interface DaySchedule {
  open: string
  close: string
  closed: boolean
  breaks?: Break[]
}

interface MonthlySchedule {
  [dateStr: string]: DaySchedule
}

const dayNames = ["日", "月", "火", "水", "木", "金", "土"]
const dayNamesEnglish = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const defaultDaySchedule: DaySchedule = {
  open: "09:00",
  close: "17:00",
  closed: false,
  breaks: [],
}

function migrateScheduleData(scheduleData: MonthlySchedule): MonthlySchedule {
  const migrated: MonthlySchedule = {}
  
  Object.entries(scheduleData).forEach(([dateStr, daySchedule]) => {
    migrated[dateStr] = {
      ...daySchedule,
      breaks: daySchedule.breaks || []
    }
  })
  
  return migrated
}

function formatTime24(time?: string): string {
  if (!time || !time.includes(':')) return "--:--"
  const [hours, minutes] = time.split(':')
  if (!hours || !minutes) return time
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
}

function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function timeToMinutes(time?: string): number | null {
  if (!time || !time.includes(':')) return null
  const [hoursStr, minutesStr] = time.split(':')
  const hours = Number.parseInt(hoursStr, 10)
  const minutes = Number.parseInt(minutesStr, 10)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  return hours * 60 + minutes
}

function getOpenPeriods(daySchedule?: DaySchedule | null): Array<{ start: string; end: string }> {
  if (!daySchedule || daySchedule.closed) {
    return []
  }

  const openMinutes = timeToMinutes(daySchedule.open)
  const closeMinutes = timeToMinutes(daySchedule.close)
  if (openMinutes === null || closeMinutes === null || openMinutes >= closeMinutes) {
    return []
  }

  const breaks = (daySchedule.breaks || [])
    .map((breakPeriod) => {
      const startMinutes = timeToMinutes(breakPeriod.start)
      const endMinutes = timeToMinutes(breakPeriod.end)
      if (startMinutes === null || endMinutes === null || startMinutes >= endMinutes) {
        return null
      }
      return {
        startMinutes,
        endMinutes,
      }
    })
    .filter((value): value is { startMinutes: number; endMinutes: number } => value !== null)
    .sort((a, b) => a.startMinutes - b.startMinutes)

  const periods: Array<{ start: string; end: string }> = []
  let segmentStart = openMinutes

  for (const breakPeriod of breaks) {
    if (breakPeriod.startMinutes >= closeMinutes) {
      break
    }

    if (breakPeriod.startMinutes > segmentStart) {
      const segmentEnd = Math.min(breakPeriod.startMinutes, closeMinutes)
      if (segmentStart < segmentEnd) {
        periods.push({
          start: minutesToTime(segmentStart),
          end: minutesToTime(segmentEnd),
        })
      }
    }

    segmentStart = Math.max(segmentStart, breakPeriod.endMinutes)
    if (segmentStart >= closeMinutes) {
      break
    }
  }

  if (segmentStart < closeMinutes) {
    periods.push({
      start: minutesToTime(segmentStart),
      end: minutesToTime(closeMinutes),
    })
  }

  // If no valid periods were created (e.g., breaks cover entire day), fall back to single span
  if (periods.length === 0) {
    periods.push({ start: formatTime24(daySchedule.open), end: formatTime24(daySchedule.close) })
  }

  return periods
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

    if (!resolvedParams.slug || resolvedParams.slug.includes('.')) {
      notFound()
    }

    const targetMonth = resolvedSearchParams.month ? Number.parseInt(resolvedSearchParams.month) : currentDate.getMonth() + 1
    const targetYear = resolvedSearchParams.year ? Number.parseInt(resolvedSearchParams.year) : currentDate.getFullYear()
    
    // Validate parsed values
    if (isNaN(targetMonth) || isNaN(targetYear) || targetMonth < 1 || targetMonth > 12) {
      notFound()
    }

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
      .maybeSingle()

    if (profileError || !profile) {
      notFound()
    }

    const { data: schedule, error } = await supabase
      .from("schedules")
      .select("schedule_data, month, year, user_id, created_at")
      .eq("user_id", profile.id)
      .eq("is_public", true)
      .eq("month", targetMonth)
      .eq("year", targetYear)
      .maybeSingle()

    if (error) {
      console.error("Schedule query error:", error)
      throw error
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

    const scheduleExists = Boolean(schedule)
    if (!scheduleExists) {
      console.log("No public schedule found:", {
        profileId: profile.id,
        targetMonth,
        targetYear,
      })
    }

    const rawScheduleData = (schedule?.schedule_data as MonthlySchedule) || {}

    // Migrate old data structure to new breaks format
    const scheduleData = migrateScheduleData(rawScheduleData)

    const resolvedYear = schedule?.year ?? targetYear
    const resolvedMonthValue = schedule?.month ?? targetMonth

    if (
      !resolvedYear ||
      !resolvedMonthValue ||
      resolvedYear < 2020 ||
      resolvedYear > 2030 ||
      resolvedMonthValue < 1 ||
      resolvedMonthValue > 12
    ) {
      notFound()
    }

    const month = resolvedMonthValue - 1 // JavaScript months are 0-indexed
    const year = resolvedYear

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
        schedule: scheduleExists ? scheduleData[dateStr] || defaultDaySchedule : null,
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
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900" data-public-schedule-root="true">
        <ViewTracker
          userId={profile.id}
          publicSlug={resolvedParams.slug}
          scheduleMonth={resolvedMonthValue}
          scheduleYear={resolvedYear}
        />
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-6xl">
            {/* Banner Section */}
            <div className="relative mb-6 sm:mb-10">
              {/* Banner Background */}
              {profile.banner_url ? (
                <div 
                  className="absolute inset-x-0 top-0 h-[160px] sm:h-[240px] rounded-lg bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url(${profile.banner_url})`,
                  }}
                />
              ) : (
                <div className="absolute inset-x-0 top-0 h-[160px] sm:h-[240px] rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 dark:from-slate-700 dark:to-slate-900" />
              )}
              
              {/* Overlay for better text readability */}
              <div className="absolute inset-x-0 top-0 h-[160px] sm:h-[240px] rounded-lg bg-black/20 dark:bg-black/40" />
              
              {/* Content */}
              <div className="relative flex flex-col items-center justify-center h-[160px] sm:h-[240px] px-4">
                {/* Logo */}
                {profile.logo_url ? (
                  <Image
                    src={profile.logo_url}
                    alt="Business Logo"
                    width={60}
                    height={60}
                  className="rounded-lg mb-3 sm:mb-5 shadow-lg"
                />
              ) : (
                <div className="w-[70px] h-[70px] sm:w-[90px] sm:h-[90px] bg-white/20 dark:bg-white/10 rounded-lg mb-3 sm:mb-5 flex items-center justify-center shadow-lg">
                  <span className="text-white/80 dark:text-white/60 text-2xl sm:text-3xl font-bold">LOGO</span>
                </div>
              )}
              
              {/* Business Name */}
              <h1 className="text-white text-2xl sm:text-4xl font-bold text-center mb-2 sm:mb-3 drop-shadow-lg">
                {businessName}
              </h1>
              
              {/* Schedule Title */}
              <p className="text-white/90 dark:text-white/80 text-base sm:text-xl text-center drop-shadow-md">
                {month + 1}月 {year} スケジュール
              </p>
              </div>
            </div>

          {/* Calendar */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-slate-700">
              {dayNames.map((day, index) => (
                <div
                  key={index}
                  className="p-2 sm:p-4 text-center text-xs sm:text-sm font-medium text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-700/50"
                >
                  <div className="text-base sm:text-lg text-gray-700 dark:text-slate-200">{day}</div>
                  <div className="text-[10px] sm:text-xs text-gray-400 dark:text-slate-400">{dayNamesEnglish[index]}</div>
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 auto-rows-max">
              {weeks.map((week, weekIndex) =>
                week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`border-r border-b border-gray-200 dark:border-slate-700 last:border-r-0 ${
                      day ? 'min-h-[80px] sm:min-h-[128px] p-2 sm:p-4' : 'min-h-[80px] sm:min-h-[128px]'
                    }`}
                  >
                    {day ? (
                      <div className="h-full flex flex-col">
                        {/* Date */}
                        <div className={`text-sm sm:text-base font-medium mb-1 sm:mb-2 ${
                          day.schedule?.closed 
                            ? 'text-red-400 dark:text-red-400' 
                            : 'text-gray-900 dark:text-slate-100'
                        }`}>
                          {day.day}
                        </div>

                        {/* Schedule Content */}
                        {!scheduleExists ? (
                          <div className="flex-1 flex items-center justify-center">
                            <div className="text-gray-400 dark:text-slate-500 text-xs">-</div>
                          </div>
                        ) : day.schedule?.closed ? (
                          <div className="flex flex-col items-start text-xs sm:text-sm text-red-400 dark:text-red-400">
                            休業
                          </div>
                        ) : (
                          <div className="flex flex-col space-y-1 text-[11px] sm:text-xs text-gray-700 dark:text-slate-300 leading-tight text-left">
                            {getOpenPeriods(day.schedule).map((period, periodIndex) => (
                              <div key={periodIndex} className="font-semibold text-gray-900 dark:text-slate-100">
                                {period.start}〜{period.end}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        {/* Empty cell for days from previous/next month */}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Navigation and Footer */}
          <div className="mt-4 sm:mt-6">
            <PublicScheduleNavigation
              slug={resolvedParams.slug}
              currentMonth={resolvedMonthValue}
              currentYear={year}
              hasPrevious={!!prevSchedule}
              hasNext={!!nextSchedule}
              prevMonth={prevMonth}
              prevYear={prevYear}
              nextMonth={nextMonth}
              nextYear={nextYear}
            >
              <p className="text-xs sm:text-sm text-gray-500 text-center">
                スケジュール最終更新: {schedule?.created_at ? new Date(schedule.created_at).toLocaleDateString('ja-JP') : 'N/A'}
              </p>
            </PublicScheduleNavigation>
          </div>

          {/* No Schedule Message */}
          {!scheduleExists && (
            <div className="mt-4 sm:mt-6 text-center text-sm sm:text-base text-gray-600 dark:text-gray-300">
              現在、公開スケジュールはありません。最新情報をお待ちください。
            </div>
          )}
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error in PublicSchedulePage:", error)
    notFound()
  }
}
