import { ESPACIO_Q_LOCATION_METADATA } from "@/lib/domain/default-services-catalog";

export type SalonLocation = {
  name: string;
  addressLine: string;
  postalCode: string;
  city: string;
  latitude: number;
  longitude: number;
};

export function getSalonLocation(meta: {
  brandName?: string | null;
  addressLine?: string | null;
  postalCode?: string | null;
  city?: string | null;
}): SalonLocation {
  return {
    name: meta.brandName || "ESPACIO Q",
    addressLine: meta.addressLine || ESPACIO_Q_LOCATION_METADATA.addressLine,
    postalCode: meta.postalCode || ESPACIO_Q_LOCATION_METADATA.postalCode,
    city: meta.city || ESPACIO_Q_LOCATION_METADATA.city,
    latitude: ESPACIO_Q_LOCATION_METADATA.latitude,
    longitude: ESPACIO_Q_LOCATION_METADATA.longitude,
  };
}

export const formatSalonDestination = (loc: SalonLocation) =>
  `${loc.name}, ${loc.addressLine.replace(/,\s*(\d+)/, " $1")}, ${loc.postalCode} ${loc.city}`;

export const buildDirectionsUrl = (loc: SalonLocation) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formatSalonDestination(loc))}`;

export const buildGoogleEmbedUrl = (loc: SalonLocation) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(formatSalonDestination(loc))}&ll=${loc.latitude},${loc.longitude}&z=17&hl=es&output=embed`;
