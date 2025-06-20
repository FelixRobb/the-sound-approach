// supabase/functions/delete-user/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }
  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: "Missing authorization header",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    // Extract the JWT token
    const token = authHeader.replace("Bearer ", "");
    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    // Create regular Supabase client to verify the user's token
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    // Verify the user's JWT token and get user info
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: "Invalid or expired token",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    const userId = user.id;
    // Step 1: Get the user's single activation record
    const { data: userActivation, error: activationSelectError } = await supabaseAdmin
      .from("user_activations")
      .select("book_code_id")
      .eq("user_id", userId)
      .single();
    if (activationSelectError && activationSelectError.code !== "PGRST116") {
      // PGRST116 is "no rows returned" - which is fine, user might not have any activations
      console.error("Error fetching user activation:", activationSelectError);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch user activation",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    const deletionErrors = [];
    // Step 2a: Decrement activation count for the user's book code (if exists)
    if (userActivation) {
      try {
        const { error: decrementError } = await supabaseAdmin.rpc(
          "decrement_book_code_activation",
          {
            book_code_id_param: userActivation.book_code_id,
          }
        );
        if (decrementError) {
          console.error(`Error decrementing book code activation:`, decrementError);
          deletionErrors.push(`Failed to decrement book code: ${decrementError.message}`);
        }
      } catch (e) {
        console.error(`Unexpected error decrementing book code:`, e);
        deletionErrors.push(`Unexpected error decrementing book code: ${e.message}`);
      }
    }
    // Step 2b: Delete user activation record
    const { error: userActivationError } = await supabaseAdmin
      .from("user_activations")
      .delete()
      .eq("user_id", userId);
    if (userActivationError) {
      console.error("Error deleting user activation:", userActivationError);
      deletionErrors.push(`Failed to delete user activation: ${userActivationError.message}`);
    }
    const { error: userCodeResetError } = await supabaseAdmin
      .from("book_codes")
      .update({
        activations_used: supabaseAdmin.rpc("decrement_book_code_activation", {
          book_code_id_param: userActivation.book_code_id,
        }),
      })
      .eq("id", userActivation.book_code_id);
    if (userCodeResetError) {
      console.error("Error resetting book code activations:", userCodeResetError);
      deletionErrors.push(`Failed to reset book code activations: ${userCodeResetError.message}`);
    }
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      console.error("Error deleting user from auth:", deleteUserError);
      return new Response(
        JSON.stringify({
          error: "Failed to delete user account",
          details: deleteUserError.message,
          partialErrors: deletionErrors,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    console.log(`Successfully deleted user account: ${userId}`);
    // Return success response with any non-critical errors
    const response = {
      message: "User account and all associated data deleted successfully",
      userId,
    };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Unexpected error in delete-user function:", error);
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
