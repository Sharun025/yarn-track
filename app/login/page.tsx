"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const headings: Record<"sign-in" | "sign-up", { title: string; description: string }> = {
  "sign-in": {
    title: "Welcome back",
    description: "Authenticate to access the production control systems.",
  },
  "sign-up": {
    title: "Create an account",
    description: "Provision access for a new supervisor or manager profile.",
  },
};

type Mode = "sign-in" | "sign-up";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = (formData.get("email") as string)?.trim();
    const password = formData.get("password") as string;

    if (!email || !password) {
      setError("Both email and password are required.");
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();

      if (mode === "sign-in") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          throw signInError;
        }

        setMessage("Signed in successfully. Redirecting to dashboard...");
        router.replace("/dashboard");
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          throw signUpError;
        }

        setMessage(
          "Account created. Check your inbox for a confirmation email before signing in."
        );
      }
    } catch (authError) {
      setError((authError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((current) => (current === "sign-in" ? "sign-up" : "sign-in"));
    setError(null);
    setMessage(null);
  };

  const { title, description } = headings[mode];

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            {title}
          </CardTitle>
          <CardDescription className="text-base">
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Your password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Sending..."
                : mode === "sign-in"
                ? "Sign in"
                : "Sign up"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            type="button"
            variant="link"
            className="px-0 text-sm"
            disabled={loading}
            onClick={toggleMode}
          >
            {mode === "sign-in"
              ? "Need an account? Switch to sign up"
              : "Have an account? Switch to sign in"}
          </Button>

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Authentication error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {message ? (
            <Alert>
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  );
}
