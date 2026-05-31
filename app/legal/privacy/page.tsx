export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-dvh bg-background px-5 py-8 text-foreground">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">Last updated: May 31, 2026</p>
          <h1 className="mt-2 text-3xl font-semibold">Privacy Policy</h1>
        </div>

        <section className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>
            Drift helps travelers and locals meet in real life. We collect the information needed to run accounts,
            profiles, discovery, meetups, messaging, notifications, and safety features.
          </p>
          <p>
            Information you provide may include your email, display name, profile photo, bio, location, interests,
            languages, Instagram handle, meetups, saved items, messages, and settings.
          </p>
          <p>
            Drift uses Supabase for authentication, database storage, file storage, and app infrastructure. Profile
            photos and account data may be stored with Supabase or connected service providers.
          </p>
          <p>
            Location and profile information may be shown to other users so they can discover nearby people and plans.
            Do not add information to your profile that you do not want other users to see.
          </p>
          <p>
            We use your information to operate Drift, improve the app, prevent abuse, support users, and comply with
            legal obligations. We do not sell your personal information.
          </p>
          <p>
            To request support, data access, or account deletion, contact <a className="text-primary" href="mailto:aweandco@gmail.com">aweandco@gmail.com</a>.
          </p>
        </section>
      </div>
    </main>
  )
}
