import { useMemo, type ReactNode } from "react";
import { useAuth } from "@clerk/clerk-react";
import { AuthTokenProvider } from "./AuthTokenContext";

export function ClerkTokenBridge({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();

  const tokenGetter = useMemo(
    () => async () => getToken().catch(() => null),
    [getToken],
  );

  return <AuthTokenProvider getToken={tokenGetter}>{children}</AuthTokenProvider>;
}
