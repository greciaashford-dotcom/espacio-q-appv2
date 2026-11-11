import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { ScrollToTopOnNavigate } from "@/components/scroll-to-top-on-navigate";
import { SALON_GEO, SHARE_IMAGE, SITE_URL, isIndexableHost } from "@/lib/seo/site";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#E9E4D8" },
    { media: "(prefers-color-scheme: dark)", color: "#141414" },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const h = headers();
  const indexable = isIndexableHost(h.get("x-forwarded-host") || h.get("host"));
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: "ESPACIO Q · Peluquería y salón de belleza en Chueca, Madrid",
      template: "%s · ESPACIO Q Madrid",
    },
    description:
      "Peluquería y salón de belleza en Chueca, Madrid (Calle de Pelayo 41). Corte, color, head spa, estilismo y estética con reserva online.",
    applicationName: "ESPACIO Q",
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
    alternates: { languages: { "es-ES": "/" } },
    openGraph: {
      type: "website",
      locale: "es_ES",
      siteName: "ESPACIO Q",
      title: "ESPACIO Q · Peluquería y salón de belleza en Chueca, Madrid",
      description:
        "Peluquería y salón de belleza en Chueca, Madrid. Estilismo, cuidado capilar y rituales de belleza personalizados.",
      images: [SHARE_IMAGE],
    },
    twitter: { card: "summary_large_image", images: [SHARE_IMAGE.url] },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      shortcut: "/favicon.ico",
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    manifest: "/manifest.webmanifest",
    other: {
      "geo.region": SALON_GEO.region,
      "geo.placename": SALON_GEO.placename,
      "geo.position": `${SALON_GEO.lat};${SALON_GEO.lng}`,
      ICBM: `${SALON_GEO.lat}, ${SALON_GEO.lng}`,
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${cormorant.variable} ${manrope.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-[100dvh] bg-background font-sans text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
        <Suspense fallback={null}>
          <ScrollToTopOnNavigate />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
