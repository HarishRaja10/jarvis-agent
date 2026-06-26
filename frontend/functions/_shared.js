const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: jsonHeaders
  });
}

export function requireSupabase(env) {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Response(
      JSON.stringify({
        error: "Supabase API is not configured",
        required: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
      }),
      { status: 503, headers: jsonHeaders }
    );
  }
  return { key, url: url.replace(/\/$/, "") };
}

export async function supabaseRequest(env, table, params = {}, init = {}) {
  const { key, url } = requireSupabase(env);
  const search = new URLSearchParams(params);
  const endpoint = `${url}/rest/v1/${table}${search.size ? `?${search}` : ""}`;
  const response = await fetch(endpoint, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase ${table} request failed: ${response.status} ${body}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export function requireAdmin(request, env) {
  const expected = env.JARVIS_ADMIN_TOKEN;
  if (!expected) {
    throw new Response(
      JSON.stringify({
        error: "Admin API token is not configured",
        required: ["JARVIS_ADMIN_TOKEN"]
      }),
      { status: 503, headers: jsonHeaders }
    );
  }

  const provided = request.headers.get("x-jarvis-admin-token") || "";
  if (provided !== expected) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: jsonHeaders
    });
  }
}

export function handleError(error) {
  if (error instanceof Response) return error;
  return json({ error: error instanceof Error ? error.message : "Unexpected API error" }, 500);
}

