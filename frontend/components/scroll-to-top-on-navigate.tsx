"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Garantiza que cada navegación interna a otra página empiece arriba (REQ-72).
 * Respeta anclas (#seccion) y el botón Atrás/Adelante del navegador (restauración nativa).
 */
export function ScrollToTopOnNavigate() {
  const pathname = usePathname();
  const isPop = useRef(false);
  const first = useRef(true);

  useEffect(() => {
    const onPop = () => {
      isPop.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (isPop.current) {
      isPop.current = false;
      return;
    }
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return null;
}
