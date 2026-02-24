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

export default function SignUpPage() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!company || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { company_name: company } },
    });
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
      title="Create your Build account"
      subtitle="Set up your organization account to start submitting supply requests and managing your projects."
    >
      <Card>
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Use your business details to register securely.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="company">Company name</Label>
              <Input
                id="company"
                placeholder="Build Supplies Co."
                className="h-11 text-base"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Business email</Label>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
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
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="type-small text-brand-dark/70">
            Already registered?{" "}
            <Link href="/auth/sign-in" className="font-semibold text-brand-dark hover:text-brand-primary">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthShell>
  );
}
