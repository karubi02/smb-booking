"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

interface SettingsFormProps {
  initialData: {
    display_name: string
    email: string
  }
  userId: string
}

export function SettingsForm({ initialData, userId }: SettingsFormProps) {
  const [displayName, setDisplayName] = useState(initialData.display_name)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      // Update the profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", userId)

      if (profileError) throw profileError

      // Update the auth.users table
      const { error: authError } = await supabase.auth.updateUser({
        data: { display_name: displayName },
      })

      if (authError) throw authError

      toast({
        title: "Settings updated",
        description: "Your display name has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating settings:", error)
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const hasChanges = displayName !== initialData.display_name

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="display_name">Display Name</Label>
        <Input
          id="display_name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Enter your display name"
          disabled={isLoading}
        />
        <p className="text-sm text-muted-foreground">
          This is how your name will appear to customers viewing your schedule.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input id="email" value={initialData.email} disabled className="bg-muted" />
        <p className="text-sm text-muted-foreground">Email address cannot be changed from this page.</p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!hasChanges || isLoading} className="min-w-[100px]">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  )
}
