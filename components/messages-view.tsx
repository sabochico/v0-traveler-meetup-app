"use client"

import { Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"

const CONVERSATIONS = [
  {
    id: "1",
    user: {
      name: "Mika",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
      online: true,
    },
    lastMessage: "See you at the cafe in 20 min!",
    time: "2m ago",
    unread: 2,
  },
  {
    id: "2",
    user: {
      name: "Leo",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
      online: false,
    },
    lastMessage: "That ramen spot was incredible, thanks for the recommendation",
    time: "1h ago",
    unread: 0,
  },
  {
    id: "3",
    user: {
      name: "Sofia",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
      online: true,
    },
    lastMessage: "Are you free tomorrow evening? Want to explore Akihabara",
    time: "3h ago",
    unread: 1,
  },
  {
    id: "4",
    user: {
      name: "Kai",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
      online: false,
    },
    lastMessage: "The photos came out amazing! Sending them now",
    time: "Yesterday",
    unread: 0,
  },
  {
    id: "5",
    user: {
      name: "Yuki",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
      online: false,
    },
    lastMessage: "Welcome to Tokyo! Let me know if you need any tips",
    time: "2 days ago",
    unread: 0,
  },
]

export function MessagesView() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
          <h1 className="text-2xl font-serif font-semibold">Messages</h1>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="bg-secondary border-0 pl-10 text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </header>

      {/* Conversations */}
      <div className="max-w-lg mx-auto divide-y divide-border/50">
        {CONVERSATIONS.map((conversation) => (
          <button
            key={conversation.id}
            className="w-full flex items-center gap-4 p-4 hover:bg-card/50 transition-colors text-left"
          >
            <div className="relative">
              <Avatar className="w-14 h-14">
                <AvatarImage src={conversation.user.avatar} alt={conversation.user.name} />
                <AvatarFallback>{conversation.user.name[0]}</AvatarFallback>
              </Avatar>
              {conversation.user.online && (
                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-foreground">{conversation.user.name}</h3>
                <span className="text-xs text-muted-foreground">{conversation.time}</span>
              </div>
              <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
            </div>

            {conversation.unread > 0 && (
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
                {conversation.unread}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
