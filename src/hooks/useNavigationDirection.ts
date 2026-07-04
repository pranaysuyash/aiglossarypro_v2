import { useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { addTransitionType, startTransition } from "react";

const HIERARCHICAL_SEGMENTS = new Set([
  "families",
  "paths",
  "term",
  "field-lab",
  "shared",
  "saved",
  "notes",
]);

function getDepth(pathname: string): number {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return 0;
  if (HIERARCHICAL_SEGMENTS.has(segments[0])) return 1;
  if (segments.length > 1 && HIERARCHICAL_SEGMENTS.has(segments[0])) return 2;
  return 0;
}

export function useNavigationDirection() {
  const location = useLocation();
  const navigate = useNavigate();
  const history = useRef<string[]>([location.pathname]);

  const push = useCallback(
    (to: string) => {
      const currentDepth = getDepth(location.pathname);
      const targetDepth = getDepth(to);
      const type = targetDepth > currentDepth ? "nav-forward" : targetDepth < currentDepth ? "nav-back" : "nav-forward";

      history.current.push(to);
      startTransition(() => {
        addTransitionType(type);
        navigate(to);
      });
    },
    [location.pathname, navigate],
  );

  return { push };
}
