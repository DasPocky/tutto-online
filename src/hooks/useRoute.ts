import { useEffect, useState } from "react";

export type Route =
  | { name: "home"; code?: string }
  | { name: "local" }
  | { name: "room"; code: string };

function parse(path: string): Route {
  const m = path.match(/^\/r\/([A-Za-z0-9]{5})\/?$/);
  if (m) return { name: "room", code: m[1].toUpperCase() };
  if (path === "/lokal") return { name: "local" };
  return { name: "home" };
}

export function navigate(path: string) {
  history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(location.pathname));
  useEffect(() => {
    const on = () => setRoute(parse(location.pathname));
    window.addEventListener("popstate", on);
    return () => window.removeEventListener("popstate", on);
  }, []);
  return route;
}
