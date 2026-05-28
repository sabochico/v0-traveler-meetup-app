"use client"

import { useState } from "react"
// Force rebuild - no middleware files exist
import { useAuth } from "@/hooks/use-auth"
import { BottomNav } from "@/components/bottom-nav"
import { FeedView } from "@/components/feed-view"
import { DiscoverView } from "@/components/discover-view"
import { CreateMeetup } from "@/components/create-meetup"
import { MessagesView } from "@/components/messages-view"
import { ProfileView } from "@/components/profile-view"
import { AuthPrompt } from "@/components/auth-prompt"
import { Loader2 } from "lucide-react"

export default function Home() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState<"feed" | "discover" | "create" | "messages" | "profile">("feed")
  const [showCreate, setShowCreate] = useState(false)
  const [pendingConversationId, setPendingConversationId] = useState<string | undefined>(undefined)

  const handleNavigateToMessages = (conversationId: string) => {
    setPendingConversationId(conversationId)
    setActiveTab("messages")
  }

  const handleTabChange = (tab: "feed" | "discover" | "create" | "messages" | "profile") => {
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

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center film-grain">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading drift...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background relative film-grain">
      {/* Main Content Area */}
      <div className="pb-20">
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
