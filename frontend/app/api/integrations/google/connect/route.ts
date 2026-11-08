import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser, canManageSettingsOrUsers } from "@/lib/auth/session";
import { generateOpaqueToken } from "@/lib/security/crypto";
import { buildGoogleBusinessOAuthUrl } from "@/lib/integrations/google";

const OAUTH_STATE_COOKIE = "espacioq_google_oauth_state";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const baseUrl = process.env.APP_URL || new URL(request.url).origin;

  if (!user || !canManageSettingsOrUsers(user)) {
    return NextResponse.redirect(new URL("/acceso", baseUrl));
  }

  const stateToken = generateOpaqueToken(24);
  const authUrl = buildGoogleBusinessOAuthUrl(stateToken);
  if (!authUrl) {
    return NextResponse.redirect(
      new URL("/admin/horarios?google_error=missing_credentials", baseUrl)
    );
  }

  cookies().set(OAUTH_STATE_COOKIE, stateToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(authUrl);
}
