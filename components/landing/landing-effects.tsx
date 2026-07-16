"use client";

import { useEffect } from "react";

/**
 * Landing motion, effect-only (renders nothing). Mirrors the handoff:
 *  - IntersectionObserver fade-up for every [data-reveal] element.
 *  - Sticky nav gains a translucent background + soft shadow past 10px.
 *  - Subtle hero parallax on the phone mockup.
 * All of it is disabled by prefers-reduced-motion (the CSS handles reveals;
 * here we simply skip the scroll transforms).
 */
export function LandingEffects() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("rv-in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

    const nav = document.getElementById("arv-nav");
    const phone = document.getElementById("hero-phone");
    const onScroll = () => {
      const y = window.scrollY;
      if (nav) {
        nav.style.background = y > 10 ? "rgba(251,250,248,.85)" : "rgba(251,250,248,0)";
        nav.style.boxShadow = y > 10 ? "0 12px 32px -20px rgba(20,20,19,.28)" : "none";
      }
      if (phone && !reduce) {
        phone.style.transform = `translateY(${Math.min(y * 0.06, 44)}px)`;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return null;
}
