import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-73px)] px-6">
      <SignUp 
        appearance={{
          elements: {
            card: "bg-card border-border",
            headerTitle: "text-foreground",
            headerSubtitle: "text-muted-foreground",
            socialButtonsBlockButton: "bg-secondary hover:bg-secondary/80",
            socialButtonsBlockButtonText: "text-foreground",
            formFieldLabel: "text-foreground",
            formFieldInput: "bg-background border-border text-foreground",
            footerActionText: "text-muted-foreground",
            footerActionLink: "text-primary hover:text-primary/80",
          },
        }}
      />
    </div>
  );
}
