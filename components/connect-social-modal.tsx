"use client"

import { useState } from "react"
import { X, Instagram, Check, Loader2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUpdateProfile } from "@/hooks/use-profile"
import { cn } from "@/lib/utils"

interface ConnectSocialModalProps {
  isOpen: boolean
  onClose: () => void
  currentInstagram?: string | null
}

export function ConnectSocialModal({
  isOpen,
  onClose,
  currentInstagram,
}: ConnectSocialModalProps) {
  const [username, setUsername] = useState(currentInstagram ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const { updateProfile } = useUpdateProfile()

  const handleSave = async () => {
    if (!username.trim()) return

    setSaving(true)
    try {
      // Clean the username (remove @ if present)
      const cleanUsername = username.trim().replace(/^@/, "")
      await updateProfile({ instagram_handle: cleanUsername })
      setSaved(true)
      setTimeout(() => {
        onClose()
        setSaved(false)
      }, 1500)
    } catch (error) {
      console.error("Failed to save Instagram handle:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnect = async () => {
    setSaving(true)
    try {
      await updateProfile({ instagram_handle: null })
      setUsername("")
      setSaved(true)
      setTimeout(() => {
        onClose()
        setSaved(false)
      }, 1500)
    } catch (error) {
      console.error("Failed to disconnect Instagram:", error)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
              <Instagram className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Connect Instagram
              </h2>
              <p className="text-xs text-muted-foreground">
                Let others find you on Instagram
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {saved ? (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-foreground font-medium">
                {username ? "Instagram connected!" : "Instagram disconnected"}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Instagram Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    @
                  </span>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="yourusername"
                    className="pl-8 bg-background border-border"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Your Instagram handle will be visible on your profile so other
                  travelers can connect with you.
                </p>
              </div>

              {username && (
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                  <a
                    href={`https://instagram.com/${username.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Instagram className="w-4 h-4" />
                    <span>@{username.replace(/^@/, "")}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div className="flex gap-3">
                {currentInstagram && (
                  <Button
                    variant="outline"
                    onClick={handleDisconnect}
                    disabled={saving}
                    className="flex-1"
                  >
                    Disconnect
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  disabled={saving || !username.trim()}
                  className={cn(
                    "flex-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white hover:opacity-90",
                    !currentInstagram && "w-full"
                  )}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
