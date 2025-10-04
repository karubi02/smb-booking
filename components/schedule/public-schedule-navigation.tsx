"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface PublicScheduleNavigationProps {
  slug: string
  currentMonth: number
  currentYear: number
  hasPrevious: boolean
  hasNext: boolean
  prevMonth: number
  prevYear: number
  nextMonth: number
  nextYear: number
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

export function PublicScheduleNavigation({
  slug,
  currentMonth,
  currentYear,
  hasPrevious,
  hasNext,
  prevMonth,
  prevYear,
  nextMonth,
  nextYear,
}: PublicScheduleNavigationProps) {
  const router = useRouter()

  const navigateToPrevious = () => {
    if (hasPrevious) {
      router.push(`/${slug}?month=${prevMonth}&year=${prevYear}`)
    }
  }

  const navigateToNext = () => {
    if (hasNext) {
      router.push(`/${slug}?month=${nextMonth}&year=${nextYear}`)
    }
  }

  return (
    <div className="flex items-center justify-between mb-8 px-4">
      <Button
        variant="outline"
        onClick={navigateToPrevious}
        disabled={!hasPrevious}
        className="flex items-center gap-2 bg-transparent"
      >
        <ChevronLeft className="h-4 w-4" />
        {hasPrevious && (
          <span className="hidden sm:inline">
            {monthNames[prevMonth - 1]} {prevYear}
          </span>
        )}
        <span className="sm:hidden">Previous</span>
      </Button>

      <div className="text-center">
        <h2 className="text-lg font-semibold">
          {monthNames[currentMonth - 1]} {currentYear}
        </h2>
      </div>

      <Button
        variant="outline"
        onClick={navigateToNext}
        disabled={!hasNext}
        className="flex items-center gap-2 bg-transparent"
      >
        <span className="hidden sm:inline">{hasNext && `${monthNames[nextMonth - 1]} ${nextYear}`}</span>
        <span className="sm:hidden">Next</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
