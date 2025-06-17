"use client";

import { useState } from "react";
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
} from "lucide-react";
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

    if (deleteForm.confirmText !== "DELETE") {
      setMessage({ type: "error", text: "Please type DELETE to confirm" });
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
    <div className="h-full overflow-auto">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile & Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account and preferences</p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
              message.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <p
              className={`text-sm ${
                message.type === "success"
                  ? "text-green-700 dark:text-green-300"
                  : "text-red-700 dark:text-red-300"
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Account Details
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Your account information</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address
                </p>
                <p className="text-gray-900 dark:text-white">
                  {state.user?.email || "Not available"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Book Access Code
                </p>
                <p className="text-gray-900 dark:text-white">••••••••</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {/* Change Password */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Change Password
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Update your account password
                </p>
              </div>
              <button
                onClick={() => setShowChangePassword(!showChangePassword)}
                className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                {showChangePassword ? "Cancel" : "Change"}
              </button>
            </div>

            {showChangePassword && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                      }
                      required
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords((prev) => ({ ...prev, current: !prev.current }))
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                      }
                      required
                      minLength={6}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                      }
                      required
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Changing Password..." : "Change Password"}
                </button>
              </form>
            )}
          </div>

          {/* Development Options */}
          {process.env.NODE_ENV === "development" && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-300 mb-4">
                Development Options
              </h3>
              <button
                onClick={() => {
                  resetOnboarding();
                  alert("Onboarding reset! Refresh the page to see the onboarding flow again.");
                }}
                className="w-full flex items-center gap-3 p-3 bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-300 dark:border-yellow-700 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/60 transition-colors"
              >
                <RefreshCw className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <span className="font-medium text-yellow-900 dark:text-yellow-300">
                  Reset Onboarding
                </span>
              </button>
            </div>
          )}

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-white">Sign Out</span>
          </button>

          {/* Delete Account */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-300">
                  Delete Account
                </h3>
                <p className="text-sm text-red-700 dark:text-red-400">
                  Permanently delete your account and all data
                </p>
              </div>
              <button
                onClick={() => setShowDeleteAccount(!showDeleteAccount)}
                className="px-4 py-2 text-red-600 hover:text-red-700 font-medium"
              >
                {showDeleteAccount ? "Cancel" : "Delete"}
              </button>
            </div>

            {showDeleteAccount && (
              <form onSubmit={handleDeleteAccount} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                    Enter your password to confirm
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.delete ? "text" : "password"}
                      value={deleteForm.password}
                      onChange={(e) =>
                        setDeleteForm((prev) => ({ ...prev, password: e.target.value }))
                      }
                      required
                      className="w-full px-3 py-2 pr-10 border border-red-300 dark:border-red-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-red-900/20 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords((prev) => ({ ...prev, delete: !prev.delete }))
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-400 hover:text-red-600"
                    >
                      {showPasswords.delete ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                    Type "DELETE" to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteForm.confirmText}
                    onChange={(e) =>
                      setDeleteForm((prev) => ({ ...prev, confirmText: e.target.value }))
                    }
                    required
                    className="w-full px-3 py-2 border border-red-300 dark:border-red-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-red-900/20 dark:text-white"
                    placeholder="DELETE"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {isSubmitting ? "Deleting Account..." : "Delete Account"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
