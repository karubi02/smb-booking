import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const PUBLIC_PATH_PREFIXES = ["/auth", "/public/schedule"]

function isStaticAsset(pathname: string) {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|woff|woff2|ttf|eot)$/)
  )
}

function requiresAuthentication(pathname: string) {
  if (pathname === "/") return false
  if (PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return false

  // Public slug pages are single path segments that are not dashboard/auth/api
  const segments = pathname.split("/").filter(Boolean)
  const isPublicSlug =
    segments.length === 1 &&
    !pathname.startsWith("/dashboard") &&
    !pathname.startsWith("/api")

  if (isPublicSlug) return false

  // Dashboard (and anything nested) requires auth
  if (pathname.startsWith("/dashboard")) {
    return true
  }

  return false
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isStaticAsset(pathname)) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  if (!requiresAuthentication(pathname)) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
