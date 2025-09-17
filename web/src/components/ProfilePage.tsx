"use client";

import {
  User,
  Mail,
  Key,
  LogOut,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Shield,
  Settings,
} from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import ThemeToggleButton from "./ui/theme-toggle-button";

import { useAuth } from "@/contexts/AuthContext";

export default function ProfilePage() {
  const { state, signOut, changePassword, deleteAccount, resetOnboarding } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [deleteForm, setDeleteForm] = useState({
    password: "",
    confirmText: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
    delete: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters long" });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setMessage({ type: "success", text: "Password changed successfully" });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowChangePassword(false);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to change password",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (deleteForm.confirmText !== "DELETE MY ACCOUNT") {
      setMessage({ type: "error", text: "Please type 'DELETE MY ACCOUNT' to confirm" });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await deleteAccount(deleteForm.password);
      // Account deletion will sign out the user automatically
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to delete account",
      });
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to sign out",
      });
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          {/* Message */}
          {message && (
            <Alert variant={message.type === "success" ? "default" : "destructive"}>
              {message.type === "success" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Account Information</CardTitle>
                  <CardDescription>Your personal account details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/20 mt-1">
                    <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">Email Address</p>
                    <p className="text-muted-foreground text-sm mt-1 truncate">
                      {state.user?.email ?? "Not available"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/20 mt-1">
                    <Key className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">Book Access Code</p>
                    <p className="text-muted-foreground text-sm mt-1">••••••••</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-100 dark:bg-green-900/20">
                  <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>Manage your account security settings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Change Password */}
              <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Change Password</p>
                    <p className="text-sm text-muted-foreground">Update your account password</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowChangePassword(!showChangePassword)}
                >
                  {showChangePassword ? "Cancel" : "Change"}
                </Button>
              </div>

              {showChangePassword && (
                <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
                  <form onSubmit={void handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="currentPassword" className="text-sm font-medium">
                        Current Password
                      </label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                          }
                          required
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() =>
                            setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                          }
                        >
                          {showPasswords.current ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="newPassword" className="text-sm font-medium">
                        New Password
                      </label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                          }
                          required
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() =>
                            setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                          }
                        >
                          {showPasswords.new ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="confirmPassword" className="text-sm font-medium">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                          }
                          required
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() =>
                            setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                          }
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                        Update Password
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowChangePassword(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>

          {/* App Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-100 dark:bg-purple-900/20">
                  <Settings className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle>App Settings</CardTitle>
                  <CardDescription>Customize your app experience</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <p className="font-medium">Appearance</p>
                  <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                </div>
                <ThemeToggleButton />
              </div>

              {/* Reset Tutorial */}
              <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Reset Tutorial</p>
                    <p className="text-sm text-muted-foreground">See the welcome tutorial again</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={resetOnboarding}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Sign Out */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sign Out</CardTitle>
                <CardDescription>Sign out of your account</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={void handleSignOut} className="w-full">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>

            {/* Delete Account */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-lg text-destructive">Delete Account</CardTitle>
                <CardDescription>Permanently delete your account and all data</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteAccount(!showDeleteAccount)}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {showDeleteAccount ? "Cancel" : "Delete Account"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Delete Account Form */}
          {showDeleteAccount && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Confirm Account Deletion</CardTitle>
                <CardDescription>This action cannot be undone</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold">⚠️ Warning</p>
                      <p>Deleting your account will permanently remove all your data, including:</p>
                      <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                        <li>Your account information</li>
                        <li>Your book code activation</li>
                        <li>All preferences and settings</li>
                      </ul>
                      <p className="font-medium">This action cannot be undone.</p>
                    </div>
                  </AlertDescription>
                </Alert>

                <form onSubmit={void handleDeleteAccount} className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{message?.text}</p>
                    <label htmlFor="deletePassword" className="text-sm font-medium">
                      Confirm with your password
                    </label>
                    <div className="relative">
                      <Input
                        id="deletePassword"
                        type={showPasswords.delete ? "text" : "password"}
                        value={deleteForm.password}
                        onChange={(e) => setDeleteForm({ ...deleteForm, password: e.target.value })}
                        required
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() =>
                          setShowPasswords({ ...showPasswords, delete: !showPasswords.delete })
                        }
                      >
                        {showPasswords.delete ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmText" className="text-sm font-medium">
                      Type{" "}
                      <Badge variant="destructive" className="mx-1">
                        DELETE MY ACCOUNT
                      </Badge>{" "}
                      to confirm
                    </label>
                    <Input
                      id="confirmText"
                      type="text"
                      value={deleteForm.confirmText}
                      onChange={(e) =>
                        setDeleteForm({ ...deleteForm, confirmText: e.target.value })
                      }
                      required
                      placeholder="Type DELETE MY ACCOUNT to confirm"
                      className="uppercase"
                    />
                    <p className="text-xs text-muted-foreground">
                      This helps prevent accidental deletions
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="submit" variant="destructive" disabled={isSubmitting}>
                      {isSubmitting && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowDeleteAccount(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
