import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";

export function HeaderAuthControls() {
  return (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <button className="primary-button" type="button">
            Sign In
          </button>
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
