"use client"

import React, { useRef, useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Camera, Loader2, Trash2, Upload } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import baseUrl from "@/utils/base-urls"

export const getFullPhotoUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url
  }
  const cleanBase = baseUrl.serverUrl ? baseUrl.serverUrl.replace(/\/+$/, "") : ""
  const cleanPath = url.replace(/^\/+/, "")
  return `${cleanBase}/${cleanPath}`
}

export const getSafePdfImageUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined
  if (url.startsWith("data:") || url.startsWith("blob:")) {
    return url
  }
  const cleanBase = baseUrl.serverUrl ? baseUrl.serverUrl.replace(/\/+$/, "") : ""
  return `${cleanBase}/api/v1/storage/proxy-image?url=${encodeURIComponent(url)}`
}

interface AvatarUploadProps {
  currentPhotoUrl?: string | null
  fallbackText?: string
  altText?: string
  size?: "sm" | "md" | "lg" | "xl"
  editable?: boolean
  onUpload?: (file: File) => Promise<any>
  onDelete?: () => Promise<any>
  className?: string
}

const sizeClasses = {
  sm: "h-16 w-16 text-lg",
  md: "h-24 w-24 text-2xl",
  lg: "h-32 w-32 text-4xl",
  xl: "h-40 w-40 text-5xl",
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentPhotoUrl,
  fallbackText = "U",
  altText = "Profile Photo",
  size = "lg",
  editable = true,
  onUpload,
  onDelete,
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    setPreviewUrl(null)
  }, [currentPhotoUrl])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate type
    if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please select a JPG, PNG, or WebP image.",
      })
      return
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Image size must be less than 5MB.",
      })
      return
    }

    // Local preview immediately
    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)

    if (onUpload) {
      try {
        setIsUploading(true)
        await onUpload(file)
        toast({
          title: "Photo Updated",
          description: "Profile photo uploaded and saved successfully.",
        })
      } catch (err: any) {
        console.error("Upload error:", err)
        setPreviewUrl(null)
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: err?.data?.message || err?.message || "Failed to upload photo",
        })
      } finally {
        setIsUploading(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onDelete) return

    try {
      setIsUploading(true)
      await onDelete()
      setPreviewUrl(null)
      toast({
        title: "Photo Removed",
        description: "Profile photo removed successfully.",
      })
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to remove photo",
        description: err?.data?.message || err?.message || "Error removing photo",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const activePhoto = previewUrl || getFullPhotoUrl(currentPhotoUrl)

  return (
    <div className={cn("relative group inline-block", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading || !editable}
      />

      <Avatar
        className={cn(
          "border-4 border-background shadow-lg transition-transform",
          sizeClasses[size],
          editable && "cursor-pointer hover:opacity-90"
        )}
        onClick={() => editable && !isUploading && fileInputRef.current?.click()}
      >
        <AvatarImage src={activePhoto || undefined} alt={altText} className="object-cover" />
        <AvatarFallback className="bg-primary/10 font-bold uppercase">
          {fallbackText}
        </AvatarFallback>
      </Avatar>

      {/* Loading Overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm z-10">
          <Loader2 className="h-8 w-8 text-white animate-spin" />
        </div>
      )}

      {/* Hover Camera Overlay on Desktop */}
      {editable && !isUploading && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-[2px]"
        >
          <Camera className="h-6 w-6 text-white mb-1" />
          <span className="text-[10px] font-semibold text-white tracking-wide uppercase">
            Change
          </span>
        </div>
      )}

      {/* Corner Action Buttons */}
      {editable && !isUploading && (
        <div className="absolute -bottom-1 -right-1 flex gap-1 z-10">
          <button
            type="button"
            title="Upload photo"
            onClick={(e) => {
              e.stopPropagation()
              fileInputRef.current?.click()
            }}
            className="h-8 w-8 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 flex items-center justify-center border-2 border-background transition-transform active:scale-95"
          >
            <Camera className="h-4 w-4" />
          </button>

          {activePhoto && onDelete && (
            <button
              type="button"
              title="Remove photo"
              onClick={handleDelete}
              className="h-8 w-8 rounded-full bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90 flex items-center justify-center border-2 border-background transition-transform active:scale-95"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
