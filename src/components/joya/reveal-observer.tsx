"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SELECTOR = "#joya-main > * > *, #joya-main [data-reveal] > *";

/**
 * Landing-style scroll reveal for the app: page blocks rise in as they enter
 * the viewport (staggered when several appear together). Content loaded later
 * is picked up through a MutationObserver. Without JS the CSS keeps everything
 * visible (`html.joya-js` gate); reduced motion disables the transition.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const main = document.getElementById("joya-main");
    if (!main || typeof IntersectionObserver === "undefined") return;
    document.documentElement.classList.add("joya-js");

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        visible.forEach((entry, index) => {
          const el = entry.target as HTMLElement;
          el.style.transitionDelay = `${Math.min(index, 6) * 70}ms`;
          el.classList.add("is-in");
          io.unobserve(el);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
    );

    const scan = () => {
      main.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
        if (el.dataset.revealed) return;
        el.dataset.revealed = "1";
        el.classList.add("joya-reveal");
        io.observe(el);
      });
    };

    scan();
    let timer = 0;
    const mo = new MutationObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(scan, 40);
    });
    mo.observe(main, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      window.clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}
