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
  BookOpen
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

const USER_PROFILE = {
  name: "You",
  username: "@drifter",
  avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&crop=face",
  coverPhoto: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=400&fit=crop",
  bio: "Digital nomad exploring Asia. Looking for coffee buddies and late-night conversations.",
  location: "Tokyo, Japan",
  homeCountry: "Berlin, Germany",
  languages: ["English", "Deutsch", "日本語 (Learning)"],
  interests: ["Photography", "Coffee", "Night walks", "Vinyl", "Cooking"],
  travelStatus: "traveling",
  stats: {
    meetups: 12,
    connections: 34,
    cities: 8,
  },
  badges: [
    { id: "early", label: "Early Drifter", icon: Plane },
    { id: "coffee", label: "Coffee Lover", icon: Coffee },
    { id: "foodie", label: "Foodie", icon: Utensils },
    { id: "bookworm", label: "Bookworm", icon: BookOpen },
  ],
}

export function ProfileView() {
  const [travelMode, setTravelMode] = useState(true)
  const [anonymousMode, setAnonymousMode] = useState(false)

  return (
    <div className="min-h-screen pb-8">
      {/* Cover Photo */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={USER_PROFILE.coverPhoto}
          alt="Cover"
          className="w-full h-full object-cover"
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        {/* Settings Button */}
        <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background/80 transition-colors" aria-label="Settings">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Profile Info */}
      <div className="max-w-lg mx-auto px-4 -mt-16 relative">
        {/* Avatar */}
        <div className="relative inline-block mb-4">
          <Avatar className="w-28 h-28 ring-4 ring-background">
            <AvatarImage src={USER_PROFILE.avatar} alt={USER_PROFILE.name} />
            <AvatarFallback>YO</AvatarFallback>
          </Avatar>
          <button className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center" aria-label="Change photo">
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Name & Bio */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-serif font-semibold">{USER_PROFILE.name}</h1>
            <button className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Edit profile">
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{USER_PROFILE.username}</p>
          <p className="text-foreground leading-relaxed">{USER_PROFILE.bio}</p>
        </div>

        {/* Location Info */}
        <div className="flex flex-wrap gap-4 mb-6 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary" />
            <span>{USER_PROFILE.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Globe className="w-4 h-4" />
            <span>From {USER_PROFILE.homeCountry}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 rounded-xl bg-card border border-border/50">
            <p className="text-2xl font-semibold text-primary">{USER_PROFILE.stats.meetups}</p>
            <p className="text-xs text-muted-foreground">Meetups</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-card border border-border/50">
            <p className="text-2xl font-semibold text-primary">{USER_PROFILE.stats.connections}</p>
            <p className="text-xs text-muted-foreground">Connections</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-card border border-border/50">
            <p className="text-2xl font-semibold text-primary">{USER_PROFILE.stats.cities}</p>
            <p className="text-xs text-muted-foreground">Cities</p>
          </div>
        </div>

        {/* Badges */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-foreground mb-3">Badges</h2>
          <div className="flex flex-wrap gap-2">
            {USER_PROFILE.badges.map((badge) => (
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
            {USER_PROFILE.languages.map((lang) => (
              <Badge key={lang} variant="secondary">
                {lang}
              </Badge>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-foreground mb-3">Interests</h2>
          <div className="flex flex-wrap gap-2">
            {USER_PROFILE.interests.map((interest) => (
              <Badge key={interest} variant="outline" className="border-border text-foreground">
                {interest}
              </Badge>
            ))}
          </div>
        </div>

        {/* Social Links */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-foreground mb-3">Social</h2>
          <button className="flex items-center gap-3 w-full p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
            <Instagram className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-foreground">Connect Instagram</span>
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
            <Switch checked={travelMode} onCheckedChange={setTravelMode} />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Anonymous Mode</p>
                <p className="text-xs text-muted-foreground">Hide your profile from discovery</p>
              </div>
            </div>
            <Switch checked={anonymousMode} onCheckedChange={setAnonymousMode} />
          </div>

          <button className="flex items-center gap-3 w-full p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Notifications</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
          </button>

          <button className="flex items-center gap-3 w-full p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
            <Moon className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Appearance</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
          </button>
        </div>
      </div>
    </div>
  )
}
