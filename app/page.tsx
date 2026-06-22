"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { BottomNav } from "@/components/bottom-nav"
import { FeedView } from "@/components/feed-view"
import { DiscoverView } from "@/components/discover-view"
import { CreateMeetup } from "@/components/create-meetup"
import { MessagesView } from "@/components/messages-view"
import { ProfileView } from "@/components/profile-view"
import { AuthPrompt } from "@/components/auth-prompt"
import { NotificationsBell } from "@/components/notifications-bell"
import { EditProfileModal } from "@/components/edit-profile-modal"
import { ErrorBoundary } from "@/components/error-boundary"
import { useProfile } from "@/hooks/use-profile"
import { usePresenceHeartbeat } from "@/hooks/use-presence-heartbeat"
import { isNativeRuntime } from "@/lib/auth-redirect"
import { triggerSuccessHaptic } from "@/lib/haptics"
import { isProfileComplete } from "@/lib/profile-completion"
import { Bell, Compass, HomeIcon, MessageCircle, Plus, UserIcon } from "lucide-react"

type AppTab = "feed" | "discover" | "create" | "messages" | "profile"

export default function Home() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const { profile, isLoading: profileLoading } = useProfile({ enabled: !isLoading && isAuthenticated, userId: user?.id })
  const [activeTab, setActiveTab] = useState<AppTab>("feed")
  const [mountedTabs, setMountedTabs] = useState<Set<AppTab>>(() => new Set(["feed"]))
  const [showCreate, setShowCreate] = useState(false)
  const [pendingConversationId, setPendingConversationId] = useState<string | undefined>(undefined)
  const showPublicFooter = !isAuthenticated && !isNativeRuntime()
  const authHydratedRef = useRef(false)
  const wasAuthenticatedRef = useRef(false)
  const pendingLoginHapticRef = useRef(false)

  usePresenceHeartbeat(isAuthenticated)

  useEffect(() => {
    if (isLoading) return

    if (!authHydratedRef.current) {
      authHydratedRef.current = true
      wasAuthenticatedRef.current = isAuthenticated
      return
    }

    if (!wasAuthenticatedRef.current && isAuthenticated) {
      pendingLoginHapticRef.current = true
    }

    if (!isAuthenticated) {
      pendingLoginHapticRef.current = false
    }

    wasAuthenticatedRef.current = isAuthenticated
  }, [isAuthenticated, isLoading])

  useEffect(() => {
    if (!pendingLoginHapticRef.current || !isAuthenticated || profileLoading) return
    triggerSuccessHaptic()
    pendingLoginHapticRef.current = false
  }, [isAuthenticated, profileLoading])

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const urlTab = searchParams.get("tab") as AppTab | null
    const conversationId = searchParams.get("conversation") ?? undefined

    if (urlTab === "messages") {
      if (conversationId) setPendingConversationId(conversationId)
      setActiveTab("messages")
      window.history.replaceState(null, "", "/")
      return
    }

    const storedTab = sessionStorage.getItem("drift-open-tab") as AppTab | null
    if (!storedTab || !["feed", "discover", "messages", "profile"].includes(storedTab)) return
    sessionStorage.removeItem("drift-open-tab")
    setActiveTab(storedTab)
  }, [])

  useEffect(() => {
    setMountedTabs((current) => {
      if (current.has(activeTab)) return current
      const next = new Set(current)
      next.add(activeTab)
      return next
    })
  }, [activeTab])

  const handleNavigateToMessages = (conversationId: string) => {
    setPendingConversationId(conversationId)
    setActiveTab("messages")
  }

  const handleTabChange = (tab: AppTab) => {
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
    return <StartupAppShell />
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
        <div className="fixed top-[calc(0.75rem+var(--drift-safe-top))] right-3 z-50">
          <NotificationsBell />
        </div>
      )}

      {/* Main Content Area */}
      <div className="pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        {mountedTabs.has("feed") && (
          <section className={activeTab === "feed" ? "block" : "hidden"} aria-hidden={activeTab !== "feed"}>
            <ErrorBoundary title="Today">
              <FeedView onNavigateToMessages={handleNavigateToMessages} />
            </ErrorBoundary>
          </section>
        )}
        {mountedTabs.has("discover") && (
          <section className={activeTab === "discover" ? "block" : "hidden"} aria-hidden={activeTab !== "discover"}>
            <ErrorBoundary title="Discover">
              <DiscoverView onNavigateToMessages={handleNavigateToMessages} />
            </ErrorBoundary>
          </section>
        )}
        {mountedTabs.has("messages") && (
          <section className={activeTab === "messages" ? "block" : "hidden"} aria-hidden={activeTab !== "messages"}>
            <ErrorBoundary title="Messages">
              {isAuthenticated
                ? <MessagesView initialConversationId={pendingConversationId} onBrowsePeople={() => setActiveTab("discover")} />
                : <AuthPrompt message="Sign in to see your messages" />
              }
            </ErrorBoundary>
          </section>
        )}
        {mountedTabs.has("profile") && (
          <section className={activeTab === "profile" ? "block" : "hidden"} aria-hidden={activeTab !== "profile"}>
            <ErrorBoundary title="Profile">
              {isAuthenticated ? <ProfileView /> : <AuthPrompt message="Sign in to view your profile" />}
            </ErrorBoundary>
          </section>
        )}
      </div>

      {showPublicFooter && (
        <footer className="mx-auto flex max-w-lg items-center justify-center gap-4 px-4 pb-[calc(6.75rem+env(safe-area-inset-bottom))] pt-2 text-xs text-muted-foreground">
          <Link className="transition-colors hover:text-foreground" href="/legal/privacy">
            Privacy Policy
          </Link>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/40" aria-hidden="true" />
          <Link className="transition-colors hover:text-foreground" href="/legal/terms">
            Terms of Service
          </Link>
        </footer>
      )}

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Create Meetup Modal */}
      {isAuthenticated && (
        <CreateMeetup open={showCreate} onOpenChange={setShowCreate} />
      )}
    </main>
  )
}

