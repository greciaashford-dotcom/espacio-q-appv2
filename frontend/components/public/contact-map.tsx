"use client";

import "leaflet/dist/leaflet.css";
import React, { useEffect, useRef, useState } from "react";
import { MapPinOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONSENT_EVENT, grantMapsConsent, readConsent } from "@/lib/consent/cookie-consent";

export const MAP_LABEL = "Mapa de ubicación de ESPACIO Q";

type MapProps = { lat: number; lng: number; name: string; address: string; googleEmbedUrl: string };

function useMapsConsent() {
  const [consent, setConsent] = useState<boolean | null>(null);
  useEffect(() => {
    const sync = () => setConsent(Boolean(readConsent()?.maps));
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CONSENT_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return consent;
}

function OsmMap({ lat, lng, name, address }: Omit<MapProps, "googleEmbedUrl">) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let map: import("leaflet").Map | undefined;
    let cancelled = false;
    import("leaflet")
      .then(({ default: L }) => {
        if (cancelled || !ref.current) return;
        map = L.map(ref.current, { center: [lat, lng], zoom: 17, scrollWheelZoom: false, keyboard: true });
        map.attributionControl.setPrefix(false);
        let errors = 0;
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
        })
          .on("tileerror", () => {
            errors += 1;
            if (errors >= 3) setFailed(true);
          })
          .addTo(map);
        const icon = L.divIcon({
          className: "",
          html: '<span class="block h-7 w-7 -rotate-45 rounded-full rounded-bl-none border-2 border-card bg-primary shadow-editorial"></span>',
          iconSize: [28, 28],
          iconAnchor: [14, 28],
          popupAnchor: [0, -26],
        });
        const popup = document.createElement("div");
        const strong = document.createElement("strong");
        strong.textContent = name;
        popup.append(strong, document.createElement("br"), document.createTextNode(address));
        L.marker([lat, lng], { icon, title: name, alt: `${name} · ${address}`, keyboard: true })
          .addTo(map)
          .bindPopup(popup);
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lat, lng, name, address]);

  return (
    <>
      <div
        ref={ref}
        role="region"
        aria-label={MAP_LABEL}
        data-testid="contact-map-osm"
        data-lat={lat}
        data-lng={lng}
        className="h-full w-full"
      />
      {failed && (
        <div data-testid="contact-map-error" className="absolute inset-0 z-[500] flex flex-col items-center justify-center gap-2 bg-secondary/95 p-6 text-center text-sm text-muted-foreground">
          <MapPinOff className="h-5 w-5" aria-hidden="true" />
          <p>No se ha podido cargar el mapa. La dirección y el botón «Cómo llegar» siguen disponibles.</p>
        </div>
      )}
    </>
  );
}

function GoogleMapEmbed({ src }: { src: string }) {
  return (
    <iframe
      src={src}
      title={MAP_LABEL}
      aria-label={MAP_LABEL}
      data-testid="contact-map-google"
      className="h-full w-full border-0"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    />
  );
}

function GoogleConsentNotice({ onCancel }: { onCancel: () => void }) {
  return (
    <div role="region" aria-label="Aviso de cookies de Google Maps" data-testid="contact-map-consent-notice" className="space-y-3 rounded-editorial border border-border bg-card p-4 text-sm">
      <p className="flex items-start gap-2 text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span>
          Google Maps es un servicio de Google que puede instalar cookies y tratar datos de navegación. Al cargarlo activas la categoría
          «Mapas de terceros (Google Maps)»; puedes retirarla cuando quieras en las preferencias de cookies.
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" data-testid="contact-map-accept-google-btn" onClick={() => grantMapsConsent()}>
          Aceptar y cargar Google Maps
        </Button>
        <Button type="button" size="sm" variant="ghost" data-testid="contact-map-cancel-google-btn" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

export function ContactMap(props: MapProps & { children?: React.ReactNode }) {
  const consent = useMapsConsent();
  const [askGoogle, setAskGoogle] = useState(false);

  return (
    <div className="space-y-4" data-testid="contact-map" data-map-provider={consent === null ? "loading" : consent ? "google" : "osm"}>
      <div className="relative isolate aspect-[4/3] w-full overflow-hidden rounded-editorial border border-border bg-secondary sm:aspect-[16/9] lg:aspect-[21/9]">
        {consent === true && <GoogleMapEmbed src={props.googleEmbedUrl} />}
        {consent === false && <OsmMap lat={props.lat} lng={props.lng} name={props.name} address={props.address} />}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        {props.children}
        {consent === false && !askGoogle && (
          <Button type="button" variant="outline" size="sm" data-testid="contact-map-view-google-btn" onClick={() => setAskGoogle(true)}>
            Ver en Google Maps
          </Button>
        )}
      </div>
      {consent === false && askGoogle && <GoogleConsentNotice onCancel={() => setAskGoogle(false)} />}
    </div>
  );
}
