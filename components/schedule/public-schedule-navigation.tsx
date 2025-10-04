"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

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
  const [isNavigating, setIsNavigating] = useState<'prev' | 'next' | null>(null)

  const navigateToPrevious = () => {
    if (hasPrevious && !isNavigating) {
      setIsNavigating('prev')
      router.push(`/${slug}?month=${prevMonth}&year=${prevYear}`)
      // Reset loading state after navigation completes
      setTimeout(() => setIsNavigating(null), 1000)
    }
  }

  const navigateToNext = () => {
    if (hasNext && !isNavigating) {
      setIsNavigating('next')
      router.push(`/${slug}?month=${nextMonth}&year=${nextYear}`)
      // Reset loading state after navigation completes
      setTimeout(() => setIsNavigating(null), 1000)
    }
  }

  return (
    <div className="flex items-center justify-between w-full">
      <Button
        variant="outline"
        onClick={navigateToPrevious}
        disabled={!hasPrevious || isNavigating === 'prev'}
        className="flex items-center gap-2 bg-transparent"
      >
        {isNavigating === 'prev' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
        {hasPrevious && !isNavigating && (
          <span className="hidden sm:inline">
            {monthNames[prevMonth - 1]} {prevYear}
          </span>
        )}
        {isNavigating === 'prev' ? (
          <span className="text-xs">読み込み中...</span>
        ) : (
          <span className="sm:hidden">前月</span>
        )}
      </Button>

      {children && (
        <div className="flex-1 flex justify-center">
          {children}
        </div>
      )}

      <Button
        variant="outline"
        onClick={navigateToNext}
        disabled={!hasNext || isNavigating === 'next'}
        className="flex items-center gap-2 bg-transparent"
      >
        {isNavigating === 'next' ? (
          <span className="text-xs">読み込み中...</span>
        ) : (
          <>
            <span className="hidden sm:inline">{hasNext && `${monthNames[nextMonth - 1]} ${nextYear}`}</span>
            <span className="sm:hidden">次月</span>
          </>
        )}
        {isNavigating === 'next' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
