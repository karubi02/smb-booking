"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface Schedule {
  id: string
  month: number
  year: number
  is_public: boolean
  created_at: string
}

interface YearOverviewProps {
  schedules: Schedule[]
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const monthNamesShort = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
]

export function YearOverview({ schedules }: YearOverviewProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Get all years that have schedules
  const yearsWithSchedules = Array.from(
    new Set(schedules.map(s => s.year))
  ).sort((a, b) => b - a)

  // Filter schedules for the selected year
  const yearSchedules = schedules.filter(s => s.year === selectedYear)
  
  // Create a map of months that have schedules
  const monthsWithSchedules = new Set(yearSchedules.map(s => s.month))
  const monthsWithPublicSchedules = new Set(
    yearSchedules.filter(s => s.is_public).map(s => s.month)
  )

  const handlePreviousYear = () => {
    setSelectedYear(prev => prev - 1)
  }

  const handleNextYear = () => {
    setSelectedYear(prev => prev + 1)
  }

  const canGoPrevious = selectedYear > 2020 // Reasonable limit
  const canGoNext = selectedYear < new Date().getFullYear() + 5 // 5 years ahead

  return (
    <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Year Overview
            </CardTitle>
            <CardDescription>Track your schedule activity across months</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousYear}
              disabled={!canGoPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold min-w-[80px] text-center">
              {selectedYear}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextYear}
              disabled={!canGoNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3">
          {monthNames.map((monthName, index) => {
            const monthNumber = index + 1
            const hasSchedule = monthsWithSchedules.has(monthNumber)
            const hasPublicSchedule = monthsWithPublicSchedules.has(monthNumber)
            const isCurrentMonth = new Date().getMonth() === index && new Date().getFullYear() === selectedYear
            
            return (
              <div
                key={monthNumber}
                className={cn(
                  "relative p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md",
                  hasSchedule
                    ? "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
                  isCurrentMonth && "ring-2 ring-blue-500 ring-opacity-50"
                )}
              >
                <div className="text-center">
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    hasSchedule
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-slate-600 dark:text-slate-400"
                  )}>
                    {monthNamesShort[index]}
                  </div>
                  
                  <div className={cn(
                    "w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-bold",
                    hasSchedule
                      ? "bg-blue-600 text-white"
                      : "bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-400"
                  )}>
                    {monthNumber}
                  </div>

                  {hasSchedule && (
                    <div className="mt-2 space-y-1">
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        Active
                      </div>
                      {hasPublicSchedule && (
                        <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                          Public
                        </div>
                      )}
                    </div>
                  )}

                  {isCurrentMonth && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span className="text-slate-600 dark:text-slate-400">Has Schedule</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
              <span className="text-slate-600 dark:text-slate-400">No Schedule</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full ring-2 ring-blue-500 ring-opacity-50"></div>
              <span className="text-slate-600 dark:text-slate-400">Current Month</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

