"use client"

import { useEffect, useMemo, useRef } from "react"
import { trackPublicScheduleView } from "@/lib/view-tracking"

interface ViewTrackerProps {
  userId: string
  publicSlug: string
  scheduleMonth?: number
  scheduleYear?: number
}

export function ViewTracker({
  userId,
  publicSlug,
  scheduleMonth: _scheduleMonth,
  scheduleYear: _scheduleYear,
}: ViewTrackerProps) {
  const trackingRef = useRef(false)

  const storageKey = useMemo(() => {
    if (!userId || !publicSlug) {
      return null
    }

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0")

    return `schedule-view::${userId}::${publicSlug}::${currentYear}-${currentMonth}`
  }, [publicSlug, userId])

  useEffect(() => {
    if (!storageKey) {
      return
    }

    if (typeof window === "undefined") {
      return
    }

    try {
      const storage = window.localStorage ?? window.sessionStorage
      const hasTrackedBefore = storage.getItem(storageKey)
      if (hasTrackedBefore || trackingRef.current) {
        return
      }

      trackingRef.current = true
      storage.setItem(storageKey, new Date().toISOString())

      void (async () => {
        try {
          await trackPublicScheduleView(userId, publicSlug)
        } catch (error) {
          console.warn("Failed to record schedule view:", error)
          storage.removeItem(storageKey)
        } finally {
          trackingRef.current = false
        }
      })()
    } catch (error) {
      console.warn("View tracker storage unavailable:", error)
      if (!trackingRef.current) {
        trackingRef.current = true
        void trackPublicScheduleView(userId, publicSlug).finally(() => {
          trackingRef.current = false
        })
      }
    }
  }, [publicSlug, storageKey, userId])

  return null
}
