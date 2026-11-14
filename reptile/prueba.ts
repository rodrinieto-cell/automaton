// Prueba del modo REPTILE contra un REPTILE encendido (REPTILE_URL). No arranca el agente.
import { reptileTools, earningsTier, SAFE_BUILTIN_TOOLS } from "../src/reptile/mode.js";
import { createBuiltinTools } from "../src/agent/tools.js";
const name = "Automaton (prueba)";
const tools = reptileTools(name);
const ctx: any = {};
const fns = await tools.find((t) => t.name === "reptile_functions")!.execute({ filter: "hijos" }, ctx);
console.log("funciones:", String(fns).slice(0, 220));
const leer = await tools.find((t) => t.name === "reptile_read")!.execute({ path: "/api/enlaces" }, ctx);
console.log("leer /api/enlaces:", String(leer).slice(0, 160));
console.log("supervivencia:", JSON.stringify(await earningsTier(name)));
const safe = createBuiltinTools("").filter((t) => SAFE_BUILTIN_TOOLS.has(t.name)).map((t) => t.name);
console.log("herramientas permitidas:", safe.length, "· ¿alguna peligrosa?", safe.filter((n) => /exec|write|edit|transfer|topup|fund|spawn|domain|x402|install|git_push|sandbox/.test(n)));
