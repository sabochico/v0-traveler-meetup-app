export default function CommunityGuidelinesPage() {
  return (
    <main className="min-h-dvh bg-background px-5 py-8 text-foreground">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">Last updated: May 31, 2026</p>
          <h1 className="mt-2 text-3xl font-semibold">Community Guidelines</h1>
        </div>

        <section className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>Drift is for real-world connection. Treat people with respect and help keep meetups safe.</p>
          <p>No harassment, hate, threats, bullying, spam, scams, impersonation, or unwanted sexual behavior.</p>
          <p>Use honest profile information. Do not pressure users to meet, share private details, or leave the app.</p>
          <p>Meet in public places, tell someone where you are going, and leave if anything feels wrong.</p>
          <p>Report unsafe behavior or request support by emailing <a className="text-primary" href="mailto:aweandco@gmail.com">aweandco@gmail.com</a>.</p>
        </section>
      </div>
    </main>
  )
}
