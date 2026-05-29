function PersonCard({ person, isMock }: { person: Profile; isMock: boolean }) {
  const [messageSent, setMessageSent] = useState(false)
  const [sending, setSending] = useState(false)
  const { startConversation } = useCreateConversation()

  const mood = (person.mood as MoodStatus) ?? "exploring"
  const moodStyle = STATUS_STYLES[mood] ?? STATUS_STYLES.exploring
  const displayName = person.display_name ?? "Anonymous"
  const initial = displayName[0]?.toUpperCase() ?? "U"

  const isOnline =
    Boolean(person.is_online) ||
    Boolean(
      person.last_seen_at &&
        Date.now() - new Date(person.last_seen_at).getTime() < 2 * 60 * 1000
    )

  const location =
    [person.current_city, person.current_country].filter(Boolean).join(", ") ||
    person.location ||
    "Location not shared"

  const interests = person.interests ?? []
  const languages = person.languages ?? []

  const handleSayHi = async () => {
    if (isMock) {
      setSending(true)
      setTimeout(() => {
        setSending(false)
        setMessageSent(true)
      }, 500)
      return
    }

    try {
      setSending(true)
      await startConversation(person.id)
      setMessageSent(true)
    } catch (error) {
      console.error("Failed to start conversation:", error)
    } finally {
      setSending(false)
    }
  }

  return (
    <article className="rounded-3xl bg-card border border-border/60 p-4 hover:border-primary/40 transition-all duration-300">
      <div className="flex gap-4">
        <Link href={isMock ? "#" : `/profile/${person.id}`} className="relative flex-shrink-0">
          <Avatar className="w-20 h-20 ring-2 ring-primary/20">
            <AvatarImage src={person.avatar_url ?? undefined} alt={displayName} />
            <AvatarFallback className="text-xl">{initial}</AvatarFallback>
          </Avatar>

          <span
            className={cn(
              "absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-card",
              isOnline ? "bg-emerald-500" : "bg-muted"
            )}
          />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={isMock ? "#" : `/profile/${person.id}`}
                className="font-semibold text-lg text-foreground hover:text-primary transition-colors truncate block"
              >
                {displayName}
              </Link>

              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span className={cn("w-2 h-2 rounded-full", isOnline ? "bg-emerald-500" : "bg-muted")} />
                <span>{isOnline ? "Online now" : "Offline"}</span>
              </div>
            </div>

            <Badge variant="secondary" className="text-xs shrink-0">
              {person.travel_mode ? "Traveler" : "Local"}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-secondary",
                moodStyle.color
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", moodStyle.color)} />
              {moodStyle.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mt-4 line-clamp-2">
        {person.bio ?? "No bio yet."}
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
            Languages
          </p>
          {languages.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {languages.slice(0, 3).map((lang) => (
                <Badge key={lang} variant="secondary" className="text-xs">
                  {lang}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No languages added</p>
          )}
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
            Interests
          </p>
          {interests.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {interests.slice(0, 3).map((interest) => (
                <Badge key={interest} variant="outline" className="text-xs">
                  {interest}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No interests added</p>
          )}
        </div>
      </div>

      <button
        onClick={handleSayHi}
        disabled={messageSent || sending}
        className={cn(
          "mt-4 w-full h-11 rounded-2xl text-sm font-medium transition-all flex items-center justify-center gap-2",
          messageSent
            ? "bg-emerald-500/20 text-emerald-400 cursor-default"
            : "bg-primary text-primary-foreground hover:opacity-90"
        )}
      >
        {sending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : messageSent ? (
          <>
            <Check className="w-4 h-4" />
            <span>Sent</span>
          </>
        ) : (
          <>
            <MessageCircle className="w-4 h-4" />
            <span>Say Hi</span>
          </>
        )}
      </button>
    </article>
  )
}