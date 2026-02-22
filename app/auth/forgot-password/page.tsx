import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your Build account password"
};

export default function ForgotPasswordPage() {
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
          <form className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="name@company.com" className="h-11 text-base" />
            </div>
            <Button type="submit" size="lg" className="type-button h-11 w-full bg-brand-primary hover:bg-brand-dark">
              Send Reset Link
            </Button>
          </form>
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
