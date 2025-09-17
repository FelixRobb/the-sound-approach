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
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";

import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

import { useAuth } from "@/contexts/AuthContext";

export default function SignupPage() {
  const { signUp, state, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bookCode, setBookCode] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [bookCodeError, setBookCodeError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Validate email format
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate password (at least 6 characters)
  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  // Validate book code format (8 characters alphanumeric)
  const validateBookCode = (code: string) => {
    const codeRegex = /^[A-Za-z0-9]{8}$/;
    return codeRegex.test(code);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setEmailError("");
    setPasswordError("");
    setBookCodeError("");
    clearError();

    // Validate inputs
    let isValid = true;

    if (!email) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (!validatePassword(password)) {
      setPasswordError("Password must be at least 6 characters");
      isValid = false;
    }

    if (!bookCode) {
      setBookCodeError("Book code is required");
      isValid = false;
    } else if (!validateBookCode(bookCode)) {
      setBookCodeError("Book code must be 8 characters (letters and numbers)");
      isValid = false;
    }

    if (!isValid) return;

    setIsSubmitting(true);

    try {
      await signUp(email, password, bookCode);
      router.push("/onboarding");
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsSubmitting(false);
    }
  };

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
            {state.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.error.message}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
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
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  required
                  placeholder="Enter your email"
                  disabled={isSubmitting}
                  className={emailError ? "border-destructive" : ""}
                />
                {emailError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {emailError}
                  </p>
                )}
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
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError("");
                    }}
                    required
                    placeholder="Create a password"
                    disabled={isSubmitting}
                    className={passwordError ? "border-destructive pr-10" : "pr-10"}
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
                {passwordError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {passwordError}
                  </p>
                )}
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
                  value={bookCode}
                  onChange={(e) => {
                    setBookCode(e.target.value.toUpperCase());
                    setBookCodeError("");
                  }}
                  required
                  placeholder="Enter your book code"
                  disabled={isSubmitting}
                  className={`uppercase ${bookCodeError ? "border-destructive" : ""}`}
                  maxLength={8}
                />
                {bookCodeError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {bookCodeError}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Found in your copy of &quot;The Sound Approach to Birding&quot;
                </p>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                {isSubmitting ? "Creating account..." : "Create Account"}
              </Button>
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
