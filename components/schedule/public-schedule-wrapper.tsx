"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sun, Moon, Monitor } from "lucide-react"

interface PublicScheduleWrapperProps {
  children: React.ReactNode
}

export function PublicScheduleWrapper({ children }: PublicScheduleWrapperProps) {
  const [isDevelopment, setIsDevelopment] = useState(false)
  const [forcedTheme, setForcedTheme] = useState<"light" | "dark" | "system">("system")
  const [mounted, setMounted] = useState(false)

  // Show development toggle only in development mode
  const showDevToggle = process.env.NODE_ENV === "development"

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    if (forcedTheme === "system") {
      setForcedTheme("dark")
    } else if (forcedTheme === "dark") {
      setForcedTheme("light")
    } else {
      setForcedTheme("system")
    }
  }

  const applyTheme = (theme: string) => {
    const root = document.documentElement
    console.log("Applying theme:", theme) // Debug log
    
    if (theme === "dark") {
      root.classList.add("dark")
      console.log("Added dark class") // Debug log
    } else if (theme === "light") {
      root.classList.remove("dark")
      console.log("Removed dark class") // Debug log
    } else {
      // System theme
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      console.log("System prefers dark:", prefersDark) // Debug log
      if (prefersDark) {
        root.classList.add("dark")
      } else {
        root.classList.remove("dark")
      }
    }
  }

  useEffect(() => {
    if (mounted) {
      if (isDevelopment) {
        applyTheme(forcedTheme)
      } else {
        // Apply system theme when not in development
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        if (prefersDark) {
          document.documentElement.classList.add("dark")
        } else {
          document.documentElement.classList.remove("dark")
        }
      }
    }
  }, [mounted, isDevelopment, forcedTheme])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <div className={isDevelopment && forcedTheme === "dark" ? "dark" : ""}>
      {showDevToggle && (
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDevelopment(!isDevelopment)}
            className="bg-white/90 backdrop-blur-sm border-gray-300 dark:bg-gray-800 dark:border-gray-600"
          >
            {isDevelopment ? "Dev Mode" : "Normal"}
          </Button>
          {isDevelopment && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="bg-white/90 backdrop-blur-sm border-gray-300 dark:bg-gray-800 dark:border-gray-600"
              title={`Current: ${forcedTheme}`}
            >
              {forcedTheme === "system" && <Monitor className="w-4 h-4" />}
              {forcedTheme === "light" && <Sun className="w-4 h-4" />}
              {forcedTheme === "dark" && <Moon className="w-4 h-4" />}
            </Button>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
