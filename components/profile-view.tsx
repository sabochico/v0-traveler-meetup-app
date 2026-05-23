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
  Coffee,
  Utensils,
  BookOpen,
  LogOut,
  Loader2,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useProfile, useUpdateProfile } from "@/hooks/use-profile"
import { useAuth } from "@/hooks/use-auth"
import { EditProfileModal } from "@/components/edit-profile-modal"
import { ConnectSocialModal } from "@/components/connect-social-modal"
import { LocationSelector } from "@/components/location-selector"
import { NotificationsSettings } from "@/components/notifications-settings"
import { AppearanceSettings } from "@/components/appearance-settings"
import { cn } from "@/lib/utils"

const DEFAULT_BADGES = [
  { id: "early", label: "Early Drifter", icon: Plane },
  { id: "coffee", label: "Coffee Lover", icon: Coffee },
  { id: "foodie", label: "Foodie", icon: Utensils },
  { id: "bookworm", label: "Bookworm", icon: BookOpen },
]

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
  const [showSettingsSheet, setShowSettingsSheet] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
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
        <img
          src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=400&fit=crop"
          alt="Cover"
          className="w-full h-full object-cover"
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        {/* Settings Button */}
        <button
          onClick={() => setShowSettingsSheet(true)}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background/80 active:scale-95 transition-all"
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 rounded-xl bg-card border border-border/50">
            <p className="text-2xl font-semibold text-primary">0</p>
            <p className="text-xs text-muted-foreground">Meetups</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-card border border-border/50">
            <p className="text-2xl font-semibold text-primary">0</p>
            <p className="text-xs text-muted-foreground">Connections</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-card border border-border/50">
            <p className="text-2xl font-semibold text-primary">1</p>
            <p className="text-xs text-muted-foreground">Cities</p>
          </div>
        </div>

        {/* Badges */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-foreground mb-3">Badges</h2>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_BADGES.slice(0, 2).map((badge) => (
              <div
                key={badge.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm"
              >
                <badge.icon className="w-3.5 h-3.5" />
                <span>{badge.label}</span>
              </div>
            ))}
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
                <p className="text-sm font-medium text-foreground">Anonymous Mode</p>
                <p className="text-xs text-muted-foreground">Hide your profile from discovery</p>
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

      {/* Settings Sheet */}
      <Sheet open={showSettingsSheet} onOpenChange={setShowSettingsSheet}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-background border-border">
          <SheetHeader>
            <SheetTitle className="text-foreground">Settings</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-2">
            <button
              onClick={() => {
                setShowSettingsSheet(false)
                setShowEditModal(true)
              }}
              className="flex items-center gap-3 w-full p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
            >
              <Edit3 className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Edit Profile</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
            </button>

            <button
              onClick={() => {
                setShowSettingsSheet(false)
                setShowLocationModal(true)
              }}
              className="flex items-center gap-3 w-full p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
            >
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Location</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
            </button>

            <button
              onClick={() => {
                setShowSettingsSheet(false)
                setShowNotificationsModal(true)
              }}
              className="flex items-center gap-3 w-full p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Notifications</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
            </button>

            <button
              onClick={() => {
                setShowSettingsSheet(false)
                setShowAppearanceModal(true)
              }}
              className="flex items-center gap-3 w-full p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
            >
              <Moon className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Appearance</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
            </button>

            <button
              onClick={() => {
                setShowSettingsSheet(false)
                setShowSocialModal(true)
              }}
              className="flex items-center gap-3 w-full p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
            >
              <Instagram className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Social Accounts</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
            </button>

            <div className="pt-4 border-t border-border mt-4">
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex items-center gap-3 w-full p-4 rounded-xl bg-card border border-destructive/30 hover:border-destructive/50 transition-colors"
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
        </SheetContent>
      </Sheet>
    </div>
  )
}
