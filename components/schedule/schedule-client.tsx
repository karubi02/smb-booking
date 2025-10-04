"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
} from "lucide-react"
import { QRCodeModal } from "./qr-code-modal" // Added QR code modal import

interface DaySchedule {
  open: string
  close: string
  closed: boolean
  hasBreak: boolean
  breakStart: string
  breakEnd: string
}

interface MonthlySchedule {
  [date: string]: DaySchedule // Format: "2024-01-15"
}

const defaultDaySchedule: DaySchedule = {
  open: "09:00",
  close: "17:00",
  closed: false,
  hasBreak: false,
  breakStart: "12:00",
  breakEnd: "13:00",
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

export function ScheduleClient() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [schedule, setSchedule] = useState<MonthlySchedule>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [publicSlug, setPublicSlug] = useState<string | null>(null)
  const [copyingLink, setCopyingLink] = useState(false)
  const [scheduleExists, setScheduleExists] = useState(false)
  const [showCreateOptions, setShowCreateOptions] = useState(false)
  const [lastSavedSchedule, setLastSavedSchedule] = useState<MonthlySchedule>({})
  const [lastSavedIsPublic, setLastSavedIsPublic] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false) // Added QR modal state
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

  useEffect(() => {
    const scheduleChanged = JSON.stringify(schedule) !== JSON.stringify(lastSavedSchedule)
    const publicChanged = isPublic !== lastSavedIsPublic
    setHasUnsavedChanges(scheduleExists && (scheduleChanged || publicChanged))
  }, [schedule, isPublic, lastSavedSchedule, lastSavedIsPublic, scheduleExists])

  const loadSchedule = async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase.from("profiles").select("public_slug").eq("id", user.id).single()

      if (data?.public_slug) {
        setPublicSlug(data.public_slug)
      }

      const { data: scheduleData, error } = await supabase
        .from("schedules")
        .select("schedule_data, is_public")
        .eq("user_id", user.id)
        .eq("month", currentMonth)
        .eq("year", currentYear)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Error loading schedule:", error)
        return
      }

      if (scheduleData) {
        setSchedule(scheduleData.schedule_data as MonthlySchedule)
        setIsPublic(scheduleData.is_public || false)
        setScheduleExists(true)
        setLastSavedSchedule(scheduleData.schedule_data as MonthlySchedule)
        setLastSavedIsPublic(scheduleData.is_public || false)
      } else {
        setSchedule({})
        setIsPublic(false)
        setScheduleExists(false)
        setLastSavedSchedule({})
        setLastSavedIsPublic(false)
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
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      let slugToUse = publicSlug
      if (isPublic && !publicSlug) {
        const newSlug = Math.random().toString(36).substring(2, 10)

        const { error: profileError } = await supabase
          .from("profiles")
          .update({ public_slug: newSlug })
          .eq("id", user.id)

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
          user_id: user.id,
          month: currentMonth,
          year: currentYear,
          schedule_data: schedule,
          is_public: isPublic,
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

  const updateDaySchedule = (dateStr: string, field: keyof DaySchedule, value: string | boolean) => {
    setSchedule((prev) => ({
      ...prev,
      [dateStr]: {
        ...(prev[dateStr] || defaultDaySchedule),
        [field]: value,
      },
    }))
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const copyFromPreviousMonth = async (isCreating = false) => {
    const prevDate = new Date(currentDate)
    prevDate.setMonth(currentDate.getMonth() - 1)
    const prevMonth = prevDate.getMonth() + 1
    const prevYear = prevDate.getFullYear()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("schedules")
        .select("schedule_data")
        .eq("user_id", user.id)
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
        setSchedule(data.schedule_data as MonthlySchedule)
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
      color: "text-green-600",
    }
  }

  const days = getDaysInMonth()
  const saveStatus = getSaveStatus()
  const SaveStatusIcon = saveStatus.icon

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Schedule</h1>
          <p className="text-muted-foreground">Set individual opening hours for each day</p>
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
              className={hasUnsavedChanges ? "bg-primary" : ""}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : hasUnsavedChanges ? "Save Changes" : "Save Schedule"}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-xl">
              {monthNames[currentDate.getMonth()]} {currentYear}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>Set opening hours for each individual day</CardDescription>
        </CardHeader>
      </Card>

      {scheduleExists && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Public Sharing
            </CardTitle>
            <CardDescription>Allow customers to view your schedule with a public link</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                <Label htmlFor="public-toggle">Make schedule public</Label>
              </div>
              <Switch id="public-toggle" checked={isPublic} onCheckedChange={setIsPublic} />
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

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="text-muted-foreground">Loading schedule...</div>
            </div>
          </CardContent>
        </Card>
      ) : !scheduleExists ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No Schedule Found</h3>
                <p className="text-muted-foreground">
                  No schedule exists for {monthNames[currentDate.getMonth()]} {currentYear}
                </p>
              </div>

              {!showCreateOptions ? (
                <Button onClick={createNewSchedule} size="lg">
                  Create Schedule
                </Button>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">How would you like to create your schedule?</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={() => copyFromPreviousMonth(true)} variant="outline">
                      Copy from Previous Month
                    </Button>
                    <Button onClick={createFromDefaults}>Start with Default Hours</Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateOptions(false)}
                    className="text-muted-foreground"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {dayNames.map((dayName) => (
                <div key={dayName} className="text-center text-sm font-medium text-muted-foreground p-2">
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
                  <Card key={day.dateStr} className={`${isToday ? "ring-2 ring-primary" : ""}`}>
                    <CardContent className="p-3 space-y-3">
                      <div className="text-center">
                        <div className="font-medium text-sm">{day.day}</div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-center">
                          <Switch
                            checked={!daySchedule.closed}
                            onCheckedChange={(checked) => updateDaySchedule(day.dateStr, "closed", !checked)}
                            size="sm"
                          />
                        </div>

                        {!daySchedule.closed && (
                          <div className="space-y-2">
                            <div>
                              <Label className="text-xs">Open</Label>
                              <Input
                                type="time"
                                value={daySchedule.open}
                                onChange={(e) => updateDaySchedule(day.dateStr, "open", e.target.value)}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Close</Label>
                              <Input
                                type="time"
                                value={daySchedule.close}
                                onChange={(e) => updateDaySchedule(day.dateStr, "close", e.target.value)}
                                className="h-8 text-xs"
                              />
                            </div>

                            <div className="border-t pt-2 space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs">Break</Label>
                                <Switch
                                  checked={daySchedule.hasBreak}
                                  onCheckedChange={(checked) => updateDaySchedule(day.dateStr, "hasBreak", checked)}
                                  size="sm"
                                />
                              </div>

                              {daySchedule.hasBreak && (
                                <div className="space-y-2">
                                  <div>
                                    <Label className="text-xs">Break Start</Label>
                                    <Input
                                      type="time"
                                      value={daySchedule.breakStart}
                                      onChange={(e) => updateDaySchedule(day.dateStr, "breakStart", e.target.value)}
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Break End</Label>
                                    <Input
                                      type="time"
                                      value={daySchedule.breakEnd}
                                      onChange={(e) => updateDaySchedule(day.dateStr, "breakEnd", e.target.value)}
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {daySchedule.closed && <div className="text-center text-xs text-muted-foreground">Closed</div>}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        url={publicSlug ? `${window.location.origin}/${publicSlug}` : ""}
        businessName="Business Schedule"
      />
    </div>
  )
}
