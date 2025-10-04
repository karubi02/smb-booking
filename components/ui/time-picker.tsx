"use client"

import * as React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TimePickerProps {
  value: string // Format: "HH:MM"
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
}

// Move arrays outside component to avoid recreating on every render
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))
const MINUTES = ["00", "15", "30", "45"]

export function TimePicker({ value, onChange, className, disabled }: TimePickerProps) {
  const [hour, minute] = value.split(":")

  const handleHourChange = (newHour: string) => {
    const formattedHour = newHour.padStart(2, "0")
    onChange(`${formattedHour}:${minute}`)
  }

  const handleMinuteChange = (newMinute: string) => {
    onChange(`${hour}:${newMinute}`)
  }

  return (
    <div className={`flex gap-1 ${className}`}>
      <Select value={hour} onValueChange={handleHourChange} disabled={disabled}>
        <SelectTrigger className="h-8 w-16 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {HOURS.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <span className="flex items-center text-xs text-muted-foreground">:</span>
      
      <Select value={minute} onValueChange={handleMinuteChange} disabled={disabled}>
        <SelectTrigger className="h-8 w-16 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MINUTES.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
