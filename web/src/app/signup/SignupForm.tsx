"use client";

import {
  UserPlus,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Music,
  Eye,
  EyeOff,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { signup } from "./actions";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : (
        <UserPlus className="w-4 h-4 mr-2" />
      )}
      {pending ? "Creating account..." : "Create Account"}
    </Button>
  );
}

export default function SignupPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [showError, setShowError] = useState(!!error);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setShowError(!!error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                <Music className="w-8 h-8" />
              </div>
            </div>
            <CardTitle className="text-2xl">Join The Sound Approach</CardTitle>
            <CardDescription>Create your account to start your birding adventure</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error message */}
            {showError && error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form action={signup} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  required
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    placeholder="Create a password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="bookCode"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Book Access Code
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="h-4 w-4 p-0">
                          <HelpCircle className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="space-y-2">
                          <p className="font-semibold">Book Code Help</p>
                          <p className="text-sm">
                            The book code is an 8-character code found on the inside cover of
                            &quot;The Sound Approach to Birding&quot; book. It consists of letters
                            and numbers.
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="bookCode"
                  type="text"
                  name="bookCode"
                  required
                  placeholder="Enter your book code"
                  className="uppercase"
                  maxLength={8}
                />

                <p className="text-xs text-muted-foreground">
                  Found in your copy of &quot;The Sound Approach to Birding&quot;
                </p>
              </div>

              <SubmitButton />
            </form>

            {/* Navigation */}
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </div>

              <div className="text-center">
                <Button variant="ghost" asChild className="text-sm">
                  <Link href="/">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to welcome
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
