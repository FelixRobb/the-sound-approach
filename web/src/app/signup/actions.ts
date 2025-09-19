"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export async function signup(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    bookCode: formData.get("bookCode") as string,
  };

  // First validate the book code using RPC function
  const { data: isAvailable, error: validationError } = (await supabase.rpc(
    "is_book_code_available",
    { code_param: data.bookCode }
  )) as { data: boolean; error: Error | null };

  if (validationError) {
    console.error("Error validating book code:", validationError);
    redirect("/signup?error=Error validating book code");
  }

  if (!isAvailable) {
    console.error("Invalid book code or maximum activations reached");
    redirect("/signup?error=Invalid book code or maximum activations reached");
  }
  // Check if user already exists
  const { data: existingUser, error: userCheckError } = await supabase.auth.getUser();

  if (!userCheckError && existingUser?.user) {
    redirect("/signup?error=User already exists with this email");
  }

  // Also check if email is already registered
  const { data: emailCheck, error: emailCheckError } = await supabase
    .from("auth.users")
    .select("id")
    .eq("email", data.email)
    .single();

  if (!emailCheckError && emailCheck) {
    redirect("/signup?error=An account with this email already exists");
  }

  // Then sign up with email and password
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        book_code: data.bookCode,
      },
    },
  });

  if (error) {
    console.error("Error creating account:", error);
    redirect("/signup?error=Could not create account");
  }

  if (authData?.user && authData?.session) {
    // Associate the user with the book code
    const { data: bookCodeData } = (await supabase
      .from("book_codes")
      .select("id")
      .eq("code", data.bookCode)
      .single()) as { data: { id: string } | null; error: Error | null };

    if (bookCodeData) {
      // Create user activation record
      const { error: activationError } = await supabase.from("user_activations").insert({
        user_id: authData.user.id,
        book_code_id: bookCodeData.id,
      });

      if (activationError) {
        console.error("Error creating user activation:", activationError);
      }

      // Increment the activations_used counter using RPC function
      const { error: incrementError } = await supabase.rpc("increment_book_code_activation", {
        code_param: data.bookCode,
      });

      if (incrementError) {
        console.error("Error incrementing book code activation:", incrementError);
      }
    }
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
}
