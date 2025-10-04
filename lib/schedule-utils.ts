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

/**
 * Calculate total open hours for a month from schedule data
 */
export function calculateTotalHours(schedule: MonthlySchedule, targetMonth?: number, targetYear?: number): number {
  let totalMinutes = 0

  // Get the target month/year (use provided or current date)
  const currentDate = new Date()
  const year = targetYear || currentDate.getFullYear()
  const month = targetMonth ? targetMonth - 1 : currentDate.getMonth() // Convert to 0-based
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()

  // Calculate for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    const daySchedule = schedule[dateStr]
    
    // If no schedule for this day, assume it's closed (0 hours)
    if (!daySchedule || daySchedule.closed) {
      continue
    }

    // Calculate base open hours
    const [openHour, openMin] = daySchedule.open.split(':').map(Number)
    const [closeHour, closeMin] = daySchedule.close.split(':').map(Number)
    
    const openMinutes = openHour * 60 + openMin
    const closeMinutes = closeHour * 60 + closeMin
    let dayMinutes = closeMinutes - openMinutes

    // Subtract break time
    if (daySchedule.breaks && daySchedule.breaks.length > 0) {
      daySchedule.breaks.forEach((breakPeriod) => {
        // Skip empty or invalid breaks
        if (!breakPeriod.start || !breakPeriod.end) {
          return
        }
        
        const [breakStartHour, breakStartMin] = breakPeriod.start.split(':').map(Number)
        const [breakEndHour, breakEndMin] = breakPeriod.end.split(':').map(Number)
        
        // Validate the parsed values
        if (isNaN(breakStartHour) || isNaN(breakStartMin) || isNaN(breakEndHour) || isNaN(breakEndMin)) {
          return
        }
        
        const breakStartMinutes = breakStartHour * 60 + breakStartMin
        const breakEndMinutes = breakEndHour * 60 + breakEndMin
        const currentBreakMinutes = breakEndMinutes - breakStartMinutes
        
        // Only subtract positive break times
        if (currentBreakMinutes > 0) {
          dayMinutes -= currentBreakMinutes
        }
      })
    }

    totalMinutes += Math.max(0, dayMinutes) // Ensure non-negative
  }

  return Math.round((totalMinutes / 60) * 100) / 100 // Round to 2 decimal places
}

/**
 * Calculate average hours per month from multiple schedules
 */
export function calculateAverageHours(schedules: Array<{ total_hours: number }>): number {
  if (schedules.length === 0) return 0
  
  const totalHours = schedules.reduce((sum, schedule) => sum + (schedule.total_hours || 0), 0)
  return Math.round((totalHours / schedules.length) * 100) / 100
}

/**
 * Calculate trend (percentage change) between two periods
 */
export function calculateTrend(currentPeriod: number, previousPeriod: number): {
  percentage: number
  direction: 'up' | 'down' | 'same'
} {
  if (previousPeriod === 0) {
    return {
      percentage: currentPeriod > 0 ? 100 : 0,
      direction: currentPeriod > 0 ? 'up' : 'same'
    }
  }

  const percentage = Math.round(((currentPeriod - previousPeriod) / previousPeriod) * 100)
  
  return {
    percentage: Math.abs(percentage),
    direction: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'same'
  }
}
