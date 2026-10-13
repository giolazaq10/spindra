import { useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import ErrorBoundary from "./ErrorBoundary";
/** A failed route must not trap browser Back on a permanent error screen. */
export default function RouteBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();
  return <ErrorBoundary key={location.key}>{children}</ErrorBoundary>;
}
