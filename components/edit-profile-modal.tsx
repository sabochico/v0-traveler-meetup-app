"use client"

import { useEffect, useState, useRef } from "react"
import { X, Camera, Loader2, Plus, Check, Navigation } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useUpdateProfile } from "@/hooks/use-profile"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import type { Profile } from "@/lib/types"
import { getNextProfileRequirement, isProfileComplete, MIN_BIO_LENGTH, MIN_INTERESTS } from "@/lib/profile-completion"
import { detectCurrentLocation, type DetectedLocation } from "@/lib/location"

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(",")[1] ?? "")
    }
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

const SUGGESTED_LANGUAGES = [
  "English", "Japanese", "Spanish", "French", "Deutsch",
  "Chinese", "Korean", "Portuguese", "Italiano", "Nederlands"
]

const SUGGESTED_INTERESTS = [
  "Photography", "Coffee", "Food", "Art", "Music", "Reading",
  "Hiking", "Gaming", "Travel", "Writing", "Coding", "Film",
  "Fitness", "Cooking", "Languages", "History", "Nature", "Tech"
]

interface EditProfileModalProps {
  profile: Profile
  isOpen: boolean
  onClose: () => void
  initialTab?: "profile" | "languages" | "interests"
  setupMode?: boolean
}

export function EditProfileModal({ profile, isOpen, onClose, initialTab = "profile", setupMode = false }: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? "")
  const [bio, setBio] = useState(profile.bio ?? "")
  const [currentCity, setCurrentCity] = useState(profile.current_city ?? "")
  const [currentCountry, setCurrentCountry] = useState(profile.current_country ?? "")
  const [detectedLocation, setDetectedLocation] = useState<DetectedLocation | null>(null)
  const [languages, setLanguages] = useState<string[]>(profile.languages ?? [])
  const [interests, setInterests] = useState<string[]>(profile.interests ?? [])
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url)
  const [instagramHandle, setInstagramHandle] = useState(profile.instagram_handle ?? "")
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [activeTab, setActiveTab] = useState<"profile" | "languages" | "interests">("profile")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const locationPromptedRef = useRef(false)
  const { updateProfile } = useUpdateProfile()
  const { toast } = useToast()
  const draftProfile = {
    ...profile,
    display_name: displayName,
    bio,
    current_city: currentCity,
    current_country: currentCountry,
    languages,
    interests,
    avatar_url: avatarUrl,
    instagram_handle: instagramHandle,
  }
  const canSave = !setupMode || isProfileComplete(draftProfile)

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab)
  }, [isOpen, initialTab])

  useEffect(() => {
    if (!isOpen || !setupMode || currentCity || locationPromptedRef.current) return
    locationPromptedRef.current = true
    handleDetectLocation()
  }, [isOpen, setupMode, currentCity])

  const handleDetectLocation = async () => {
    setDetectingLocation(true)
    try {
      const detected = await detectCurrentLocation()
      setCurrentCity(detected.city)
      setCurrentCountry(detected.country)
      setDetectedLocation(detected)
    } catch (error) {
      console.error("Failed to detect location:", error)
      toast({
        title: "Could not detect your location",
        description: "Please enter your city manually.",
        variant: "destructive",
      })
    } finally {
      setDetectingLocation(false)
    }
  }

  if (!isOpen) return null

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Photo is too large",
        description: "Please choose an image under 5MB.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    const previousAvatarUrl = avatarUrl
    const previewUrl = URL.createObjectURL(file)
    setAvatarUrl(previewUrl)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error("Please sign in to upload a photo")
      }

      const fileBase64 = await readFileAsBase64(file)

      const response = await fetch("/api/upload", {
        method: "POST",
        redirect: "manual",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          file: fileBase64,
          fileName: file.name,
          contentType: file.type,
        }),
      })

      if (response.status >= 300 && response.status < 400) {
        throw new Error("Session expired. Please sign in again.")
      }

      const responseText = await response.text()

      if (!response.ok) {
        let errorMessage = "Upload failed"
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = responseText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const data = JSON.parse(responseText)
      setAvatarUrl(data.url)
    } catch (error) {
      console.error("Upload error:", error)
      setAvatarUrl(previousAvatarUrl)
      toast({
        title: "Photo upload failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      URL.revokeObjectURL(previewUrl)
      e.target.value = ""
      setUploading(false)
    }
  }

  const toggleLanguage = (language: string) => {
    setLanguages((prev) =>
      prev.includes(language) ? prev.filter((l) => l !== language) : [...prev, language]
    )
  }

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    )
  }

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      await updateProfile({
        display_name: displayName || null,
        bio: bio || null,
        current_city: currentCity || null,
        current_country: currentCountry || null,
        current_region: detectedLocation?.region ?? null,
        latitude: detectedLocation?.latitude ?? null,
        longitude: detectedLocation?.longitude ?? null,
        location_source: detectedLocation ? "gps" : "manual",
        location_updated_at: new Date().toISOString(),
        languages,
        interests,
        avatar_url: avatarUrl,
        instagram_handle: instagramHandle.trim().replace(/^@/, "") || null,
      })
      onClose()
    } catch (error) {
      console.error("Failed to update profile:", error)
      toast({
        title: "Profile was not saved",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={setupMode ? undefined : onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card rounded-t-3xl sm:rounded-2xl max-h-[calc(100dvh-1rem)] sm:max-h-[90dvh] overflow-hidden flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div>
            <h2 className="text-lg font-semibold">{setupMode ? "Complete your profile" : "Edit Profile"}</h2>
            {setupMode && (
              <p className="text-xs text-muted-foreground mt-1">{getNextProfileRequirement(draftProfile)}</p>
            )}
          </div>
          {!setupMode && (
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/50">
          {(["profile", "languages", "interests"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                activeTab === tab
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          {activeTab === "profile" && (
            <div className="space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Avatar className="w-24 h-24 ring-4 ring-primary/20">
                    <AvatarImage
                      src={avatarUrl ?? undefined}
                      alt={displayName || "Profile"}
                    />
                    <AvatarFallback>
                      {(displayName || "U")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="avatar-file-input"
                    className={cn(
                      "absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:glow-amber transition-all cursor-pointer",
                      uploading && "opacity-50 pointer-events-none"
                    )}
                    aria-label="Change photo"
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </label>
                  <input
                    id="avatar-file-input"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {uploading ? "Uploading..." : "Tap to change photo"}
                </p>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Display Name</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="bg-secondary border-0"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell others about yourself..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground text-right">{bio.length}/200</p>
                {setupMode && bio.trim().length < MIN_BIO_LENGTH && (
                  <p className="text-xs text-primary">Minimum {MIN_BIO_LENGTH} characters.</p>
                )}
              </div>

              {/* Location */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={detectingLocation}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-60"
                >
                  {detectingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                  {detectingLocation ? "Detecting location..." : "Use my current location"}
                </button>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">City</label>
                    <Input
                      value={currentCity}
                      onChange={(e) => {
                        setCurrentCity(e.target.value)
                        setDetectedLocation(null)
                      }}
                      placeholder="Tokyo"
                      className="bg-secondary border-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Country</label>
                    <Input
                      value={currentCountry}
                      onChange={(e) => {
                        setCurrentCountry(e.target.value)
                        setDetectedLocation(null)
                      }}
                      placeholder="Japan"
                      className="bg-secondary border-0"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Instagram</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                  <Input
                    value={instagramHandle}
                    onChange={(e) => setInstagramHandle(e.target.value)}
                    placeholder="yourusername"
                    className="bg-secondary border-0 pl-8"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "languages" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select the languages you speak. This helps other travelers find you.
              </p>

              {/* Selected languages */}
              {languages.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Your Languages</label>
                  <div className="flex flex-wrap gap-2">
                    {languages.map((lang) => (
                      <Badge
                        key={lang}
                        variant="default"
                        className="min-h-10 cursor-pointer flex items-center gap-1 px-3 py-2"
                        onClick={() => toggleLanguage(lang)}
                      >
                        {lang}
                        <X className="w-3 h-3" />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested languages */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Add Languages</label>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_LANGUAGES.filter((l) => !languages.includes(l)).map((lang) => (
                    <Badge
                      key={lang}
                      variant="outline"
                      className="min-h-10 cursor-pointer px-3 py-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => toggleLanguage(lang)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "interests" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select at least {MIN_INTERESTS} interests to connect with like-minded travelers.
              </p>

              {/* Selected interests */}
              {interests.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Your Interests</label>
                  <div className="flex flex-wrap gap-2">
                    {interests.map((interest) => (
                      <Badge
                        key={interest}
                        variant="default"
                        className="min-h-10 cursor-pointer flex items-center gap-1 px-3 py-2"
                        onClick={() => toggleInterest(interest)}
                      >
                        {interest}
                        <X className="w-3 h-3" />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested interests */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Add Interests</label>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_INTERESTS.filter((i) => !interests.includes(i)).map((interest) => (
                    <Badge
                      key={interest}
                      variant="outline"
                      className="min-h-10 cursor-pointer px-3 py-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => toggleInterest(interest)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-border/50 bg-card">
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:glow-amber transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {setupMode ? "Complete Profile" : "Save Changes"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
