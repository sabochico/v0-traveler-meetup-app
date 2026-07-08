import { LegalPage } from "../legal-page"

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updatedAt="May 31, 2026">
          <p>
            By using Drift, you agree to use the app respectfully, legally, and safely. You are responsible for your
            account, profile, messages, meetups, and interactions with other users.
          </p>
          <p>
            You may not use Drift for harassment, scams, spam, illegal activity, impersonation, threats, explicit
            exploitation, or behavior that puts other users at risk.
          </p>
          <p>
            Drift helps users discover people and plans, but Drift does not supervise meetups or verify every user.
            Meet in public places, use your judgment, and leave any situation that feels unsafe.
          </p>
          <p>
            We may limit, suspend, or remove accounts that violate these terms, community guidelines, law, or user
            safety expectations.
          </p>
          <p>
            Drift has zero tolerance for objectionable content and abusive users. Users can report or block other
            users from their profiles, and reports are reviewed through Drift&apos;s moderation tools.
          </p>
          <p>
            Drift is provided as available. To the fullest extent allowed by law, Drift is not liable for offline
            interactions, user conduct, lost data, service interruptions, or indirect damages.
          </p>
          <p>
            Questions or account requests can be sent to <a className="text-primary" href="mailto:aweandco@gmail.com">aweandco@gmail.com</a>.
          </p>
    </LegalPage>
  )
}
