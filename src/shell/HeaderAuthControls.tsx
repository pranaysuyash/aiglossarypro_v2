import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";

export function HeaderAuthControls() {
  return (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <Button variant="accent" size="md">
            Sign In
          </Button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <div className="user-button-shell">
          <UserButton afterSignOutUrl="/" />
        </div>
      </SignedIn>
    </>
  );
}
