'use client'

import { useEffect } from "react";

export default function useReveal(selectorClass:string) {
  useEffect(() => {
    const sections = document.querySelectorAll(selectorClass);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target); // animate only once
          }
        });
      },
      { threshold: 0.2 } // adjust sensitivity
    );

    sections.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}
