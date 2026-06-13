"use client"

import { useEffect, useState } from "react"
import {
  Settings,
  Camera,
  Instagram,
  Shield,
  Bell,
  Moon,
  ChevronRight,
  Plane,
  LogOut,
  Loader2,
  FileText,
  Trash2,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useProfile, useUpdateProfile } from "@/hooks/use-profile"
import { useAuth } from "@/hooks/use-auth"
import { EditProfileModal } from "@/components/edit-profile-modal"
import { ConnectSocialModal } from "@/components/connect-social-modal"
import { LocationSelector } from "@/components/location-selector"
import { NotificationsSettings } from "@/components/notifications-settings"
import { NotificationsBell } from "@/components/notifications-bell"
import { AppearanceSettings } from "@/components/appearance-settings"
import { createClient } from "@/lib/supabase/client"
import { getNextProfileRequirement, getProfileCompletionScore } from "@/lib/profile-completion"
import { clearCachedProfile } from "@/lib/profile-cache"
import { Haptics, ImpactStyle } from "@capacitor/haptics"
import { Capacitor } from "@capacitor/core"

export function ProfileView() {
  const { profile, isLoading } = useProfile()
  const { toggleTravelMode, toggleAnonymousMode } = useUpdateProfile()
  const { signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showSocialModal, setShowSocialModal] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showNotificationsModal, setShowNotificationsModal] = useState(false)
  const [showAppearanceModal, setShowAppearanceModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [travelMode, setTravelMode] = useState(profile?.travel_mode ?? true)
  const [anonymousMode, setAnonymousMode] = useState(profile?.anonymous_mode ?? false)
  const [savingToggle, setSavingToggle] = useState<"travel" | "anonymous" | null>(null)
  const completionScore = getProfileCompletionScore(profile)
  const languageCount = profile?.languages?.length ?? 0
  const interestCount = profile?.interests?.length ?? 0
  const locationLabel =
    profile?.current_city && profile?.current_country
      ? `${profile.current_city}, ${profile.current_country}`
      : profile?.current_city ?? profile?.current_country ?? "Set location"

  useEffect(() => {
    if (!profile || savingToggle) return
    setTravelMode(profile.travel_mode ?? true)
    setAnonymousMode(profile.anonymous_mode ?? false)
  }, [profile?.travel_mode, profile?.anonymous_mode, profile, savingToggle])

  const triggerToggleHaptic = async () => {
    if (!Capacitor.isNativePlatform()) return
    await Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})
  }

  const handleTravelModeChange = async (enabled: boolean) => {
    if (savingToggle) return
    const previous = travelMode
    setTravelMode(enabled)
    setSavingToggle("travel")

    try {
      await toggleTravelMode(enabled)
      await triggerToggleHaptic()
    } catch (error) {
      console.error("Failed to update travel mode:", error)
      setTravelMode(previous)
    } finally {
      setSavingToggle(null)
    }
  }

  const handleAnonymousModeChange = async (enabled: boolean) => {
    if (savingToggle) return
    const previous = anonymousMode
    setAnonymousMode(enabled)
    setSavingToggle("anonymous")

    try {
      await toggleAnonymousMode(enabled)
      await triggerToggleHaptic()
    } catch (error) {
      console.error("Failed to update discover visibility:", error)
      setAnonymousMode(previous)
    } finally {
      setSavingToggle(null)
    }
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
  }

  const closeDeleteModal = () => {
    if (deletingAccount) return
    setShowDeleteModal(false)
    setDeleteError(null)
  }

  const handleDeleteAccount = async () => {
    setDeletingAccount(true)
    setDeleteError(null)

    try {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error("Please sign in again to delete your account.")
      }

      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error ?? "Could not delete account")
      }

      await supabase.auth.signOut()
      clearCachedProfile()
      sessionStorage.setItem("drift_account_deleted", "true")
      window.location.href = "/auth/login"
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Could not delete account")
      setDeletingAccount(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Profile Hero */}
      <div className="relative overflow-hidden px-4 pb-3 pt-[calc(0.75rem+var(--drift-safe-top))]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(255,255,255,0.14),transparent_20rem),linear-gradient(135deg,rgba(37,99,255,0.82),rgba(0,212,204,0.64))]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background" />
        <div className="relative mx-auto max-w-lg animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="rounded-[1.75rem] border border-white/12 bg-background/52 p-3.5 shadow-lg shadow-black/15 backdrop-blur-2xl">
            <div className="flex items-start gap-3">
              <div className="relative flex-shrink-0 pt-0.5">
                <Avatar className="h-[4.35rem] w-[4.35rem] ring-2 ring-white/16 shadow-md shadow-black/20">
                  <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.display_name ?? "You"} />
                  <AvatarFallback>{(profile?.display_name ?? "U")[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full drift-gradient-button text-primary-foreground ring-2 ring-background/80 transition-all active:scale-95"
                  aria-label="Change photo"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/85">Your Drift</p>
                    <h1 className="mt-0.5 truncate text-[1.85rem] font-serif font-semibold leading-none text-foreground">
                      Hey, {profile?.display_name ?? "Drifter"}
                    </h1>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <NotificationsBell className="bg-background/45 hover:bg-background/70" />
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-background/38 text-foreground transition-colors active:scale-95 hover:bg-background/65"
                      aria-label="Edit profile"
                    >
                      <Settings className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[13px] text-foreground/64">
                  <Plane className="h-4 w-4 flex-shrink-0 text-primary" />
                  <span className="flex-shrink-0">Traveler</span>
                  <span className="text-foreground/35">·</span>
                  <span className="min-w-0 truncate">{locationLabel}</span>
                </div>
              </div>
            </div>

            <p className="mt-3.5 line-clamp-2 text-[0.92rem] leading-6 text-foreground/84">
              {profile?.bio ?? "Add a short bio so people know what you are up for today."}
            </p>

            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <button
                onClick={() => completionScore < 100 && setShowEditModal(true)}
                className="flex min-h-9 flex-1 items-center justify-between gap-3 rounded-full border border-white/10 bg-white/[0.045] px-3.5 text-left"
              >
                <span>
                  <span className="block text-xs font-semibold text-foreground">
                    {completionScore >= 100 ? "Profile Complete" : "Profile completion"}
                  </span>
                  {completionScore < 100 && (
                    <span className="mt-0.5 block text-[11px] font-medium text-primary">
                      {getNextProfileRequirement(profile)}
                    </span>
                  )}
                </span>
                <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
                  {completionScore}%
                </span>
              </button>
              {completionScore < 100 && (
                <div className="h-1.5 basis-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full drift-gradient" style={{ width: `${completionScore}%` }} />
                </div>
              )}
            </div>

            <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-[1.1rem] bg-white/[0.045] px-3 py-2">
                <p className="text-xs font-semibold text-foreground">Traveler</p>
                <p className="text-[10px] text-foreground/45">mode</p>
              </div>
              <div className="rounded-[1.1rem] bg-white/[0.045] px-3 py-2">
                <p className="text-xs font-semibold text-foreground">{languageCount}</p>
                <p className="text-[10px] text-foreground/45">languages</p>
              </div>
              <div className="rounded-[1.1rem] bg-white/[0.045] px-3 py-2">
                <p className="text-xs font-semibold text-foreground">{interestCount}</p>
                <p className="text-[10px] text-foreground/45">interests</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 relative">
        {/* Languages */}
        <div className="mb-5">
          <h2 className="text-sm font-medium text-foreground mb-3">Languages</h2>
          <div className="flex flex-wrap gap-2">
            {(profile?.languages?.length ?? 0) > 0 ? (
              profile?.languages.map((lang) => (
                <Badge key={lang} variant="secondary">
                  {lang}
                </Badge>
              ))
            ) : (
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => setShowEditModal(true)}
              >
                + Add languages
              </Badge>
            )}
          </div>
        </div>

        {/* Interests */}
        <div className="mb-5">
          <h2 className="text-sm font-medium text-foreground mb-3">Interests</h2>
          <div className="flex flex-wrap gap-2">
            {(profile?.interests?.length ?? 0) > 0 ? (
              profile?.interests.map((interest) => (
                <Badge key={interest} variant="outline" className="border-border text-foreground">
                  {interest}
                </Badge>
              ))
            ) : (
              <Badge
                variant="outline"
                className="border-border text-foreground cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                onClick={() => setShowEditModal(true)}
              >
                + Add interests
              </Badge>
            )}
          </div>
        </div>

        {/* Social Links */}
        <div className="mb-5">
          <h2 className="text-sm font-medium text-foreground mb-3">Social</h2>
          <button 
            onClick={() => setShowSocialModal(true)}
            className="flex items-center gap-3 w-full p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
          >
            <Instagram className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-foreground">
              {profile?.instagram_handle ? `@${profile.instagram_handle}` : "Connect Instagram"}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
          </button>
        </div>

        {/* Settings */}
          <div className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">Settings</h2>

          <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-3">
              <Plane className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Travel Mode</p>
                <p className="text-xs text-muted-foreground">Show you&apos;re visiting this city</p>
              </div>
            </div>
            <Switch
              checked={travelMode}
              onCheckedChange={handleTravelModeChange}
              disabled={savingToggle !== null}
              aria-label="Toggle Travel Mode"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Hide from Discover</p>
                <p className="text-xs text-muted-foreground">
                  People won&apos;t see you in Discover People. Existing chats still work.
                </p>
              </div>
            </div>
            <Switch
              checked={anonymousMode}
              onCheckedChange={handleAnonymousModeChange}
              disabled={savingToggle !== null}
              aria-label="Toggle Hide from Discover"
            />
          </div>

          <button 
            onClick={() => setShowNotificationsModal(true)}
            className="flex items-center gap-3 w-full p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Notifications</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
          </button>

          <button 
            onClick={() => setShowAppearanceModal(true)}
            className="flex items-center gap-3 w-full p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
          >
            <Moon className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Appearance</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
          </button>

          <a
            href="/legal/privacy"
            className="flex items-center gap-3 w-full p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
          >
            <FileText className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Privacy Policy</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
          </a>

          <a
            href="/legal/terms"
            className="flex items-center gap-3 w-full p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
          >
            <FileText className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Terms of Service</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
          </a>

          <a
            href="/legal/community"
            className="flex items-center gap-3 w-full p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
          >
            <Shield className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Community Guidelines</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
          </a>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-3 w-full p-4 rounded-xl bg-card border border-border/50 hover:border-destructive/30 transition-colors"
          >
            <Trash2 className="w-5 h-5 text-destructive" />
            <div className="text-left">
              <span className="block text-sm font-medium text-foreground">Delete account</span>
              <span className="block text-xs text-muted-foreground">Permanently remove your Drift account</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
          </button>

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-3 w-full p-4 rounded-xl bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 transition-colors"
          >
            {signingOut ? (
              <Loader2 className="w-5 h-5 text-destructive animate-spin" />
            ) : (
              <LogOut className="w-5 h-5 text-destructive" />
            )}
            <span className="text-sm font-medium text-destructive">Sign out</span>
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {profile && (
        <EditProfileModal
          profile={profile}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Connect Social Modal */}
      <ConnectSocialModal
        isOpen={showSocialModal}
        onClose={() => setShowSocialModal(false)}
        currentInstagram={profile?.instagram_handle}
      />

      {/* Location Selector Modal */}
      <LocationSelector
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        currentCity={profile?.current_city}
        currentCountry={profile?.current_country}
      />

      {/* Notifications Settings Modal */}
      <NotificationsSettings
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
      />

      {/* Appearance Settings Modal */}
      <AppearanceSettings
        isOpen={showAppearanceModal}
        onClose={() => setShowAppearanceModal(false)}
      />

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <button
            aria-label="Close delete account modal"
            className="absolute inset-0 bg-black/70"
            onClick={closeDeleteModal}
          />
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-card border border-border p-5 space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Delete account?</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Are you sure you want to permanently delete your account?
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-3">
              <p className="text-sm font-medium text-foreground">This action cannot be undone and will permanently remove:</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>Your profile</li>
                <li>Messages</li>
                <li>Meetups you created</li>
                <li>Saved meetups</li>
                <li>Account data</li>
              </ul>
            </div>

            {deleteError && (
              <p className="text-sm text-destructive">{deleteError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={closeDeleteModal}
                disabled={deletingAccount}
                className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="flex-1 rounded-xl bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingAccount && <Loader2 className="h-4 w-4 animate-spin" />}
                {deletingAccount ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
