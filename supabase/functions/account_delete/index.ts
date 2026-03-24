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
  if (request.method !== "DELETE") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: {
        Allow: "DELETE"
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
  const { error } = await serviceClient.auth.admin.deleteUser(user.id);

  if (error) {
    return json({ error: error.message }, 500);
  }

  return new Response(null, { status: 204 });
});
