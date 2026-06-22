"use client"

import { useState, useEffect, useRef } from "react"
import { Haptics, ImpactStyle } from "@capacitor/haptics"
import { MapPin, Clock, Coffee, Camera, Utensils, Moon, BookOpen, Gamepad2, Map, Sparkles, Loader2, Users } from "lucide-react"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useCreateMeetup } from "@/hooks/use-meetups"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { checkTextModeration, cleanUserText } from "@/lib/text-moderation"

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

const CAPACITY_OPTIONS = [
  { label: "1-on-1", helper: "Just two people", value: 1 },
  { label: "2-4 people", helper: "Small and easy", value: 4 },
  { label: "5-8 people", helper: "A friendly group", value: 8 },
  { label: "9-15 people", helper: "Social but manageable", value: 15 },
  { label: "15+ people", helper: "Open community plan", value: 20 },
]
const LOCATION_ERROR_MESSAGE = "Please enter a real venue, neighborhood, or city."
const LOW_QUALITY_LOCATIONS = new Set(["test", "testing", "asdf", "qwerty", "123", "abc"])
const BLOCKED_LOCATION_TERMS = [
  "boob",
  "boobs",
  "tits",
  "pussy",
  "dick",
  "cock",
  "penis",
  "vagina",
  "fuck",
  "shit",
  "bitch",
  "cunt",
]

const TIME_INTERVAL_MINUTES = 15

function formatCityLabel(s: CityResult): string {
  return `${s.name}, ${s.country}`
}

function isValidMeetupLocation(value: string) {
  const cleaned = cleanUserText(value)
  if (cleaned.length < 3) return false
  if (!/[a-zA-Z]/.test(cleaned)) return false
  if (LOW_QUALITY_LOCATIONS.has(cleaned.toLowerCase())) return false
  if (!checkTextModeration(cleaned, "meetup").ok) return false

  const normalized = cleaned
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
  const words = normalized.split(/[^a-z0-9]+/).filter(Boolean)
  return !BLOCKED_LOCATION_TERMS.some((term) => words.includes(term))
}

function getCapacityOption(value: number) {
  return CAPACITY_OPTIONS.find((option) => option.value === value) ?? CAPACITY_OPTIONS[1]
}

function triggerSelectionHaptic() {
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})
}

function pad(value: number) {
  return String(value).padStart(2, "0")
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function getDateFromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function getMinutesFromDate(date: Date) {
  return date.getHours() * 60 + date.getMinutes()
}

function buildStartDate(dateKey: string, minutes: number) {
  const date = getDateFromKey(dateKey)
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  return date
}

function roundUpToInterval(date: Date) {
  const rounded = new Date(date)
  const minutes = rounded.getMinutes()
  const nextMinutes = Math.ceil(minutes / TIME_INTERVAL_MINUTES) * TIME_INTERVAL_MINUTES
  rounded.setMinutes(nextMinutes, 0, 0)
  return rounded
}

function getDefaultStartDate() {
  const next = new Date()
  next.setMinutes(next.getMinutes() + TIME_INTERVAL_MINUTES)
  return roundUpToInterval(next)
}

function getWeekendDate() {
  const date = new Date()
  const day = date.getDay()
  const daysUntilWeekend = day === 0 ? 0 : (6 - day + 7) % 7
  date.setDate(date.getDate() + daysUntilWeekend)
  date.setHours(0, 0, 0, 0)
  return date
}

function getDatePresets() {
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)

  return [
    { label: "Today", dateKey: getDateKey(today) },
    { label: "Tomorrow", dateKey: getDateKey(tomorrow) },
    { label: "This weekend", dateKey: getDateKey(getWeekendDate()) },
  ]
}

function formatStartDate(date: Date) {
  const today = getDateKey(new Date())
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const dateLabel =
    getDateKey(date) === today
      ? "Today"
      : getDateKey(date) === getDateKey(tomorrow)
        ? "Tomorrow"
        : date.toLocaleDateString(undefined, { weekday: "short" })
  const timeLabel = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
  return `${dateLabel}, ${timeLabel}`
}

