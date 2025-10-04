import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { PublicScheduleNavigation } from "@/components/schedule/public-schedule-navigation"

interface DaySchedule {
  open: string
  close: string
  closed: boolean
  hasBreak: boolean
  breakStart: string
  breakEnd: string
}

interface MonthlySchedule {
  [date: string]: DaySchedule
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const dayNames = ["日", "月", "火", "水", "木", "金", "土"] // Sunday through Saturday in Japanese kanji
const dayNamesEnglish = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const defaultDaySchedule: DaySchedule = {
  open: "09:00",
  close: "17:00",
  closed: false,
  hasBreak: false,
  breakStart: "12:00",
  breakEnd: "13:00",
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

export default async function PublicSchedulePage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { month?: string; year?: string }
}) {
  try {
    const currentDate = new Date()
    const targetMonth = searchParams.month ? Number.parseInt(searchParams.month) : currentDate.getMonth() + 1
    const targetYear = searchParams.year ? Number.parseInt(searchParams.year) : currentDate.getFullYear()

    const cookieStore = cookies()
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
      .select("id, display_name")
      .eq("public_slug", params.slug)
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
      .single()

    const { data: nextSchedule } = await supabase
      .from("schedules")
      .select("id")
      .eq("user_id", profile.id)
      .eq("is_public", true)
      .eq("month", nextMonth)
      .eq("year", nextYear)
      .single()

    const businessName = profile.display_name || "Business"
    console.log("[v0] Business name being used:", businessName)

    const scheduleData = schedule.schedule_data as MonthlySchedule

    if (!scheduleData || typeof scheduleData !== "object") {
      notFound()
    }

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
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{businessName} Opening Hours</h1>
            <p className="text-gray-600">
              {monthNames[month]} {year} Schedule
            </p>
          </div>

          <PublicScheduleNavigation
            slug={params.slug}
            currentMonth={targetMonth}
            currentYear={targetYear}
            hasPrevious={!!prevSchedule}
            hasNext={!!nextSchedule}
            prevMonth={prevMonth}
            prevYear={prevYear}
            nextMonth={nextMonth}
            nextYear={nextYear}
          />

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
                      className={`h-32 border-r border-gray-200 last:border-r-0 p-2 ${
                        isToday ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="text-right mb-2">
                        <span className={`text-lg font-semibold ${isToday ? "text-blue-600" : "text-gray-700"}`}>
                          {String(day.day).padStart(2, "0")}
                        </span>
                      </div>

                      <div className="text-xs space-y-1">
                        {daySchedule.closed ? (
                          <div className="text-red-600 font-medium">Closed</div>
                        ) : (
                          <>
                            <div className="text-gray-700 font-medium">
                              {formatTime(daySchedule.open)} - {formatTime(daySchedule.close)}
                            </div>
                            {daySchedule.hasBreak && daySchedule.breakStart && daySchedule.breakEnd && (
                              <div className="text-gray-500">
                                Break: {formatTime(daySchedule.breakStart)} - {formatTime(daySchedule.breakEnd)}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          <div className="text-center mt-8 pt-4">
            <p className="text-sm text-gray-500">Schedule last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Public schedule page error:", error)
    notFound()
  }
}
