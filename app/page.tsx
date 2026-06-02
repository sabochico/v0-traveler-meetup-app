"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { BottomNav } from "@/components/bottom-nav"
import { FeedView } from "@/components/feed-view"
import { DiscoverView } from "@/components/discover-view"
import { CreateMeetup } from "@/components/create-meetup"
import { MessagesView } from "@/components/messages-view"
import { ProfileView } from "@/components/profile-view"
import { AuthPrompt } from "@/components/auth-prompt"
import { NotificationsBell } from "@/components/notifications-bell"
import { DriftLogo } from "@/components/drift-logo"
import { EditProfileModal } from "@/components/edit-profile-modal"
import { useProfile } from "@/hooks/use-profile"
import { isProfileComplete } from "@/lib/profile-completion"
import { getLaunchCityEligibility, type LocationInput } from "@/lib/launch-cities"
import { detectCurrentLocation } from "@/lib/location"
import { getScreenMotion } from "@/lib/motion"
import { Loader2 } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

export default function Home() {
  const { isLoading, isAuthenticated } = useAuth()
  const { profile, isLoading: profileLoading } = useProfile()
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()
  const screenMotion = getScreenMotion(Boolean(prefersReducedMotion))
  const [activeTab, setActiveTab] = useState<"feed" | "discover" | "create" | "messages" | "profile">("feed")
  const [showCreate, setShowCreate] = useState(false)
  const [pendingConversationId, setPendingConversationId] = useState<string | undefined>(undefined)
  const [deviceLocation, setDeviceLocation] = useState<LocationInput | null>(null)
  const [checkingDeviceLocation, setCheckingDeviceLocation] = useState(false)
  const [attemptedDeviceLocation, setAttemptedDeviceLocation] = useState(false)
  const profileLocation: LocationInput | null = profile
    ? {
        city: profile.current_city,
        country: profile.current_country,
        latitude: profile.latitude,
        longitude: profile.longitude,
      }
    : null
  const hasProfileLocation =
    Boolean(profileLocation?.city && profileLocation.country) ||
    (profileLocation?.latitude != null && profileLocation.longitude != null)
  const launchEligibility = useMemo(
    () => getLaunchCityEligibility(hasProfileLocation ? profileLocation : deviceLocation),
    [deviceLocation, hasProfileLocation, profileLocation]
  )
  const shouldGateApp =
    isAuthenticated &&
    profile &&
    isProfileComplete(profile) &&
    !checkingDeviceLocation &&
    (hasProfileLocation || attemptedDeviceLocation || Boolean(deviceLocation)) &&
    !launchEligibility.eligible

  useEffect(() => {
    if (shouldGateApp && activeTab !== "profile") {
      router.replace("/waitlist")
    }
  }, [activeTab, router, shouldGateApp])

  useEffect(() => {
    if (
      !isAuthenticated ||
      !profile ||
      !isProfileComplete(profile) ||
      hasProfileLocation ||
      deviceLocation ||
      checkingDeviceLocation ||
      attemptedDeviceLocation
    ) {
      return
    }

    setAttemptedDeviceLocation(true)
    setCheckingDeviceLocation(true)
    detectCurrentLocation()
      .then((location) => {
        setDeviceLocation(location)
      })
      .catch(() => {
        setDeviceLocation(null)
      })
      .finally(() => {
        setCheckingDeviceLocation(false)
      })
  }, [attemptedDeviceLocation, checkingDeviceLocation, deviceLocation, hasProfileLocation, isAuthenticated, profile])

  const handleNavigateToMessages = (conversationId: string) => {
    setPendingConversationId(conversationId)
    setActiveTab("messages")
  }

  const handleTabChange = (tab: "feed" | "discover" | "create" | "messages" | "profile") => {
    if (shouldGateApp && tab !== "profile") {
      router.push("/waitlist")
      return
    }

    if (tab === "create") {
      if (!isAuthenticated) {
        setActiveTab("profile")
        return
      }
      setShowCreate(true)
    } else {
      setActiveTab(tab)
    }
  }

  if (isLoading || (isAuthenticated && profileLoading)) {
    return (
      <main className="min-h-dvh drift-gradient flex items-center justify-center overflow-x-hidden">
        <div className="text-center text-white">
          <DriftLogo markClassName="h-20 w-20 mx-auto [&_path]:fill-white" />
          <h1 className="mt-6 text-4xl font-semibold tracking-tight">Drift</h1>
          <p className="mt-2 text-sm text-white/85">Find your people.</p>
          <Loader2 className="w-6 h-6 animate-spin text-white/80 mx-auto mt-8" />
        </div>
      </main>
    )
  }

  if (isAuthenticated && profile && !isProfileComplete(profile)) {
    return (
      <main className="min-h-dvh bg-background film-grain overflow-x-hidden">
        <EditProfileModal
          profile={profile}
          isOpen
          onClose={() => {}}
          setupMode
        />
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-background relative film-grain overflow-x-hidden">
      {/* Notification bell — fixed top-right, visible on all tabs when signed in */}
      {isAuthenticated && activeTab !== "profile" && (
        <div className="fixed top-[calc(0.75rem+env(safe-area-inset-top))] right-3 z-50">
          <NotificationsBell />
        </div>
      )}

      {/* Main Content Area */}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={activeTab}
          className="pb-[calc(5.5rem+env(safe-area-inset-bottom))]"
          initial={screenMotion.initial}
          animate={screenMotion.animate}
          exit={screenMotion.exit}
          transition={screenMotion.transition}
        >
          {activeTab === "feed" && <FeedView onNavigateToMessages={handleNavigateToMessages} />}
          {activeTab === "discover" && <DiscoverView onNavigateToMessages={handleNavigateToMessages} />}
          {activeTab === "messages" && (
            isAuthenticated
              ? <MessagesView initialConversationId={pendingConversationId} />
              : <AuthPrompt message="Sign in to see your messages" />
          )}
          {activeTab === "profile" && (
            isAuthenticated ? <ProfileView /> : <AuthPrompt message="Sign in to view your profile" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Create Meetup Modal */}
      {isAuthenticated && (
        <CreateMeetup open={showCreate} onOpenChange={setShowCreate} />
      )}
    </main>
  )
}
