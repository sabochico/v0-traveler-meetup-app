"use client"

import { useState, useEffect, useRef } from "react"
import { MapPin, Clock, Coffee, Camera, Utensils, Moon, BookOpen, Gamepad2, Map, Sparkles, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useCreateMeetup } from "@/hooks/use-meetups"
import { cn } from "@/lib/utils"

interface CreateMeetupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface CityResult {
  place_id: number
  display_name: string
  address: {
    city?: string
    town?: string
    municipality?: string
    village?: string
    state?: string
    country?: string
  }
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

function formatCityLabel(s: CityResult): string {
  const { address } = s
  const city = address.city || address.town || address.municipality || address.village
  const country = address.country
  if (city && country) return `${city}, ${country}`
  return s.display_name.split(",").slice(0, 2).join(",").trim()
}

export function CreateMeetup({ open, onOpenChange }: CreateMeetupProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [location, setLocation] = useState("")
  const [selectedTime, setSelectedTime] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [citySuggestions, setCitySuggestions] = useState<CityResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isCitySearching, setIsCitySearching] = useState(false)
  const [cityData, setCityData] = useState<{ city: string; country?: string } | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { createMeetup } = useCreateMeetup()

  // Debounced city search via Nominatim
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
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&featuretype=city&format=json&limit=5&addressdetails=1`,
          { headers: { "User-Agent": "DriftApp/1.0", "Accept-Language": "en" } }
        )
        const data: CityResult[] = await res.json()
        const seen = new Set<string>()
        const unique = data.filter((s) => {
          const label = formatCityLabel(s)
          if (seen.has(label)) return false
          seen.add(label)
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
    const label = formatCityLabel(suggestion)
    setLocation(label)
    setCityData({
      city: suggestion.address.city || suggestion.address.town || suggestion.address.municipality || suggestion.address.village || label.split(",")[0].trim(),
      country: suggestion.address.country,
    })
    setCitySuggestions([])
    setShowDropdown(false)
  }

  const handleSubmit = async () => {
    if (!selectedType || !title || !location) return

    setLoading(true)
    setError(null)

    try {
      const startsAt = new Date()
      startsAt.setHours(startsAt.getHours() + selectedTime)

      await createMeetup({
        title,
        category: selectedType,
        location_name: location,
        city: cityData?.city ?? location.split(",")[0]?.trim(),
        country: cityData?.country,
        starts_at: startsAt.toISOString(),
      })

      onOpenChange(false)
      setSelectedType(null)
      setTitle("")
      setLocation("")
      setSelectedTime(0)
      setCityData(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create meetup")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <DialogTitle className="text-xl font-serif">Create a meetup</DialogTitle>
          <p className="text-sm text-muted-foreground">Find someone to share a moment with</p>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Meetup Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">What kind of meetup?</label>
            <div className="grid grid-cols-4 gap-2">
              {MEETUP_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-300",
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
                        key={s.place_id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectCity(s)}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-secondary transition-colors border-b border-border/30 last:border-0"
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
                    "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-colors",
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
        <div className="p-6 pt-0">
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
