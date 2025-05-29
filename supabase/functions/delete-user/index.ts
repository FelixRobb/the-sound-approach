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
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // 1. Delete user downloads
    const { error: downloadsError } = await supabaseAdmin
      .from("user_downloads")
      .delete()
      .eq("user_id", userId);

    if (downloadsError) {
      console.error("Error deleting user downloads:", downloadsError);
      return new Response(JSON.stringify({ error: "Failed to delete user downloads" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Delete user activations and decrement book code activation counts
    const { data: activations, error: activationsSelectError } = await supabaseAdmin
      .from("user_activations")
      .select("book_code_id")
      .eq("user_id", userId);

    if (activationsSelectError) {
      console.error("Error fetching user activations:", activationsSelectError);
      return new Response(JSON.stringify({ error: "Failed to fetch user activations" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete user activations
    const { error: userActivationsError } = await supabaseAdmin
      .from("user_activations")
      .delete()
      .eq("user_id", userId);

    if (userActivationsError) {
      console.error("Error deleting user activations:", userActivationsError);
      return new Response(JSON.stringify({ error: "Failed to delete user activations" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Decrement activation counts for affected book codes
    if (activations && activations.length > 0) {
      for (const activation of activations) {
        const { error: decrementError } = await supabaseAdmin.rpc(
          "decrement_book_code_activation",
          {
            book_code_id_param: activation.book_code_id,
          }
        );

        if (decrementError) {
          console.error("Error decrementing book code activation:", decrementError);
          // Continue with deletion even if decrement fails
        }
      }
    }

    // 4. Delete the user from Supabase Auth (this will also delete from auth.users)
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.error("Error deleting user from auth:", deleteUserError);
      return new Response(JSON.stringify({ error: "Failed to delete user account" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        message: "User account and all associated data deleted successfully",
        userId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in delete-user function:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
