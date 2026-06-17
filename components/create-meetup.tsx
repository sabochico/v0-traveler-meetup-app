"use client"

import { useState, useEffect, useRef } from "react"
import { MapPin, Clock, Coffee, Camera, Utensils, Moon, BookOpen, Gamepad2, Map, Sparkles, Loader2 } from "lucide-react"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useCreateMeetup } from "@/hooks/use-meetups"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface CreateMeetupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface CityResult {
  id: number
  name: string
  country: string
  admin1?: string
  latitude: number
  longitude: number
}

const MEETUP_TYPES = [
  { id: "coffee", label: "Coffee", icon: Coffee },
  { id: "food", label: "Food Adventure", icon: Utensils },
  { id: "photo", label: "Photography", icon: Camera },
  { id: "walk", label: "Night Walk", icon: Moon },
  { id: "study", label: "Study Session", icon: BookOpen },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "explore", label: "Exploring", icon: Map },
]

const TIME_OPTIONS = [
  { label: "Now", value: 0 },
  { label: "In 1 hour", value: 1 },
  { label: "Tonight", value: 6 },
  { label: "Tomorrow", value: 24 },
]

const CAPACITY_OPTIONS = [1, 2, 4, 6, 8, 12, 20]

function formatCityLabel(s: CityResult): string {
  return `${s.name}, ${s.country}`
}

