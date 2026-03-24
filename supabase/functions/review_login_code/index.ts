import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const reviewEmail = (Deno.env.get("REVIEW_LOGIN_EMAIL") ?? "test@user.com").trim().toLowerCase();
const reviewCode = (Deno.env.get("REVIEW_LOGIN_CODE") ?? "1234").trim();

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: {
        Allow: "POST"
      }
    });
  }

  const body = await request.json().catch(() => null) as { email?: string; code?: string } | null;
  const email = normalizeEmail(body?.email ?? "");
  const code = (body?.code ?? "").trim();

  if (!email || !code) {
    return json({ error: "Missing email or code" }, 400);
  }

  if (email !== reviewEmail || code !== reviewCode) {
    return json({ error: "Invalid review login code" }, 401);
  }

  const admin = createClient(supabaseUrl, supabaseServiceRoleKey);
  const createUserResult = await admin.auth.admin.createUser({
    email,
    email_confirm: true
  });

  if (createUserResult.error && !createUserResult.error.message.toLowerCase().includes("already")) {
    return json({ error: createUserResult.error.message }, 500);
  }

  const generateLinkResult = await admin.auth.admin.generateLink({
    type: "magiclink",
    email
  });

  if (generateLinkResult.error || !generateLinkResult.data.properties.email_otp) {
    return json({ error: generateLinkResult.error?.message ?? "Could not generate review login OTP" }, 500);
  }

  return json({
    emailOtp: generateLinkResult.data.properties.email_otp,
    verificationType: generateLinkResult.data.properties.verification_type
  });
});