function StartupAppShell() {
  const navItems = [
    { icon: HomeIcon, label: "Today", active: true },
    { icon: Compass, label: "Discover" },
    { icon: Plus, label: "Create", create: true },
    { icon: MessageCircle, label: "Messages" },
    { icon: UserIcon, label: "Profile" },
  ]

  return (
    <main className="min-h-dvh bg-background relative film-grain overflow-hidden">
      <div className="max-w-lg mx-auto px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[var(--drift-safe-top)]">
        <header className="flex items-start justify-between gap-4 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-serif font-semibold tracking-tight">Today</h1>
              <img src="/drift-logo.png" alt="" className="h-6 w-6 rounded-[7px]" aria-hidden="true" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Finding your people nearby...</p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-card/80 text-muted-foreground">
            <Bell className="h-5 w-5" />
          </div>
        </header>

        <section className="mt-3 rounded-3xl border border-primary/20 bg-card/80 p-5 shadow-2xl shadow-primary/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold text-foreground">Today on Drift</p>
              <p className="mt-1 text-sm text-muted-foreground">Preparing your plans and people.</p>
            </div>
            <div className="h-10 w-10 rounded-2xl drift-gradient opacity-90" />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {["nearby", "saved", "people"].map((label) => (
              <div key={label} className="rounded-2xl bg-background/70 p-4 text-center">
                <div className="mx-auto h-6 w-10 animate-pulse rounded-full bg-primary/25" />
                <p className="mt-3 text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 space-y-3">
          <div className="h-5 w-36 rounded-full bg-card animate-pulse" />
          <div className="rounded-3xl border border-border bg-card p-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-secondary animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-28 rounded-full bg-secondary animate-pulse" />
                <div className="h-3 w-40 rounded-full bg-secondary/80 animate-pulse" />
              </div>
              <div className="h-11 w-20 rounded-full bg-primary/25 animate-pulse" />
            </div>
          </div>
        </section>
      </div>

      <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(0.55rem+env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto mx-auto grid h-[76px] max-w-lg grid-cols-5 items-center gap-1 overflow-hidden rounded-[2.35rem] border border-white/[0.13] bg-[#10131a]/72 px-1.5 shadow-[0_18px_46px_rgb(0_0_0_/_0.38),inset_0_1px_0_rgb(255_255_255_/_0.12)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[#10131a]/58">
          {navItems.map((item) => (
            <div
              key={item.label}
              className="relative flex h-[62px] min-w-0 flex-col items-center justify-center gap-1 rounded-[1.75rem] px-1 text-white/62"
            >
              {item.create ? (
                <div className="drift-nav-create flex h-[52px] w-[52px] items-center justify-center rounded-[1.35rem]">
                  <item.icon className="h-6 w-6 text-primary-foreground" />
                </div>
              ) : (
                <>
                  {item.active && (
                    <div className="absolute inset-y-1.5 inset-x-1 rounded-[1.85rem] border border-white/[0.14] bg-white/[0.13] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.16),0_10px_26px_rgb(99_102_241_/_0.18)]" />
                  )}
                  <item.icon className={item.active ? "relative h-[22px] w-[22px] text-[var(--drift-purple)]" : "relative h-[22px] w-[22px]"} />
                  <span className={item.active ? "relative max-w-full truncate text-[10px] font-medium leading-none text-[var(--drift-purple)]" : "relative max-w-full truncate text-[10px] font-medium leading-none"}>{item.label}</span>
                </>
              )}
            </div>
          ))}
        </div>
      </nav>
    </main>
  )
}