export function CreateMeetup({ open, onOpenChange }: CreateMeetupProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [location, setLocation] = useState("")
  const [selectedTime, setSelectedTime] = useState<number>(0)
  const [capacity, setCapacity] = useState(4)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null)

  const [citySuggestions, setCitySuggestions] = useState<CityResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isCitySearching, setIsCitySearching] = useState(false)
  const [cityData, setCityData] = useState<{ city: string; region?: string; country?: string; latitude?: number; longitude?: number } | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const coverInputRef = useRef<HTMLInputElement | null>(null)

  const { createMeetup } = useCreateMeetup()

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl)
    }
  }, [coverPreviewUrl])

  // Debounced city search via Open-Meteo geocoding
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (location.trim().length < 2) {
      setCitySuggestions([])
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsCitySearching(true)
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=8&language=en&format=json`
        )
        const json = await res.json()
        const results: CityResult[] = json.results ?? []
        const seen = new Set<string>()
        const unique = results.filter((s) => {
          const key = `${s.name},${s.country}`
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        setCitySuggestions(unique)
        setShowDropdown(unique.length > 0)
      } catch {
        setCitySuggestions([])
        setShowDropdown(false)
      } finally {
        setIsCitySearching(false)
      }
    }, 300)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [location])

  const handleLocationChange = (value: string) => {
    setLocation(value)
    setCityData(null) // clear structured data when typing manually
  }

  const handleSelectCity = (suggestion: CityResult) => {
    setLocation(formatCityLabel(suggestion))
    setCityData({
      city: suggestion.name,
      region: suggestion.admin1,
      country: suggestion.country,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    })
    setCitySuggestions([])
    setShowDropdown(false)
  }

  const handleCoverChange = (file: File | null) => {
    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl)
    setCoverFile(null)
    setCoverPreviewUrl(null)

    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Cover photo must be an image.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Cover photo must be less than 5MB.")
      return
    }

    setError(null)
    setCoverFile(file)
    setCoverPreviewUrl(URL.createObjectURL(file))
  }

  const uploadCoverImage = async () => {
    if (!coverFile) return null

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error("Please sign in to upload a cover photo.")

    const formData = new FormData()
    formData.append("file", coverFile)
    formData.append("purpose", "meetup-cover")

    const response = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: formData,
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error ?? "Cover photo upload failed")
    return data.url as string
  }

  const handleSubmit = async () => {
    const trimmedTitle = title.trim()
    const trimmedLocation = location.trim()
    if (!selectedType || !trimmedTitle || !trimmedLocation) return

    setLoading(true)
    setError(null)

    try {
      const startsAt = new Date()
      startsAt.setHours(startsAt.getHours() + selectedTime)
      const coverImageUrl = await uploadCoverImage()

      await createMeetup({
        title: trimmedTitle.slice(0, 140),
        category: selectedType,
        location_name: trimmedLocation,
        city: cityData?.city ?? trimmedLocation.split(",")[0]?.trim(),
        region: cityData?.region,
        country: cityData?.country,
        latitude: cityData?.latitude,
        longitude: cityData?.longitude,
        max_attendees: capacity,
        starts_at: startsAt.toISOString(),
        cover_image_url: coverImageUrl,
      })

      onOpenChange(false)
      setSelectedType(null)
      setTitle("")
      setLocation("")
      setSelectedTime(0)
      setCapacity(4)
      setCityData(null)
      setCoverFile(null)
      setCoverPreviewUrl(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create meetup")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="top-auto bottom-0 translate-y-0 sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2 w-full max-w-none sm:max-w-md max-h-dvh sm:max-h-[90dvh] bg-card border-border px-0 pb-0 pt-[calc(max(env(safe-area-inset-top),44px)+12px)] sm:p-0 gap-0 rounded-none sm:rounded-lg overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0 border-b border-border/50 px-6 pb-4 pt-0 sm:pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 text-left">
              <DialogTitle className="text-xl font-serif">Create a meetup</DialogTitle>
              <p className="mt-1 text-sm text-muted-foreground">Find someone to share a moment with</p>
            </div>
            <DialogClose className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground active:scale-95" aria-label="Close create meetup">
              <span className="text-2xl leading-none">&times;</span>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 pb-8 space-y-5">
          {/* Meetup Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">What kind of meetup?</label>
            <div className="grid grid-cols-4 gap-2">
              {MEETUP_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={cn(
                    "flex min-h-16 flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-all duration-300",
                    selectedType === type.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  <type.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium text-center leading-tight">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Capacity */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Group size</label>
            <div className="flex flex-wrap gap-2">
              {CAPACITY_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCapacity(option)}
                  className={cn(
                    "min-h-11 rounded-full px-4 text-sm font-medium transition-colors",
                    capacity === option
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {option === 1 ? "1-on-1" : option}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Cover Photo */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-foreground">Cover photo</label>
              <span className="text-xs text-muted-foreground">Optional</span>
            </div>
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border/60 bg-secondary text-left transition-colors hover:bg-secondary/80"
            >
              {coverPreviewUrl ? (
                <img src={coverPreviewUrl} alt="Meetup cover preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Camera className="h-6 w-6" />
                  <span className="text-sm font-medium">Add your own cover</span>
                  <span className="text-xs">Otherwise Drift picks one for you</span>
                </div>
              )}
              {coverPreviewUrl && (
                <span className="absolute bottom-3 left-3 rounded-full bg-background/75 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
                  Change photo
                </span>
              )}
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handleCoverChange(event.target.files?.[0] ?? null)}
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Your invite</label>
            <Textarea
              placeholder="Anyone want to grab coffee in Shibuya?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-secondary border-0 resize-none min-h-[80px] text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Location with city autocomplete */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
              <Input
                placeholder="Shibuya, Tokyo"
                value={location}
                onChange={(e) => handleLocationChange(e.target.value)}
                onFocus={() => citySuggestions.length > 0 && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                className="bg-secondary border-0 pl-10 text-foreground placeholder:text-muted-foreground"
              />

              {/* Dropdown */}
              {(showDropdown || isCitySearching) && location.trim().length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl border border-border/80 bg-card shadow-xl overflow-hidden">
                  {isCitySearching ? (
                    <div className="flex items-center justify-center py-3">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    citySuggestions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectCity(s)}
                        className="w-full min-h-11 flex items-center gap-2.5 px-4 py-3 text-left hover:bg-secondary transition-colors border-b border-border/30 last:border-0"
                      >
                        <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="text-sm text-foreground truncate">{formatCityLabel(s)}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Time Options */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">When?</label>
            <div className="flex gap-2">
              {TIME_OPTIONS.map((time) => (
                <button
                  key={time.label}
                  onClick={() => setSelectedTime(time.value)}
                  className={cn(
                    "flex min-h-11 items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-colors",
                    selectedTime === time.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {time.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="shrink-0 border-t border-border/50 bg-card px-6 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4">
          <button
            onClick={handleSubmit}
            disabled={!selectedType || !title || !location || loading}
            className={cn(
              "w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
              selectedType && title && location && !loading
                ? "bg-primary text-primary-foreground glow-amber"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            )}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Post Meetup
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
