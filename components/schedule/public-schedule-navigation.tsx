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
  children?: React.ReactNode
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
  children,
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
    <div className="flex items-center justify-between w-full">
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
        <span className="sm:hidden">前月</span>
      </Button>

      {children && (
        <div className="flex-1 flex justify-center">
          {children}
        </div>
      )}

      <Button
        variant="outline"
        onClick={navigateToNext}
        disabled={!hasNext}
        className="flex items-center gap-2 bg-transparent"
      >
        <span className="hidden sm:inline">{hasNext && `${monthNames[nextMonth - 1]} ${nextYear}`}</span>
        <span className="sm:hidden">次月</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
