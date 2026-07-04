import { useCallback } from "react";
import { useAuthToken } from "../auth/AuthTokenContext";

export type WorkerRequest = <T>(url: string, init?: RequestInit) => Promise<T>;

function buildHeaders(initHeaders: HeadersInit | undefined, bearerToken?: string | null) {
  const headers = new Headers(initHeaders);
  if (!headers.has("accept")) {
    headers.set("accept", "application/json");
  }
  if (bearerToken) {
    headers.set("authorization", `Bearer ${bearerToken}`);
  }
  return headers;
}

export async function requestJsonWithToken<T>(
  url: string,
  init: RequestInit = {},
  bearerToken?: string | null,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: buildHeaders(init.headers, bearerToken),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `${url} failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

function useWorkerRequest(): WorkerRequest {
  const getToken = useAuthToken();

  return useCallback(
    async <T,>(url: string, init: RequestInit = {}) => {
      const token = await getToken().catch(() => null);
      return requestJsonWithToken<T>(url, init, token);
    },
    [getToken],
  );
}

export { useWorkerRequest };
