"use client"

import { useState, useEffect, useMemo, useCallback, memo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { TimePicker } from "@/components/ui/time-picker"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@supabase/ssr"
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Copy,
  Share2,
  Eye,
  EyeOff,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  QrCode,
  Trash2,
  Plus,
  X,
} from "lucide-react"
import { QRCodeModal } from "./qr-code-modal" // Added QR code modal import
import { calculateTotalHours } from "@/lib/schedule-utils"

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
  [date: string]: DaySchedule // Format: "2024-01-15"
}

const defaultDaySchedule: DaySchedule = {
  open: "09:00",
  close: "17:00",
  closed: false,
  breaks: [],
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

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// Helper function to add minutes to a time string
const addMinutes = (timeStr: string, minutes: number): string => {
  const [hours, mins] = timeStr.split(':').map(Number)
  const totalMinutes = hours * 60 + mins + minutes
  const newHours = Math.floor(totalMinutes / 60) % 24
  const newMins = totalMinutes % 60
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`
}

// Memoized day card component to prevent unnecessary re-renders
const DayCard = memo(({ 
  day, 
  daySchedule, 
  isToday, 
  onUpdate,
  onAddBreak,
  onRemoveBreak,
  onUpdateBreak
}: { 
  day: { day: number; dateStr: string; dayOfWeek: number }
  daySchedule: DaySchedule
  isToday: boolean
  onUpdate: (dateStr: string, field: keyof DaySchedule, value: string | boolean) => void
  onAddBreak: (dateStr: string) => void
  onRemoveBreak: (dateStr: string, breakId: string) => void
  onUpdateBreak: (dateStr: string, breakId: string, field: keyof Break, value: string) => void
}) => {
  return (
    <Card className={`${isToday ? "ring-2 ring-blue-500" : ""} ${daySchedule.closed ? "bg-red-50 dark:bg-red-900/20" : "bg-green-50 dark:bg-green-900/20"}`}>
      <CardContent className="py-1 px-2 space-y-1">
        <div className="flex items-center justify-between">
          <div className="font-medium text-sm">{day.day}</div>
          <Switch
            checked={!daySchedule.closed}
            onCheckedChange={(checked) => onUpdate(day.dateStr, "closed", !checked)}
            size="sm"
          />
        </div>

        <div className="space-y-2">
          {!daySchedule.closed && (
            <div className="space-y-2">
              <div>
                <Label className="text-xs">Open</Label>
                <TimePicker
                  value={daySchedule.open}
                  onChange={(value) => onUpdate(day.dateStr, "open", value)}
                />
              </div>
              <div>
                <Label className="text-xs">Close</Label>
                <TimePicker
                  value={daySchedule.close}
                  onChange={(value) => onUpdate(day.dateStr, "close", value)}
                />
              </div>

              <div className="border-t pt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Breaks</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddBreak(day.dateStr)}
                    className="h-6 w-6 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {(daySchedule.breaks || []).map((breakItem, index) => (
                  <div key={breakItem.id} className="space-y-1 p-2 border rounded bg-slate-50 dark:bg-slate-800">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Break {index + 1}</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveBreak(day.dateStr, breakItem.id)}
                        className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs">Start</Label>
                        <TimePicker
                          value={breakItem.start}
                          onChange={(value) => onUpdateBreak(day.dateStr, breakItem.id, "start", value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">End</Label>
                        <TimePicker
                          value={breakItem.end}
                          onChange={(value) => onUpdateBreak(day.dateStr, breakItem.id, "end", value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {daySchedule.closed && <div className="text-center text-xs text-muted-foreground">Closed</div>}
        </div>
      </CardContent>
    </Card>
  )
})

interface ScheduleClientProps {
  userId: string
}

export function ScheduleClient({ userId }: ScheduleClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Initialize currentDate from URL parameters or current date
  const getInitialDate = () => {
    const monthParam = searchParams.get('month')
    const yearParam = searchParams.get('year')
    
    if (monthParam && yearParam) {
      const month = parseInt(monthParam)
      const year = parseInt(yearParam)
      // JavaScript Date months are 0-based, so subtract 1
      return new Date(year, month - 1, 1)
    }
    
    return new Date()
  }
  
  const [currentDate, setCurrentDate] = useState(getInitialDate())
  const [schedule, setSchedule] = useState<MonthlySchedule>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [publicSlug, setPublicSlug] = useState<string | null>(null)
  const [autoCreated, setAutoCreated] = useState(false)
  const [copyingLink, setCopyingLink] = useState(false)
  const [scheduleExists, setScheduleExists] = useState(false)
  const [showCreateOptions, setShowCreateOptions] = useState(false)
  const [lastSavedSchedule, setLastSavedSchedule] = useState<MonthlySchedule>({})
  const [lastSavedIsPublic, setLastSavedIsPublic] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false) // Added QR modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false) // Added delete modal state
  const [isDeleting, setIsDeleting] = useState(false) // Added deleting state
  const { toast } = useToast()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      days.push({
        day,
        dateStr,
        dayOfWeek: new Date(year, month, day).getDay(),
      })
    }

    return days
  }

  useEffect(() => {
    loadSchedule()
  }, [currentMonth, currentYear])

  // Auto-show create options when new=true is in URL and no schedule exists
  useEffect(() => {
    const isNew = searchParams.get('new') === 'true'
    if (isNew && !scheduleExists && !autoCreated && Object.keys(schedule).length === 0 && !loading) {
      setAutoCreated(true)
      setShowCreateOptions(true)
    }
  }, [scheduleExists, autoCreated, schedule, loading, searchParams])

  // Simple state-based tracking instead of expensive comparisons
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Migration function to handle old data structure
  const migrateScheduleData = (rawSchedule: any): MonthlySchedule => {
    const migratedSchedule: MonthlySchedule = {}
    
    for (const [dateStr, dayData] of Object.entries(rawSchedule)) {
      const daySchedule = dayData as any
      
      // Check if this is old format (has hasBreak, breakStart, breakEnd)
      if (daySchedule.hasBreak !== undefined) {
        const breaks: Break[] = []
        
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

  const loadSchedule = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.from("profiles").select("public_slug").eq("id", userId).single()

      if (data?.public_slug) {
        setPublicSlug(data.public_slug)
      }

      const { data: scheduleData, error } = await supabase
        .from("schedules")
        .select("schedule_data, is_public")
        .eq("user_id", userId)
        .eq("month", currentMonth)
        .eq("year", currentYear)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Error loading schedule:", error)
        return
      }

      if (scheduleData) {
        const rawSchedule = scheduleData.schedule_data as MonthlySchedule
        const migratedSchedule = migrateScheduleData(rawSchedule)
        setSchedule(migratedSchedule)
        setIsPublic(scheduleData.is_public || false)
        setScheduleExists(true)
        setLastSavedSchedule(migratedSchedule)
        setLastSavedIsPublic(scheduleData.is_public || false)
        setHasUnsavedChanges(false)
      } else {
        setSchedule({})
        setIsPublic(false)
        setScheduleExists(false)
        setLastSavedSchedule({})
        setLastSavedIsPublic(false)
        setHasUnsavedChanges(false)
      }
      setShowCreateOptions(false)
    } catch (error) {
      console.error("Error loading schedule:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveSchedule = async () => {
    setSaving(true)
    try {

      let slugToUse = publicSlug
      if (isPublic && !publicSlug) {
        const newSlug = Math.random().toString(36).substring(2, 10)

        const { error: profileError } = await supabase
          .from("profiles")
          .update({ public_slug: newSlug })
          .eq("id", userId)

        if (profileError) {
          console.error("Error updating profile slug:", profileError)
          toast({
            title: "Error",
            description: "Failed to generate public link. Please try again.",
            variant: "destructive",
          })
          return
        }

        slugToUse = newSlug
        setPublicSlug(newSlug)
      }

      // Calculate total hours for this schedule
      const totalHours = calculateTotalHours(schedule, currentMonth, currentYear)

      const { error } = await supabase.from("schedules").upsert(
        {
          user_id: userId,
          month: currentMonth,
          year: currentYear,
          schedule_data: schedule,
          is_public: isPublic,
          total_hours: totalHours,
        },
        {
          onConflict: "user_id,month,year",
        },
      )

      if (error) {
        console.error("Error saving schedule:", error)
        toast({
          title: "Error",
          description: "Failed to save schedule. Please try again.",
          variant: "destructive",
        })
        return
      }

      setLastSavedSchedule({ ...schedule })
      setLastSavedIsPublic(isPublic)
      setScheduleExists(true)
      setHasUnsavedChanges(false)

      toast({
        title: "Success",
        description: "Schedule saved successfully!",
      })
    } catch (error) {
      console.error("Error saving schedule:", error)
      toast({
        title: "Error",
        description: "Failed to save schedule. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const updateDaySchedule = useCallback((dateStr: string, field: keyof DaySchedule, value: string | boolean) => {
    setSchedule((prev) => ({
      ...prev,
      [dateStr]: {
        ...(prev[dateStr] || defaultDaySchedule),
        [field]: value,
      },
    }))
    setHasUnsavedChanges(true)
  }, [])

  const addBreak = useCallback((dateStr: string) => {
    setSchedule((prev) => {
      const daySchedule = prev[dateStr] || defaultDaySchedule
      const breaks = daySchedule.breaks || []
      const lastBreakEnd = breaks.length > 0 
        ? breaks[breaks.length - 1].end 
        : "12:00" // First break starts at noon
      
      const newBreak: Break = {
        id: Date.now().toString(),
        start: lastBreakEnd,
        end: addMinutes(lastBreakEnd, 60) // Default 1 hour break
      }
      
      return {
        ...prev,
        [dateStr]: {
          ...daySchedule,
          breaks: [...breaks, newBreak]
        }
      }
    })
    setHasUnsavedChanges(true)
  }, [])

  const removeBreak = useCallback((dateStr: string, breakId: string) => {
    setSchedule((prev) => {
      const daySchedule = prev[dateStr] || defaultDaySchedule
      return {
        ...prev,
        [dateStr]: {
          ...daySchedule,
          breaks: (daySchedule.breaks || []).filter(b => b.id !== breakId)
        }
      }
    })
    setHasUnsavedChanges(true)
  }, [])

  const updateBreak = useCallback((dateStr: string, breakId: string, field: keyof Break, value: string) => {
    setSchedule((prev) => {
      const daySchedule = prev[dateStr] || defaultDaySchedule
      return {
        ...prev,
        [dateStr]: {
          ...daySchedule,
          breaks: (daySchedule.breaks || []).map(breakItem => 
            breakItem.id === breakId 
              ? { ...breakItem, [field]: value }
              : breakItem
          )
        }
      }
    })
    setHasUnsavedChanges(true)
  }, [])

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    if (direction === "prev") {
      newDate.setMonth(currentDate.getMonth() - 1)
    } else {
      newDate.setMonth(currentDate.getMonth() + 1)
    }
    
    // Update state
    setCurrentDate(newDate)
    
    // Update URL parameters
    const newMonth = newDate.getMonth() + 1 // Convert to 1-based
    const newYear = newDate.getFullYear()
    router.push(`/dashboard/schedule?month=${newMonth}&year=${newYear}`)
  }

  const deleteSchedule = async () => {
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from("schedules")
        .delete()
        .eq("user_id", userId)
        .eq("month", currentMonth)
        .eq("year", currentYear)

      if (error) {
        console.error("Error deleting schedule:", error)
        toast({
          title: "Error",
          description: "Failed to delete schedule. Please try again.",
          variant: "destructive",
        })
        return
      }

      // Reset all schedule-related state
      setSchedule({})
      setScheduleExists(false)
      setShowCreateOptions(true)
      setLastSavedSchedule({})
      setLastSavedIsPublic(false)
      setIsPublic(false)
      setHasUnsavedChanges(false)

      setDeleteModalOpen(false)
      toast({
        title: "Schedule Deleted",
        description: "The schedule has been successfully deleted.",
      })
    } catch (error) {
      console.error("Error deleting schedule:", error)
      toast({
        title: "Error",
        description: "Failed to delete schedule. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const copyFromPreviousMonth = async (isCreating = false) => {
    const prevDate = new Date(currentDate)
    prevDate.setMonth(currentDate.getMonth() - 1)
    const prevMonth = prevDate.getMonth() + 1
    const prevYear = prevDate.getFullYear()

    try {
      const { data, error } = await supabase
        .from("schedules")
        .select("schedule_data")
        .eq("user_id", userId)
        .eq("month", prevMonth)
        .eq("year", prevYear)
        .single()

      if (error) {
        toast({
          title: "No Previous Schedule",
          description: "No schedule found for the previous month.",
          variant: "destructive",
        })
        if (isCreating) {
          createFromDefaults()
        }
        return
      }

      if (data) {
        // Remap the schedule data to the current month's date strings
        const previousSchedule = data.schedule_data as MonthlySchedule
        const currentSchedule: MonthlySchedule = {}
        
        // Get the current month's days
        const currentDays = getDaysInMonth().filter((day) => day !== null)
        
        // Map previous month's day schedules to current month's dates
        Object.entries(previousSchedule).forEach(([prevDateStr, daySchedule]) => {
          const prevDate = new Date(prevDateStr)
          const dayOfMonth = prevDate.getDate()
          
          // Find the corresponding day in the current month
          const currentDay = currentDays.find(day => day && day.day === dayOfMonth)
          if (currentDay) {
            currentSchedule[currentDay.dateStr] = daySchedule
          }
        })
        
        setSchedule(currentSchedule)
        if (isCreating) {
          setScheduleExists(true)
          setShowCreateOptions(false)
        }
        toast({
          title: "Success",
          description: "Copied schedule from previous month!",
        })
      }
    } catch (error) {
      console.error("Error copying schedule:", error)
      if (isCreating) {
        createFromDefaults()
      }
    }
  }

  const applyToAllDays = () => {
    const days = getDaysInMonth().filter((day) => day !== null)
    const newSchedule: MonthlySchedule = {}

    days.forEach((day) => {
      if (day) {
        newSchedule[day.dateStr] = { ...defaultDaySchedule }
      }
    })

    setSchedule(newSchedule)
    toast({
      title: "Applied to All Days",
      description: "Default hours applied to all days in the month.",
    })
  }

  const copyPublicLink = async () => {
    if (!publicSlug) return

    setCopyingLink(true)
    try {
      const publicUrl = `${window.location.origin}/${publicSlug}`
      await navigator.clipboard.writeText(publicUrl)
      toast({
        title: "Link Copied",
        description: "Public schedule link copied to clipboard!",
      })
    } catch (error) {
      console.error("Error copying link:", error)
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCopyingLink(false)
    }
  }

  const openPublicLink = () => {
    if (!publicSlug) return

    const publicUrl = `${window.location.origin}/${publicSlug}`
    window.open(publicUrl, "_blank")
  }

  const createNewSchedule = () => {
    setShowCreateOptions(true)
  }

  const createFromDefaults = () => {
    const days = getDaysInMonth().filter((day) => day !== null)
    const newSchedule: MonthlySchedule = {}

    days.forEach((day) => {
      if (day) {
        newSchedule[day.dateStr] = { ...defaultDaySchedule }
      }
    })

    setSchedule(newSchedule)
    setScheduleExists(true)
    setShowCreateOptions(false)
    setLastSavedSchedule({})
    setLastSavedIsPublic(false)
    toast({
      title: "Schedule Created",
      description: "New schedule created with default hours.",
    })
  }

  const getSaveStatus = () => {
    if (!scheduleExists) {
      return {
        text: "Never saved",
        icon: AlertCircle,
        variant: "secondary" as const,
        color: "text-orange-600",
      }
    }
    if (hasUnsavedChanges) {
      return {
        text: "Unsaved changes",
        icon: AlertCircle,
        variant: "secondary" as const,
        color: "text-orange-600",
      }
    }
    return {
      text: "All changes saved",
      icon: CheckCircle2,
      variant: "outline" as const,
      color: "text-blue-600",
    }
  }

  const days = getDaysInMonth()
  const saveStatus = getSaveStatus()
  const SaveStatusIcon = saveStatus.icon

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            Schedule
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 mt-2">
            Set individual opening hours for each day
          </p>
        </div>
        {scheduleExists && (
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-md border ${saveStatus.color}`}>
              <SaveStatusIcon className="h-4 w-4" />
              <span className="text-sm font-medium">{saveStatus.text}</span>
            </div>
            <Button variant="outline" onClick={applyToAllDays}>
              <Copy className="h-4 w-4 mr-2" />
              Apply Default to All
            </Button>
            <Button variant="outline" onClick={() => copyFromPreviousMonth(false)}>
              Copy Previous Month
            </Button>
            <Button
              onClick={saveSchedule}
              disabled={saving}
              variant={hasUnsavedChanges ? "default" : "outline"}
              className={hasUnsavedChanges ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" : ""}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : hasUnsavedChanges ? "Save Changes" : "Save Schedule"}
            </Button>
            {scheduleExists && (
              <Button
                onClick={() => setDeleteModalOpen(true)}
                variant="destructive"
                size="sm"
                className="bg-red-600 hover:bg-red-700 px-2"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl">
                {monthNames[currentDate.getMonth()]} {currentYear}
                {scheduleExists && Object.keys(schedule).length > 0 && (
                  <span className="text-base font-normal text-slate-600 dark:text-slate-400 ml-2">
                    ({calculateTotalHours(schedule, currentMonth, currentYear).toFixed(0)}時間)
                  </span>
                )}
              </CardTitle>
              {scheduleExists && (
                <Badge 
                  variant={isPublic ? "default" : "secondary"}
                  className={isPublic ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" : "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"}
                >
                  {isPublic ? "Published" : "Draft"}
                </Badge>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="text-slate-600 dark:text-slate-400">Loading schedule...</div>
            </div>
          </CardContent>
        </Card>
      ) : !scheduleExists ? (
        <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No Schedule Found</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  No schedule exists for {monthNames[currentDate.getMonth()]} {currentYear}
                </p>
              </div>

              {!showCreateOptions ? (
                <Button onClick={createNewSchedule} size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  Create Schedule
                </Button>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">How would you like to create your schedule?</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={() => copyFromPreviousMonth(true)} variant="outline">
                      Copy from Previous Month
                    </Button>
                    <Button onClick={createFromDefaults} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">Start with Default Hours</Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateOptions(false)}
                    className="text-slate-600 dark:text-slate-400"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {dayNames.map((dayName) => (
                <div key={dayName} className="text-center text-sm font-medium text-slate-600 dark:text-slate-400 p-2">
                  {dayName}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => {
                if (!day) {
                  return <div key={index} className="p-2" />
                }

                const daySchedule = schedule[day.dateStr] || defaultDaySchedule
                const isToday = new Date().toDateString() === new Date(day.dateStr).toDateString()

                return (
                  <DayCard
                    key={day.dateStr}
                    day={day}
                    daySchedule={daySchedule}
                    isToday={isToday}
                    onUpdate={updateDaySchedule}
                    onAddBreak={addBreak}
                    onRemoveBreak={removeBreak}
                    onUpdateBreak={updateBreak}
                  />
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {scheduleExists && (
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Share2 className="h-5 w-5" />
                  Public Sharing
                </CardTitle>
                <CardDescription>Allow customers to view your schedule with a public link</CardDescription>
              </div>
              {scheduleExists && (
                <Badge 
                  variant="secondary" 
                  className={`${
                    isPublic 
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
                      : "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                  }`}
                >
                  {isPublic ? "Published" : "Draft"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                <Label htmlFor="public-toggle">Make schedule public</Label>
              </div>
              <Switch id="public-toggle" checked={isPublic} onCheckedChange={async (checked) => {
                setIsPublic(checked)
                setHasUnsavedChanges(true)
                
                // Auto-save when public toggle changes
                try {
                  let slugToUse = publicSlug
                  if (checked && !publicSlug) {
                    const newSlug = Math.random().toString(36).substring(2, 10)

                    const { error: profileError } = await supabase
                      .from("profiles")
                      .update({ public_slug: newSlug })
                      .eq("id", userId)

                    if (profileError) {
                      console.error("Error updating profile slug:", profileError)
                      toast({
                        title: "Error",
                        description: "Failed to generate public link. Please try again.",
                        variant: "destructive",
                      })
                      return
                    }

                    slugToUse = newSlug
                    setPublicSlug(newSlug)
                  }

                  const { error } = await supabase.from("schedules").upsert(
                    {
                      user_id: userId,
                      month: currentMonth,
                      year: currentYear,
                      schedule_data: schedule,
                      is_public: checked,
                    },
                    {
                      onConflict: "user_id,month,year",
                    },
                  )

                  if (error) {
                    console.error("Error saving schedule:", error)
                    toast({
                      title: "Error",
                      description: "Failed to save public status. Please try again.",
                      variant: "destructive",
                    })
                    return
                  }

                  setHasUnsavedChanges(false)
                  toast({
                    title: "Schedule updated",
                    description: checked ? "Schedule is now public" : "Schedule is now private",
                  })
                } catch (error) {
                  console.error("Error in auto-save:", error)
                  toast({
                    title: "Error",
                    description: "Failed to update public status. Please try again.",
                    variant: "destructive",
                  })
                }
              }} />
            </div>

            {isPublic && publicSlug && (
              <div className="space-y-2">
                <Label>Public Link</Label>
                <div className="flex gap-2">
                  <Input value={`${window.location.origin}/${publicSlug}`} readOnly className="font-mono text-sm" />
                  <Button variant="outline" onClick={copyPublicLink} disabled={copyingLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={openPublicLink}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => setQrModalOpen(true)}>
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this link with customers to let them view your schedule
                </p>
              </div>
            )}

            {isPublic && !publicSlug && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Save your schedule to generate a public link that you can share with customers.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        url={publicSlug ? `${window.location.origin}/${publicSlug}` : ""}
        businessName="スケジュール"
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Schedule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the schedule for {monthNames[currentDate.getMonth()]} {currentYear}? 
              This action cannot be undone and will permanently remove all schedule data for this month.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteSchedule}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Schedule
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