function getTimeOptions(dateKey: string) {
  const now = new Date()
  return Array.from({ length: (24 * 60) / TIME_INTERVAL_MINUTES }, (_, index) => index * TIME_INTERVAL_MINUTES).filter(
    (minutes) => buildStartDate(dateKey, minutes) > now
  )
}

function formatTimeOption(minutes: number) {
  const date = new Date()
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
}

export function CreateMeetup({ open, onOpenChange }: CreateMeetupProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [location, setLocation] = useState("")
  const [selectedStartAt, setSelectedStartAt] = useState(() => getDefaultStartDate())
  const [startTimeSheetOpen, setStartTimeSheetOpen] = useState(false)
  const [capacity, setCapacity] = useState(4)
  const [groupSizeSheetOpen, setGroupSizeSheetOpen] = useState(false)
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
  const selectedCapacity = getCapacityOption(capacity)
  const selectedDateKey = getDateKey(selectedStartAt)
  const selectedTimeMinutes = getMinutesFromDate(selectedStartAt)

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

  const handleCapacitySelect = (value: number) => {
    setCapacity(value)
    triggerSelectionHaptic()
  }

  const handleDateSelect = (dateKey: string) => {
    const preferredStart = buildStartDate(dateKey, selectedTimeMinutes)
    if (preferredStart > new Date()) {
      setSelectedStartAt(preferredStart)
    } else {
      const firstValidTime = getTimeOptions(dateKey)[0]
      if (firstValidTime != null) setSelectedStartAt(buildStartDate(dateKey, firstValidTime))
    }
    triggerSelectionHaptic()
  }

  const handleCustomDateChange = (value: string) => {
    if (value) handleDateSelect(value)
  }

  const handleTimeSelect = (minutes: number) => {
    const start = buildStartDate(selectedDateKey, minutes)
    if (start <= new Date()) return
    setSelectedStartAt(start)
    triggerSelectionHaptic()
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
    if (!isValidMeetupLocation(trimmedLocation)) {
      setError(LOCATION_ERROR_MESSAGE)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const startsAt = selectedStartAt > new Date() ? selectedStartAt : getDefaultStartDate()
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
      setSelectedStartAt(getDefaultStartDate())
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
            <button
              type="button"
              onClick={() => setGroupSizeSheetOpen(true)}
              aria-label={`Choose group size, currently ${selectedCapacity.label}`}
              className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-border/60 bg-secondary px-4 text-left transition-colors hover:bg-secondary/80 active:scale-[0.99]"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/12 text-primary">
                  <Users className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">{selectedCapacity.label}</span>
                  <span className="block text-xs text-muted-foreground">{selectedCapacity.helper}</span>
                </span>
              </span>
              <span className="text-sm font-medium text-primary">Change</span>
            </button>
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

          {/* Start Time */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Start time</label>
            <button
              type="button"
              onClick={() => setStartTimeSheetOpen(true)}
              aria-label={`Choose start time, currently ${formatStartDate(selectedStartAt)}`}
              className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-border/60 bg-secondary px-4 text-left transition-colors hover:bg-secondary/80 active:scale-[0.99]"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/12 text-primary">
                  <Clock className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">{formatStartDate(selectedStartAt)}</span>
                  <span className="block text-xs text-muted-foreground">Specific date and time</span>
                </span>
              </span>
              <span className="text-sm font-medium text-primary">Change</span>
            </button>
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

      <Sheet open={groupSizeSheetOpen} onOpenChange={setGroupSizeSheetOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto max-w-md rounded-t-[28px] border-border/70 bg-card/95 px-0 pb-[calc(env(safe-area-inset-bottom)+18px)] pt-3 shadow-2xl backdrop-blur-xl"
        >
          <SheetHeader className="px-6 pb-2 pt-6 text-left">
            <SheetTitle className="text-xl font-serif">Group size</SheetTitle>
            <p className="text-sm text-muted-foreground">Pick the feel of this meetup.</p>
          </SheetHeader>

          <div className="relative px-5 pb-2 pt-2">
            <div className="pointer-events-none absolute inset-x-5 top-1/2 h-16 -translate-y-1/2 rounded-2xl border border-primary/25 bg-primary/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" />
            <div
              className="relative max-h-80 snap-y snap-mandatory overflow-y-auto overscroll-contain py-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Group size options"
            >
              {CAPACITY_OPTIONS.map((option) => {
                const isSelected = capacity === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleCapacitySelect(option.value)}
                    aria-pressed={isSelected}
                    className={cn(
                      "relative flex min-h-16 w-full snap-center items-center justify-center rounded-2xl px-5 text-center transition-all duration-200",
                      isSelected ? "scale-100 text-foreground" : "scale-[0.96] text-muted-foreground"
                    )}
                  >
                    <span>
                      <span className={cn("block text-lg font-semibold", isSelected && "text-primary")}>
                        {option.label}
                      </span>
                      <span className="mt-0.5 block text-xs">{option.helper}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="px-6 pt-1">
            <button
              type="button"
              onClick={() => setGroupSizeSheetOpen(false)}
              className="min-h-12 w-full rounded-2xl bg-primary text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.99]"
            >
              Done
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={startTimeSheetOpen} onOpenChange={setStartTimeSheetOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto max-w-md rounded-t-[28px] border-border/70 bg-card/95 px-0 pb-[calc(env(safe-area-inset-bottom)+18px)] pt-3 shadow-2xl backdrop-blur-xl"
        >
          <SheetHeader className="px-6 pb-2 pt-6 text-left">
            <SheetTitle className="text-xl font-serif">Start time</SheetTitle>
            <p className="text-sm text-muted-foreground">Choose when people should meet.</p>
          </SheetHeader>

          <div className="space-y-4 px-5 pb-2 pt-2">
            <div className="grid grid-cols-3 gap-2">
              {getDatePresets().map((preset) => {
                const isSelected = selectedDateKey === preset.dateKey
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleDateSelect(preset.dateKey)}
                    aria-pressed={isSelected}
                    className={cn(
                      "min-h-12 rounded-2xl px-2 text-xs font-semibold transition-all active:scale-[0.98]",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-medium text-muted-foreground">Pick date</span>
              <Input
                type="date"
                value={selectedDateKey}
                min={getDateKey(new Date())}
                onChange={(event) => handleCustomDateChange(event.target.value)}
                className="min-h-12 rounded-2xl border-border/60 bg-secondary text-foreground"
              />
            </label>

            <div className="relative">
              <div className="pointer-events-none absolute inset-x-0 top-1/2 h-16 -translate-y-1/2 rounded-2xl border border-primary/25 bg-primary/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" />
              <div
                className="relative max-h-72 snap-y snap-mandatory overflow-y-auto overscroll-contain py-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                aria-label="Start time options"
              >
                {getTimeOptions(selectedDateKey).map((minutes) => {
                  const isSelected = selectedTimeMinutes === minutes
                  return (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => handleTimeSelect(minutes)}
                      aria-pressed={isSelected}
                      className={cn(
                        "relative flex min-h-16 w-full snap-center items-center justify-center rounded-2xl px-5 text-center transition-all duration-200",
                        isSelected ? "scale-100 text-primary" : "scale-[0.96] text-muted-foreground"
                      )}
                    >
                      <span className="text-lg font-semibold">{formatTimeOption(minutes)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="px-6 pt-1">
            <button
              type="button"
              onClick={() => setStartTimeSheetOpen(false)}
              className="min-h-12 w-full rounded-2xl bg-primary text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.99]"
            >
              Done
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </Dialog>
  )
}
