import { NextResponse, type NextRequest } from "next/server";

/**
 * Primera barrera: sin cookie de sesión no se entra a /admin.
 * La validación real de sesión y permisos se hace SIEMPRE en servidor
 * (layout de admin, server actions y route handlers), no solo aquí.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin")) {
    const hasSession = req.cookies.get("espacioq_session")?.value;
    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/acceso";
      url.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
