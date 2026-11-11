import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ESPACIO Q · Peluquería y salón de belleza en Chueca, Madrid",
    short_name: "ESPACIO Q",
    description: "Peluquería y salón de belleza en Chueca, Madrid. Reserva tu cita online.",
    start_url: "/",
    display: "standalone",
    background_color: "#F3F3F3",
    theme_color: "#E9E4D8",
    lang: "es-ES",
    icons: [
      { src: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { src: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
