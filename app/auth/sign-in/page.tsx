"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <AuthShell
      title="Sign in to your Build account"
      subtitle="Access your project requests, quotes, and supply operations in one secure workspace."
    >
      <Card>
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Enter your credentials to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                className="h-11 text-base"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/auth/forgot-password" className="type-small text-brand-dark/70 hover:text-brand-dark">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-11 text-base"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="type-small rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-600">{error}</p>
            )}
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="type-button h-11 w-full bg-brand-primary hover:bg-brand-dark"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="type-small text-brand-dark/70">
            No account?{" "}
            <Link href="/auth/sign-up" className="font-semibold text-brand-dark hover:text-brand-primary">
              Create one
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthShell>
  );
}
