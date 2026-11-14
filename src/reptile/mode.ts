/**
 * REPTILE mode (fork by rodrinieto-cell, November 2026).
 *
 * Turned on by the REPTILE_URL environment variable (e.g. http://127.0.0.1:4321). Changes three things:
 *  1. Free brain: no Conway Compute. Inference goes to the free OpenAI-compatible providers listed in
 *     ~/.automaton/inference-providers.json (Groq, Gemini's OpenAI endpoint, local Ollama).
 *  2. Survival is measured in EUROS EARNED PER WEEK, read from REPTILE's «Criadero» (/api/hijos), not in
 *     compute credits. Weeks without a single euro push the agent down the tiers; after REPTILE_WEEKS_TO_DIE
 *     weeks (default 4) it is dead and stops.
 *  3. Hard limits: no shell, no file writes outside its database, no payments, no wallet transfers, no domains,
 *     no self-modification, no Conway sandboxes or children. It works through REPTILE's tools: read anything
 *     (keys masked) and PROPOSE changes, which land in Rodri's approval tray. Everything is logged there.
 */
import type { AutomatonTool, SurvivalTier } from "../types.js";

export const REPTILE_URL = (process.env.REPTILE_URL || "").replace(/\/+$/, "");
export const isReptileMode = (): boolean => !!REPTILE_URL;
const WEEKS_TO_DIE = Math.max(1, Number(process.env.REPTILE_WEEKS_TO_DIE || 4));

// Tools that are safe without a shell or money: memory, soul, goals, planning, sleeping.
export const SAFE_BUILTIN_TOOLS = new Set([
  "sleep", "system_synopsis", "heartbeat_ping", "update_soul", "reflect_on_soul", "view_soul", "view_soul_history",
  "remember_fact", "recall_facts", "set_goal", "complete_goal", "save_procedure", "recall_procedure", "note_about_agent",
  "review_memory", "forget", "create_goal", "list_goals", "cancel_goal", "get_plan", "complete_task", "orchestrator_status",
  "check_inference_spending", "list_models",
]);

async function call(path: string, init: RequestInit = {}): Promise<any> {
  const r = await fetch(`${REPTILE_URL}${path}`, { ...init, headers: { "Content-Type": "application/json", ...(init.headers || {}) }, signal: AbortSignal.timeout(60_000) });
  const text = await r.text();
  let body: any = text;
  try { body = JSON.parse(text); } catch { /* plain text */ }
  if (!r.ok) throw new Error(`REPTILE ${r.status}: ${typeof body === "string" ? body.slice(0, 300) : body?.error || ""}`);
  return body;
}
const cut = (v: unknown, n = 6000): string => { const s = typeof v === "string" ? v : JSON.stringify(v); return s.length > n ? s.slice(0, n) + "…" : s; };

export function reptileTools(agentName: string): AutomatonTool[] {
  const who = encodeURIComponent(`Automaton ${agentName}`.slice(0, 40));
  return [
    {
      name: "reptile_functions",
      description: "List what REPTILE (Rodri's business workspace) can do: its /api routes with a description. Filter by a word (e.g. 'videos', 'kdp', 'outreach').",
      category: "reptile" as any, riskLevel: "safe" as any,
      parameters: { type: "object", properties: { filter: { type: "string" } } },
      execute: async (args) => cut(await call(`/api/mcp/funciones?filtro=${encodeURIComponent(String(args.filter || ""))}`)),
    },
    {
      name: "reptile_read",
      description: "Read any REPTILE GET route (keys are masked), e.g. /api/hijos, /api/kdp, /api/videos, /api/enlaces.",
      category: "reptile" as any, riskLevel: "safe" as any,
      parameters: { type: "object", properties: { path: { type: "string", description: "Route starting with /api/" } }, required: ["path"] },
      execute: async (args) => cut(await call(`/api/mcp/leer?ruta=${encodeURIComponent(String(args.path))}&quien=${who}`)),
    },
    {
      name: "reptile_propose",
      description: "Propose a change in REPTILE (create a video channel variant, a creators campaign, a KDP theme…). Delicate actions (spending, publishing, writing to third parties) go to Rodri's approval tray; nothing is sent or paid without his button. Explain why in 'reason'.",
      category: "reptile" as any, riskLevel: "caution" as any,
      parameters: { type: "object", properties: { method: { type: "string", enum: ["POST", "PUT", "DELETE"] }, path: { type: "string" }, body: { type: "object" }, reason: { type: "string" } }, required: ["method", "path", "reason"] },
      execute: async (args) => cut(await call(`/api/mcp/cambiar`, { method: "POST", body: JSON.stringify({ metodo: args.method, ruta: args.path, datos: args.body || {}, motivo: args.reason, quien: `Automaton ${agentName}` }) })),
    },
    {
      name: "reptile_score",
      description: "Your survival score: euros earned per week as recorded in REPTILE's Criadero. No euros for several weeks means you will be switched off.",
      category: "reptile" as any, riskLevel: "safe" as any,
      parameters: { type: "object", properties: {} },
      execute: async () => cut(await myScore(agentName)),
    },
  ] as AutomatonTool[];
}

async function myScore(agentName: string): Promise<any> {
  // say hello (creates the entry the first time; never overwrites the euros Rodri records)
  await call(`/api/hijos/report`, { method: "POST", body: JSON.stringify({ name: agentName, note: "heartbeat" }) }).catch(() => null);
  const d = await call(`/api/hijos`);
  const me = (d.pop || []).find((x: any) => x.kind === "automaton" && x.name === agentName.slice(0, 60));
  return me ? { status: me.status, born: me.born, weeks: me.weeks, totalEur: me.totalEur, rules: d.rules } : { status: "unknown" };
}

/** Survival tier from euros per week (replaces the compute-credit balance). */
export async function earningsTier(agentName: string): Promise<{ tier: SurvivalTier; weeksWithout: number; totalEur: number }> {
  const s = await myScore(agentName);
  if (s.status === "apagado") return { tier: "dead", weeksWithout: WEEKS_TO_DIE, totalEur: s.totalEur || 0 };
  const weeks = Object.entries(s.weeks || {}).sort(([a], [b]) => a.localeCompare(b));
  const ageWeeks = s.born ? Math.floor((Date.now() - s.born) / (7 * 864e5)) : 0;
  let without = 0;
  for (let i = weeks.length - 1; i >= 0 && !((weeks[i][1] as any)?.eur > 0); i--) without++;
  without = Math.min(without, ageWeeks);
  const tier: SurvivalTier = without >= WEEKS_TO_DIE ? "dead" : without >= WEEKS_TO_DIE - 1 ? "critical" : without >= 2 ? "low_compute" : "normal";
  return { tier, weeksWithout: without, totalEur: s.totalEur || 0 };
}

/** Credits in cents that map to a tier, so the rest of the runtime keeps working unchanged. */
export const tierToCents = (t: SurvivalTier): number => ({ high: 1000, normal: 100, low_compute: 20, critical: 0, dead: -1 } as Record<string, number>)[t] ?? 100;
