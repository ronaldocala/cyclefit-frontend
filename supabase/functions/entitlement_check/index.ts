import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

function unauthorized(): Response {
  return json({ error: "Unauthorized" }, 401);
}

Deno.serve(async (request) => {
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: {
        Allow: "GET"
      }
    });
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return unauthorized();
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authorization
      }
    }
  });

  const {
    data: { user },
    error: userError
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return unauthorized();
  }

  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { data, error } = await serviceClient
    .from("premium_entitlements")
    .select("entitlement_id, is_active, expires_at, source, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return json({ error: error.message }, 500);
  }

  const expiresAt = data?.expires_at ?? null;
  const isNotExpired = !expiresAt || new Date(expiresAt).getTime() > Date.now();
  const isActive = Boolean(data?.is_active) && isNotExpired;

  return json({
    entitlement_id: data?.entitlement_id ?? "premium",
    is_active: isActive,
    expires_at: expiresAt,
    source: data?.source ?? null,
    updated_at: data?.updated_at ?? null
  });
});
