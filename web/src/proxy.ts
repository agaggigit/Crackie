import { NextResponse, type NextRequest } from "next/server";

// Dua domain, satu project: landing di crackie.xyz, aplikasi di app.crackie.xyz.
// Host lain (*.vercel.app, localhost) tidak diubah, jadi /app tetap bisa dipakai di sana.
const LANDING_HOST = "crackie.xyz";
const APP_HOST = "app.crackie.xyz";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0];
  const { pathname, search } = request.nextUrl;

  // crackie.xyz/app/... pindah ke app.crackie.xyz/... (tombol di landing memakai /app).
  if (host === LANDING_HOST && (pathname === "/app" || pathname.startsWith("/app/"))) {
    return NextResponse.redirect(`https://${APP_HOST}${pathname.slice(4) || "/"}${search}`, 308);
  }

  if (host === APP_HOST) {
    // Tautan internal app memakai /app/..., di subdomain cukup /...
    if (pathname === "/app" || pathname.startsWith("/app/")) {
      return NextResponse.redirect(`https://${APP_HOST}${pathname.slice(4) || "/"}${search}`, 308);
    }
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/app" : `/app${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  // API, aset Next.js, dan file statis (maskot, favicon) tidak lewat proxy.
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
