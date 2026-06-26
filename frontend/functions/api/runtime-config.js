import { handleError, json, requireAdmin, supabaseRequest } from "../_shared.js";

export async function onRequestGet({ env }) {
  try {
    const configId = runtimeConfigId(env);
    const rows = await supabaseRequest(env, "runtime_configs", {
      config_id: `eq.${configId}`,
      is_active: "eq.true",
      select: "config,updated_at",
      limit: "1"
    });

    const row = Array.isArray(rows) ? rows[0] : null;
    return json({
      config: row?.config ?? null,
      configId,
      updatedAt: row?.updated_at ?? null
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("runtime_configs") && error.message.includes("PGRST205")) {
      return json({
        config: null,
        configId: runtimeConfigId(env),
        updatedAt: null,
        setupRequired: true
      });
    }
    return handleError(error);
  }
}

export async function onRequestPut({ request, env }) {
  try {
    requireAdmin(request, env);
    const body = await request.json();
    if (!body || typeof body !== "object" || !body.config) {
      return json({ error: "Expected JSON body with a config property" }, 400);
    }

    const configId = runtimeConfigId(env);
    const rows = await supabaseRequest(
      env,
      "runtime_configs",
      { on_conflict: "config_id" },
      {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify({
          config_id: configId,
          config: body.config,
          is_active: true
        })
      }
    );

    const row = Array.isArray(rows) ? rows[0] : null;
    return json({
      ok: true,
      configId,
      updatedAt: row?.updated_at ?? new Date().toISOString()
    });
  } catch (error) {
    return handleError(error);
  }
}

function runtimeConfigId(env) {
  return env.RUNTIME_CONFIG_ID || "active";
}
