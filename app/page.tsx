"use client"

import { useEffect, useState } from "react"
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
import { Bell, Compass, HomeIcon, MessageCircle, Plus, UserIcon } from "lucide-react"

type AppTab = "feed" | "discover" | "create" | "messages" | "profile"

export default function Home() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const { profile, isLoading: profileLoading } = useProfile({ enabled: !isLoading && isAuthenticated, userId: user?.id })
  const [activeTab, setActiveTab] = useState<AppTab>("feed")
  const [mountedTabs, setMountedTabs] = useState<Set<AppTab>>(() => new Set(["feed"]))
  const [showCreate, setShowCreate] = useState(false)
  const [pendingConversationId, setPendingConversationId] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (sessionStorage.getItem("drift-open-tab") !== "profile") return
    sessionStorage.removeItem("drift-open-tab")
    setActiveTab("profile")
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
            <FeedView onNavigateToMessages={handleNavigateToMessages} />
          </section>
        )}
        {mountedTabs.has("discover") && (
          <section className={activeTab === "discover" ? "block" : "hidden"} aria-hidden={activeTab !== "discover"}>
            <DiscoverView onNavigateToMessages={handleNavigateToMessages} />
          </section>
        )}
        {mountedTabs.has("messages") && (
          <section className={activeTab === "messages" ? "block" : "hidden"} aria-hidden={activeTab !== "messages"}>
            {isAuthenticated
              ? <MessagesView initialConversationId={pendingConversationId} />
              : <AuthPrompt message="Sign in to see your messages" />
            }
          </section>
        )}
        {mountedTabs.has("profile") && (
          <section className={activeTab === "profile" ? "block" : "hidden"} aria-hidden={activeTab !== "profile"}>
            {isAuthenticated ? <ProfileView /> : <AuthPrompt message="Sign in to view your profile" />}
          </section>
        )}
      </div>

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
              <DriftLogo markClassName="h-6 w-6" />
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

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between px-2 py-2">
          {navItems.map((item) => (
            <div
              key={item.label}
              className="flex flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-muted-foreground"
            >
              <div
                className={
                  item.create
                    ? "flex h-14 w-14 -mt-6 items-center justify-center rounded-2xl drift-gradient-button"
                    : item.active
                      ? "flex h-9 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary"
                      : "flex h-9 w-14 items-center justify-center"
                }
              >
                <item.icon className={item.create ? "h-7 w-7 text-primary-foreground" : "h-6 w-6"} />
              </div>
              {!item.create && <span className="text-[10px] font-medium">{item.label}</span>}
            </div>
          ))}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </main>
  )
}
