"use client";

import { useState } from "react";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    // TODO: connect Supabase resetPasswordForEmail here
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1000);
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email address and we will send you a secure reset link."
    >
      <Card>
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>We will email instructions to restore account access.</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-4 py-5 text-center">
              <p className="text-2xl">📬</p>
              <p className="type-small mt-2 font-semibold text-brand-dark">Check your inbox</p>
              <p className="type-small mt-1 text-brand-dark/60">
                A reset link was sent to <strong>{email}</strong>
              </p>
            </div>
          ) : (
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
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="type-button h-11 w-full bg-brand-primary hover:bg-brand-dark"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          <p className="type-small text-brand-dark/70">
            Remembered your password?{" "}
            <Link href="/auth/sign-in" className="font-semibold text-brand-dark hover:text-brand-primary">
              Back to sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthShell>
  );
}
