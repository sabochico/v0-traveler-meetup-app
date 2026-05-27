"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { X, Sun, Moon, Monitor, Palette, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface AppearanceSettingsProps {
  isOpen: boolean
  onClose: () => void
}

const ACCENT_COLORS = [
  { name: "Amber", value: "amber", color: "bg-amber-500" },
  { name: "Blue", value: "blue", color: "bg-blue-500" },
  { name: "Rose", value: "rose", color: "bg-rose-500" },
  { name: "Emerald", value: "emerald", color: "bg-emerald-500" },
  { name: "Purple", value: "purple", color: "bg-purple-500" },
  { name: "Orange", value: "orange", color: "bg-orange-500" },
]

export function AppearanceSettings({ isOpen, onClose }: AppearanceSettingsProps) {
  const { theme, setTheme } = useTheme()
  const [accentColor, setAccentColor] = useState("amber")
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const savedAccent = localStorage.getItem("drift-accent") ?? "amber"
    const savedMotion = localStorage.getItem("drift-reduced-motion") === "true"
    setAccentColor(savedAccent)
    setReducedMotion(savedMotion)
  }, [])

  if (!isOpen) return null

  const handleAccentChange = (newAccent: string) => {
    setAccentColor(newAccent)
    localStorage.setItem("drift-accent", newAccent)
    if (newAccent === "amber") {
      document.documentElement.removeAttribute("data-accent")
    } else {
      document.documentElement.setAttribute("data-accent", newAccent)
    }
  }

  const handleMotionToggle = () => {
    const newValue = !reducedMotion
    setReducedMotion(newValue)
    localStorage.setItem("drift-reduced-motion", String(newValue))
    document.documentElement.classList.toggle("reduce-motion", newValue)
  }

  const currentTheme = theme ?? "dark"

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-card rounded-t-3xl sm:rounded-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Appearance</h2>
          </div>
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
          {/* Theme Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Theme</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "light", label: "Light", icon: Sun },
                { value: "dark", label: "Dark", icon: Moon },
                { value: "system", label: "System", icon: Monitor },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    currentTheme === option.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <option.icon className={cn(
                    "w-6 h-6",
                    currentTheme === option.value ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-sm font-medium",
                    currentTheme === option.value ? "text-primary" : "text-foreground"
                  )}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Accent Color</label>
            <div className="flex flex-wrap gap-3">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleAccentChange(color.value)}
                  className={cn(
                    "relative w-10 h-10 rounded-full transition-transform hover:scale-110",
                    color.color,
                    accentColor === color.value && "ring-2 ring-offset-2 ring-offset-card ring-white"
                  )}
                  title={color.name}
                >
                  {accentColor === color.value && (
                    <Check className="w-5 h-5 text-white absolute inset-0 m-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
            <div>
              <p className="font-medium text-foreground">Reduce Motion</p>
              <p className="text-xs text-muted-foreground">Minimize animations throughout the app</p>
            </div>
            <button
              onClick={handleMotionToggle}
              className={cn(
                "relative w-12 h-7 rounded-full transition-colors",
                reducedMotion ? "bg-primary" : "bg-muted"
              )}
            >
              <div
                className={cn(
                  "absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform",
                  reducedMotion ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/50">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:glow-amber transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
