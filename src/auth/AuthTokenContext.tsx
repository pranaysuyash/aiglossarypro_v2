import { createContext, useContext, type ReactNode } from "react";

type AuthTokenGetter = () => Promise<string | null>;

const defaultGetToken: AuthTokenGetter = async () => null;

const AuthTokenContext = createContext<AuthTokenGetter>(defaultGetToken);

export function AuthTokenProvider({
  children,
  getToken,
}: {
  children: ReactNode;
  getToken: AuthTokenGetter;
}) {
  return <AuthTokenContext.Provider value={getToken}>{children}</AuthTokenContext.Provider>;
}

export function useAuthToken() {
  return useContext(AuthTokenContext);
}
