import { NextResponse, type NextRequest } from 'next/server'

// Auth is handled at component level - this is a no-op middleware helper
export async function updateSession(request: NextRequest) {
  return NextResponse.next()
}
