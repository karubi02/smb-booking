"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { ImageUpload } from "./image-upload"

interface SettingsFormProps {
  initialData: {
    display_name: string
    business_name?: string
    email: string
    phone?: string
    logo_url?: string
    banner_url?: string
  }
  userId: string
}

export function SettingsForm({ initialData, userId }: SettingsFormProps) {
  const [displayName, setDisplayName] = useState(initialData.display_name)
  const [businessName, setBusinessName] = useState(initialData.business_name || "")
  const [phone, setPhone] = useState(initialData.phone || "")
  const [logoUrl, setLogoUrl] = useState(initialData.logo_url || "")
  const [bannerUrl, setBannerUrl] = useState(initialData.banner_url || "")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      console.log("🔄 Updating profile with:", {
        display_name: displayName,
        business_name: businessName,
        phone: phone,
        logo_url: logoUrl,
        banner_url: bannerUrl,
        userId: userId
      })

      // Update the profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          display_name: displayName,
          business_name: businessName,
          phone: phone,
          logo_url: logoUrl,
          banner_url: bannerUrl
        })
        .eq("id", userId)

      if (profileError) {
        console.error("❌ Profile update error:", profileError)
        throw profileError
      }

      console.log("✅ Profile updated successfully")

      // Update the auth.users table
      const { error: authError } = await supabase.auth.updateUser({
        data: { display_name: displayName },
      })

      if (authError) throw authError

      toast({
        title: "Settings updated",
        description: "Your profile settings have been updated successfully.",
      })
    } catch (error) {
      console.error("❌ Error updating settings:", error)
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const hasChanges = 
    displayName !== initialData.display_name || 
    businessName !== (initialData.business_name || "") ||
    phone !== (initialData.phone || "") ||
    logoUrl !== (initialData.logo_url || "") ||
    bannerUrl !== (initialData.banner_url || "")

  // Auto-save function for image uploads
  const handleAutoSave = async () => {
    const supabase = createClient()
    
    console.log("💾 Auto-saving profile with:", {
      display_name: displayName,
      business_name: businessName,
      phone: phone,
      logo_url: logoUrl,
      banner_url: bannerUrl,
      userId: userId
    })

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ 
        display_name: displayName,
        business_name: businessName,
        phone: phone,
        logo_url: logoUrl,
        banner_url: bannerUrl
      })
      .eq("id", userId)

    if (profileError) {
      console.error("❌ Auto-save profile error:", profileError)
      throw profileError
    }

    console.log("✅ Profile auto-saved successfully")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Image Uploads Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <ImageUpload
          title="Business Logo"
          description="Upload your business logo to display on your public schedule"
          currentImageUrl={logoUrl}
          onImageUploaded={setLogoUrl}
          onAutoSave={handleAutoSave}
          recommendedSize="75x75px, PNG or JPG"
          aspectRatio="1:1"
        />
        
        <ImageUpload
          title="Banner Image"
          description="Upload a banner image for your public schedule page"
          currentImageUrl={bannerUrl}
          onImageUploaded={setBannerUrl}
          onAutoSave={handleAutoSave}
          recommendedSize="800x200px, PNG or JPG"
          aspectRatio="16:9"
        />
      </div>

      {/* Basic Information */}
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="display_name" className="text-sm font-medium">Display Name</Label>
          <Input
            id="display_name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your display name"
            disabled={isLoading}
            className="h-12 placeholder:text-slate-400"
          />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This is how your name will appear to customers viewing your schedule.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="business_name" className="text-sm font-medium">Business Name</Label>
          <Input
            id="business_name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Enter your business name"
            disabled={isLoading}
            className="h-12 placeholder:text-slate-400"
          />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This is the name of your business that will be shown on your public schedule.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            disabled={isLoading}
            className="h-12 placeholder:text-slate-400"
          />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Your contact phone number for customer inquiries.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
          <Input 
            id="email" 
            value={initialData.email} 
            disabled 
            className="h-12 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400" 
          />
          <p className="text-sm text-slate-600 dark:text-slate-400">Email address cannot be changed from this page.</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={!hasChanges || isLoading} 
          className="min-w-[120px] h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
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
