import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandLockup } from "@/components/ui/brand";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AuthCard({
  title,
  description,
  mode,
}: {
  title: string;
  description: string;
  mode: "login" | "signup" | "forgot";
}) {
  return (
    <Card className="w-full max-w-md p-6 shadow-xl shadow-zinc-950/[0.06]">
      <div className="mb-6">
        <BrandLockup className="mb-6" />
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>

      <form className="space-y-4">
        {mode === "signup" ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium">Organization name</span>
            <Input placeholder="Hof North" />
          </label>
        ) : null}
        {mode !== "forgot" ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium">Email</span>
            <Input type="email" placeholder="you@company.com" />
          </label>
        ) : (
          <label className="block space-y-2">
            <span className="text-sm font-medium">Email</span>
            <Input type="email" placeholder="you@company.com" />
          </label>
        )}
        {mode !== "forgot" ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium">Password</span>
            <Input type="password" placeholder="********" />
          </label>
        ) : null}
        <Button className="h-11 w-full" type="button">
          {mode === "login" ? "Login" : mode === "signup" ? "Create account" : "Send reset link"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm">
        {mode === "login" ? (
          <>
            <Link href="/forgot-password" className="text-muted-foreground transition hover:text-foreground">
              Forgot password?
            </Link>
            <Link href="/signup" className="font-medium">
              Sign up
            </Link>
          </>
        ) : (
          <Link href="/login" className="font-medium">
            Back to login
          </Link>
        )}
      </div>
    </Card>
  );
}
