export const ADMIN_EMAILS = ["aweandco@gmail.com"]

export function isAdminEmail(email: string | null | undefined): boolean {
  return Boolean(email && ADMIN_EMAILS.includes(email.toLowerCase()))
}
