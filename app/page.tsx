"use client"

import { useState } from "react"
import { BottomNav } from "@/components/bottom-nav"
import { FeedView } from "@/components/feed-view"
import { DiscoverView } from "@/components/discover-view"
import { CreateMeetup } from "@/components/create-meetup"
import { MessagesView } from "@/components/messages-view"
import { ProfileView } from "@/components/profile-view"

export default function Home() {
  const [activeTab, setActiveTab] = useState<"feed" | "discover" | "create" | "messages" | "profile">("feed")
  const [showCreate, setShowCreate] = useState(false)

  const handleTabChange = (tab: "feed" | "discover" | "create" | "messages" | "profile") => {
    if (tab === "create") {
      setShowCreate(true)
    } else {
      setActiveTab(tab)
    }
  }

  return (
    <main className="min-h-screen bg-background relative film-grain">
      {/* Main Content Area */}
      <div className="pb-20">
        {activeTab === "feed" && <FeedView />}
        {activeTab === "discover" && <DiscoverView />}
        {activeTab === "messages" && <MessagesView />}
        {activeTab === "profile" && <ProfileView />}
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Create Meetup Modal */}
      <CreateMeetup open={showCreate} onOpenChange={setShowCreate} />
    </main>
  )
}
