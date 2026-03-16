"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function AuthButtons() {
  const [isClerkLoaded, setIsClerkLoaded] = useState(false);
  
  useEffect(() => {
    // Check if Clerk is loaded by looking for its presence in the window
    // The @clerk/nextjs package adds a global __clerk_internal
    setIsClerkLoaded(typeof window !== "undefined" && 
      !!(window as unknown as { __clerk_internal?: unknown }).__clerk_internal);
  }, []);

  if (!isClerkLoaded) {
    return null;
  }

  return (
    <div className="flex items-center">
      <SignedOut>
        <SignInButton mode="modal">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton 
          appearance={{
            elements: {
              avatarBox: "w-8 h-8",
            },
          }}
        />
      </SignedIn>
    </div>
  );
}
