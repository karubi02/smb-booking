"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"
import Image from "next/image"

interface ImageUploadProps {
  title: string
  description: string
  currentImageUrl?: string
  onImageUploaded: (url: string) => void
  onAutoSave?: () => Promise<void>
  recommendedSize: string
  aspectRatio?: string
  className?: string
}

export function ImageUpload({
  title,
  description,
  currentImageUrl,
  onImageUploaded,
  onAutoSave,
  recommendedSize,
  aspectRatio = "1:1",
  className = ""
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (PNG, JPG, or JPEG).",
        variant: "destructive",
      })
      return
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      const supabase = createClient()
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `uploads/${fileName}`

      // Upload file to Supabase storage
      const { data, error } = await supabase.storage
        .from('public-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('public-images')
        .getPublicUrl(filePath)

      setPreviewUrl(publicUrl)
      onImageUploaded(publicUrl)

      console.log("🖼️ Image uploaded successfully:", {
        fileName,
        filePath,
        publicUrl,
        title
      })

      // Auto-save to database if onAutoSave function is provided
      if (onAutoSave) {
        try {
          await onAutoSave()
          console.log("💾 Image URL auto-saved to database")
        } catch (error) {
          console.error("❌ Failed to auto-save image URL:", error)
        }
      }

      toast({
        title: "Image uploaded successfully",
        description: "Your image has been uploaded and saved.",
      })
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setPreviewUrl(null)
    onImageUploaded("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <Card className={`border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm ${className}`}>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          {/* Image Preview */}
          <div className={`relative ${aspectRatio === "16:9" ? "w-full max-w-md h-32" : "w-[75px] h-[75px]"} rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center overflow-hidden`}>
            {previewUrl ? (
              <>
                <Image
                  src={previewUrl}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes={aspectRatio === "16:9" ? "(max-width: 768px) 100vw, 50vw" : "75px"}
                />
                {!isUploading && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-gray-400" />
                )}
                {!isUploading && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">No image</span>
                )}
              </div>
            )}
          </div>

          {/* Upload Controls */}
          <div className="text-center space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUploadClick}
              disabled={isUploading}
              className="min-w-[120px]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-3 w-3" />
                  {previewUrl ? "Change Image" : "Upload Image"}
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Recommended: {recommendedSize}
            </p>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  )
}
