import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Access your Build dashboard"
};

export default function SignInPage() {
  return (
    <AuthShell
      title="Sign in to your Build account"
      subtitle="Access supplier requests, project opportunities, and account tools in one secure workspace."
    >
      <Card>
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Enter your credentials to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="name@company.com" className="h-11 text-base" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/auth/forgot-password" className="type-small text-brand-dark/70 hover:text-brand-dark">
                  Forgot password?
                </Link>
              </div>
              <Input id="password" type="password" placeholder="••••••••" className="h-11 text-base" />
            </div>
            <Button type="submit" size="lg" className="type-button h-11 w-full bg-brand-primary hover:bg-brand-dark">
              Sign In
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
