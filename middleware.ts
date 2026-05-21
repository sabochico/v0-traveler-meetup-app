import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Auth protection is handled at the component level via useAuth hook
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
