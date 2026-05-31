"use client"

import { useState } from "react"
import {
  Settings,
  MapPin,
  Globe,
  Camera,
  Instagram,
  Edit3,
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
import { AppearanceSettings } from "@/components/appearance-settings"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { getNextProfileRequirement, getProfileCompletionScore } from "@/lib/profile-completion"

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
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const completionScore = getProfileCompletionScore(profile)

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
  }

  const closeDeleteModal = () => {
    if (deletingAccount) return
    setShowDeleteModal(false)
    setDeleteConfirmText("")
    setDeleteError(null)
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return

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
      {/* Cover Photo */}
      <div className="relative h-48 overflow-hidden">
        <div className="w-full h-full drift-gradient" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        {/* Settings Button */}
        <button
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background/80 transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Profile Info */}
      <div className="max-w-lg mx-auto px-4 -mt-16 relative">
        {/* Avatar */}
        <div className="relative inline-block mb-4">
          <Avatar className="w-28 h-28 ring-4 ring-background">
            <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.display_name ?? "You"} />
            <AvatarFallback>{(profile?.display_name ?? "U")[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <button
            onClick={() => setShowEditModal(true)}
            className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:glow-amber transition-all"
            aria-label="Change photo"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Name & Bio */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-serif font-semibold">{profile?.display_name ?? "Drifter"}</h1>
            <button
              onClick={() => setShowEditModal(true)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Edit profile"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
          <p className="text-foreground leading-relaxed">
            {profile?.bio ?? "No bio yet. Tell others about yourself!"}
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-primary/25 bg-card/70 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Profile completion</span>
            <span className="text-sm font-semibold text-primary">{completionScore}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full drift-gradient" style={{ width: `${completionScore}%` }} />
          </div>
          {completionScore < 100 && (
            <button
              onClick={() => setShowEditModal(true)}
              className="mt-3 text-xs font-medium text-primary"
            >
              {getNextProfileRequirement(profile)}
            </button>
          )}
        </div>

        {/* Location Info */}
        <div className="flex flex-wrap gap-4 mb-6 text-sm">
          <button
            onClick={() => setShowLocationModal(true)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
          >
            <MapPin className="w-4 h-4 text-primary" />
            <span>
              {profile?.current_city ?? "Set"}, {profile?.current_country ?? "Location"}
            </span>
          </button>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Globe className="w-4 h-4" />
            <span>Traveler</span>
          </div>
        </div>

        {/* Languages */}
        <div className="mb-6">
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
        <div className="mb-6">
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
        <div className="mb-6">
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
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-foreground">Settings</h2>

          <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-3">
              <Plane className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Travel Mode</p>
                <p className="text-xs text-muted-foreground">Show you&apos;re visiting this city</p>
              </div>
            </div>
            <Switch checked={profile?.travel_mode ?? true} onCheckedChange={toggleTravelMode} />
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
            <Switch checked={profile?.anonymous_mode ?? false} onCheckedChange={toggleAnonymousMode} />
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
            <div>
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
                  This is permanent. Your profile, meetups, saved plans, messages, reports, and account data will be deleted where Drift stores them.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-3">
              <p className="text-sm text-foreground">
                Type <span className="font-semibold">DELETE</span> to confirm.
              </p>
            </div>

            <input
              value={deleteConfirmText}
              onChange={(event) => setDeleteConfirmText(event.target.value)}
              disabled={deletingAccount}
              placeholder="DELETE"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-destructive"
            />

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
                disabled={deleteConfirmText !== "DELETE" || deletingAccount}
                className="flex-1 rounded-xl bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground disabled:opacity-50"
              >
                {deletingAccount ? "Deleting..." : "Delete forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
