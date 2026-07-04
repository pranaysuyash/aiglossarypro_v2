import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/clerk-react";
import { ClerkTokenBridge } from "./ClerkTokenBridge";

export function ClerkProviderBoundary({
  children,
  publishableKey,
}: {
  children: ReactNode;
  publishableKey: string;
}) {
  return (
    <ClerkProvider publishableKey={publishableKey} signInUrl="/login" signUpUrl="/signup">
      <ClerkTokenBridge>{children}</ClerkTokenBridge>
    </ClerkProvider>
  );
}
