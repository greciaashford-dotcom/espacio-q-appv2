"use client";

import { useEffect, useRef, type RefObject } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Lleva el inicio de `el` justo debajo de la cabecera fija del sitio público. */
export function scrollToSectionTop(el: HTMLElement | null) {
  if (!el || typeof window === "undefined") return;
  const header = document.querySelector<HTMLElement>("header.sticky");
  const offset = (header?.offsetHeight ?? 0) + 16;
  const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset);
  window.scrollTo({ top, behavior: prefersReducedMotion() ? ("instant" as ScrollBehavior) : "smooth" });
}

/** Desplaza al inicio de la sección cuando cambia `key` (no en el primer render). */
export function useScrollToTopOnChange(ref: RefObject<HTMLElement>, key: unknown) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    requestAnimationFrame(() => scrollToSectionTop(ref.current));
  }, [key, ref]);
}
