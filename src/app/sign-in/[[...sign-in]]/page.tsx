import { ClerkProvider, SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
      <div className="flex min-h-dvh items-center justify-center p-4">
        <SignIn />
      </div>
    </ClerkProvider>
  );
}
