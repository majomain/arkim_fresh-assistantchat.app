'use client'

export function emitHomePageVisited() {
  window.dispatchEvent(new CustomEvent("home-page-visited"));
}

export function onHomePageVisited(callback: () => void) {
  window.addEventListener("home-page-visited", callback);
  return () => window.removeEventListener("home-page-visited", callback);
}
