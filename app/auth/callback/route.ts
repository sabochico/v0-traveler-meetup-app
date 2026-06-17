import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const NATIVE_AUTH_CALLBACK_URL = 'com.aweandco.drift://auth/callback'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function nativeBridgeResponse(nativeUrl: string) {
  const safeUrl = escapeHtml(nativeUrl)

  return new NextResponse(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Return to Drift</title>
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 32px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: #f8fafc;
        background: radial-gradient(circle at top left, rgba(37, 99, 235, 0.34), transparent 35%),
          linear-gradient(135deg, #05070d 0%, #08111f 48%, #041817 100%);
      }
      main { width: min(100%, 360px); text-align: center; }
      h1 { margin: 0 0 10px; font-size: 28px; letter-spacing: -0.03em; }
      p { margin: 0 0 24px; color: rgba(248, 250, 252, 0.68); line-height: 1.45; }
      a {
        display: inline-flex;
        min-height: 48px;
        align-items: center;
        justify-content: center;
        width: 100%;
        border-radius: 999px;
        color: white;
        text-decoration: none;
        font-weight: 700;
        background: linear-gradient(135deg, #2f6bff, #08c8cf);
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Returning to Drift</h1>
      <p>If Drift does not open automatically, tap the button below.</p>
      <a href="${safeUrl}">Return to Drift</a>
    </main>
    <script>
      window.location.href = "${safeUrl}";
    </script>
  </body>
</html>`,
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    }
  )
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/auth/verified'
  const oauthError = searchParams.get('error_description') ?? searchParams.get('error')
  const isNativeCallback = searchParams.get('native') === '1'

  if (isNativeCallback) {
    const url = new URL(NATIVE_AUTH_CALLBACK_URL)
    url.searchParams.set('next', next)

    if (oauthError) {
      url.searchParams.set('error', oauthError)
    } else if (code) {
      url.searchParams.set('code', code)
    }

    return nativeBridgeResponse(url.toString())
  }

  if (oauthError) {
    const url = new URL('/auth/error', origin)
    url.searchParams.set('message', oauthError)
    return NextResponse.redirect(url)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
