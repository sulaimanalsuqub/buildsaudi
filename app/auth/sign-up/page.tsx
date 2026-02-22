import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your Build account"
};

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your Build account"
      subtitle="Set up your organization account to receive project opportunities and manage supply operations."
    >
      <Card>
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Use your business details to register securely.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Company name</Label>
              <Input id="name" placeholder="Build Supplies Co." className="h-11 text-base" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Business email</Label>
              <Input id="email" type="email" placeholder="name@company.com" className="h-11 text-base" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Create a strong password" className="h-11 text-base" />
            </div>
            <Button type="submit" size="lg" className="type-button h-11 w-full bg-brand-primary hover:bg-brand-dark">
              Create Account
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
