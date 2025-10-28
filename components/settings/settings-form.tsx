"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Check, X, Eye, EyeOff } from "lucide-react"
import { ImageUpload } from "./image-upload"

interface SettingsFormProps {
  initialData: {
    display_name: string
    business_name?: string
    email: string
    phone?: string
    logo_url?: string
    banner_url?: string
    public_slug?: string
  }
  userId: string
}

export function SettingsForm({ initialData, userId }: SettingsFormProps) {
  const [displayName, setDisplayName] = useState(initialData.display_name)
  const [businessName, setBusinessName] = useState(initialData.business_name || "")
  const [publicSlug, setPublicSlug] = useState(initialData.public_slug || "")
  const [phone, setPhone] = useState(initialData.phone || "")
  const [logoUrl, setLogoUrl] = useState(initialData.logo_url || "")
  const [bannerUrl, setBannerUrl] = useState(initialData.banner_url || "")
  const [isLoading, setIsLoading] = useState(false)
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  
  // Slug validation states
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [slugError, setSlugError] = useState<string | null>(null)
  
  const { toast } = useToast()

  // Debounced slug validation
  useEffect(() => {
    // If slug is empty or same as original, don't validate
    if (!publicSlug.trim() || publicSlug === initialData.public_slug) {
      setSlugStatus('idle')
      setSlugError(null)
      return
    }

    const timeoutId = setTimeout(async () => {
      setSlugStatus('checking')
      setSlugError(null)

      try {
        const response = await fetch(`/api/check-slug?slug=${encodeURIComponent(publicSlug)}`)
        const data = await response.json()

        if (data.error) {
          setSlugStatus('invalid')
          setSlugError(data.error)
        } else if (data.available) {
          setSlugStatus('available')
          setSlugError(null)
        } else {
          setSlugStatus('taken')
          setSlugError('This slug is already taken')
        }
      } catch (error) {
        setSlugStatus('invalid')
        setSlugError('Error checking slug availability')
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [publicSlug, initialData.public_slug])

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields.",
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      })
      return
    }

    setIsChangingPassword(true)

    try {
      const supabase = createClient()
      
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      // Clear password fields
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      })
    } catch (error) {
      console.error("Error changing password:", error)
      toast({
        title: "Error",
        description: "Failed to change password. Please check your current password.",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Determine the slug to use - if empty, use original; if changed, validate
    const slugToUse = publicSlug.trim() || initialData.public_slug || ""
    
    // Prevent saving if slug is blank and there was no original slug
    if (!slugToUse) {
      toast({
        title: "Error",
        description: "Public slug cannot be blank. Please enter a valid slug.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    // Validate slug if it has changed from original
    if (publicSlug.trim() !== initialData.public_slug && slugStatus !== 'available') {
      toast({
        title: "Error",
        description: "Please enter a valid and available slug.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      console.log("🔄 Updating profile with:", {
        display_name: displayName,
        business_name: businessName,
        public_slug: slugToUse,
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
          public_slug: slugToUse,
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
    (publicSlug.trim() && publicSlug.trim() !== (initialData.public_slug || "")) ||
    phone !== (initialData.phone || "") ||
    logoUrl !== (initialData.logo_url || "") ||
    bannerUrl !== (initialData.banner_url || "")

  // Auto-save function for image uploads
  const handleAutoSave = async () => {
    const supabase = createClient()
    
    // Determine the slug to use - if empty, use original
    const slugToUse = publicSlug.trim() || initialData.public_slug || ""
    
    console.log("💾 Auto-saving profile with:", {
      display_name: displayName,
      business_name: businessName,
      public_slug: slugToUse,
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
        public_slug: slugToUse,
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
          <Label htmlFor="public_slug" className="text-sm font-medium">Public Slug</Label>
          <div className="relative">
            <Input
              id="public_slug"
              value={publicSlug}
              onChange={(e) => setPublicSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="your-business-slug"
              disabled={isLoading}
              className={`h-12 placeholder:text-slate-400 pr-10 ${
                slugStatus === 'available' ? 'border-green-500 focus:border-green-500' :
                slugStatus === 'taken' || slugStatus === 'invalid' ? 'border-red-500 focus:border-red-500' :
                ''
              }`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {slugStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
              {slugStatus === 'available' && <Check className="h-4 w-4 text-green-500" />}
              {(slugStatus === 'taken' || slugStatus === 'invalid') && <X className="h-4 w-4 text-red-500" />}
            </div>
          </div>
          {slugError && (
            <p className="text-sm text-red-600">{slugError}</p>
          )}
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {`Your public schedule URL: ${
              typeof window !== "undefined" ? window.location.origin : ""
            }/${publicSlug.trim() || initialData.public_slug || "your-slug"}`}
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
