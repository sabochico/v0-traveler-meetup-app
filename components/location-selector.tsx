"use client"

import { useState, useEffect } from "react"
import { X, MapPin, Loader2, Navigation, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useUpdateProfile } from "@/hooks/use-profile"
import { useToast } from "@/hooks/use-toast"
import { detectCurrentLocation, type DetectedLocation } from "@/lib/location"

interface LocationSelectorProps {
  isOpen: boolean
  onClose: () => void
  currentCity?: string | null
  currentCountry?: string | null
}

const POPULAR_CITIES = [
  { city: "Tokyo", country: "Japan" },
  { city: "Seoul", country: "South Korea" },
  { city: "Bangkok", country: "Thailand" },
  { city: "Bali", country: "Indonesia" },
  { city: "Lisbon", country: "Portugal" },
  { city: "Barcelona", country: "Spain" },
  { city: "Berlin", country: "Germany" },
  { city: "London", country: "United Kingdom" },
  { city: "New York", country: "United States" },
  { city: "Los Angeles", country: "United States" },
  { city: "Sydney", country: "Australia" },
  { city: "Singapore", country: "Singapore" },
]

export function LocationSelector({ isOpen, onClose, currentCity, currentCountry }: LocationSelectorProps) {
  const [city, setCity] = useState(currentCity || "")
  const [country, setCountry] = useState(currentCountry || "")
  const [detectedLocation, setDetectedLocation] = useState<DetectedLocation | null>(null)
  const [detecting, setDetecting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { updateProfile } = useUpdateProfile()
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      setCity(currentCity || "")
      setCountry(currentCountry || "")
      setDetectedLocation(null)
    }
  }, [isOpen, currentCity, currentCountry])

  if (!isOpen) return null

  const filteredCities = POPULAR_CITIES.filter(
    c => c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
         c.country.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDetectLocation = async () => {
    setDetecting(true)
    try {
      const detected = await detectCurrentLocation()
      setCity(detected.city)
      setCountry(detected.country)
      setDetectedLocation(detected)
    } catch (error) {
      console.error("Failed to detect location:", error)
      toast({
        title: "Could not detect your location",
        description: "Please enter it manually.",
        variant: "destructive",
      })
    } finally {
      setDetecting(false)
    }
  }

  const handleSelectCity = (selectedCity: string, selectedCountry: string) => {
    setCity(selectedCity)
    setCountry(selectedCountry)
    setDetectedLocation(null)
    setSearchQuery("")
  }

  const handleSave = async () => {
    if (!city || !country) return
    
    setSaving(true)
    try {
      await updateProfile({
        current_city: city,
        current_country: country,
        current_region: detectedLocation?.region ?? null,
        latitude: detectedLocation?.latitude ?? null,
        longitude: detectedLocation?.longitude ?? null,
        location_source: detectedLocation ? "gps" : "manual",
        location_updated_at: new Date().toISOString(),
      })
      onClose()
    } catch (error) {
      console.error("Failed to update location:", error)
      toast({
        title: "Location was not saved",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-card rounded-t-3xl sm:rounded-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h2 className="text-lg font-semibold">Set Location</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-secondary transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Auto-detect */}
          <button
            onClick={handleDetectLocation}
            disabled={detecting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {detecting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Detecting location...
              </>
            ) : (
              <>
                <Navigation className="w-5 h-5" />
                Use my current location
              </>
            )}
          </button>

          <div className="relative flex items-center">
            <div className="flex-1 border-t border-border/50" />
            <span className="px-3 text-xs text-muted-foreground">or</span>
            <div className="flex-1 border-t border-border/50" />
          </div>

          {/* Manual input */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">City</label>
              <Input
                value={city}
                onChange={(e) => {
                  setCity(e.target.value)
                  setDetectedLocation(null)
                }}
                placeholder="Tokyo"
                className="bg-secondary border-0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Country</label>
              <Input
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value)
                  setDetectedLocation(null)
                }}
                placeholder="Japan"
                className="bg-secondary border-0"
              />
            </div>
          </div>

          {/* Popular cities */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search popular cities..."
                className="bg-secondary border-0"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {filteredCities.map((loc) => (
                <button
                  key={`${loc.city}-${loc.country}`}
                  onClick={() => handleSelectCity(loc.city, loc.country)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                    city === loc.city && country === loc.country
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/80"
                  }`}
                >
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{loc.city}</div>
                    <div className="text-xs opacity-70 truncate">{loc.country}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/50">
          <button
            onClick={handleSave}
            disabled={saving || !city || !country}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:glow-amber transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                Save Location
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
