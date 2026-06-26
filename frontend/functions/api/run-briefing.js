import { handleError, json, requireAdmin } from "../_shared.js";

export async function onRequestPost({ request, env }) {
  try {
    requireAdmin(request, env);

    const token = env.GITHUB_ACTIONS_TOKEN;
    const repo = env.GITHUB_REPOSITORY || "HarishRaja10/jarvis-agent";
    const workflow = env.GITHUB_WORKFLOW_FILE || "manual-briefing.yml";
    const ref = env.GITHUB_WORKFLOW_REF || "main";
    if (!token) {
      return json({ error: "GitHub workflow dispatch is not configured", required: ["GITHUB_ACTIONS_TOKEN"] }, 503);
    }

    const body = await safeJson(request);
    const runType = ["morning", "evening", "manual"].includes(body.run_type) ? body.run_type : "manual";
    const response = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches`, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "jarvis-briefing-pwa"
      },
      body: JSON.stringify({
        ref,
        inputs: { run_type: runType }
      })
    });

    if (!response.ok) {
      return json({ error: "Workflow dispatch failed", status: response.status, body: await response.text() }, 502);
    }

    return json({ ok: true, runType, workflow, ref }, 202);
  } catch (error) {
    return handleError(error);
  }
}

async function safeJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

