# Automaton · REPTILE mode (fork)

Fork of [Conway-Research/automaton](https://github.com/Conway-Research/automaton) (MIT) made for Rodri's REPTILE workspace
(November 2026). Branch: `reptile`. Turned on with the `REPTILE_URL` environment variable; without it, the runtime behaves
exactly like the original.

## What changes

| Original | REPTILE mode |
|---|---|
| Pays Conway Compute with crypto; dies when credits run out | Free brain: Groq, Gemini (OpenAI endpoint) and local Ollama (`reptile/inference-providers.json`) |
| Survival tier = compute-credit balance | Survival tier = **euros earned per week** in REPTILE's Criadero (`/api/hijos`). 2 weeks without a euro → low compute, 3 → critical, 4 (`REPTILE_WEEKS_TO_DIE`) → dead |
| Shell, file writes, self-modification, payments, wallet transfers, domains, Conway sandboxes, children | **All removed.** Only 24 safe tools (memory, soul, goals, planning, sleep) plus 4 REPTILE tools |
| Invents businesses from scratch | Works through what already works in REPTILE: `reptile_functions`, `reptile_read`, `reptile_propose` (delicate actions go to Rodri's approval tray), `reptile_score` |

Hard limits: separate wallet capped at $10 (the runtime cannot pay anything in this mode), no spam, no impersonation, only
Rodri's channels, everything logged in REPTILE (approval tray + Criadero diary). Euros are recorded by Rodri in the Criadero;
the agent cannot report its own earnings.

## Run it (on the Mac, not on the Windows PC that holds the trading keys)

```bash
git clone -b reptile https://github.com/rodrinieto-cell/automaton.git && cd automaton
pnpm install && pnpm build            # or: npm install && npx tsc
mkdir -p ~/.automaton && cp reptile/inference-providers.json ~/.automaton/
export REPTILE_URL=http://<REPTILE host on Tailscale>:4321   # REPTILE must accept it (it listens on 127.0.0.1 by default)
export GROQ_API_KEY=... GEMINI_API_KEY=...                   # the same free keys REPTILE uses
node dist/index.js --setup   # name + genesis prompt; skip wallet funding
node dist/index.js --run
```

Suggested genesis prompt: «You are a child of REPTILE. Earn euros for Rodri by improving what already sells (KDP books,
videos with a product link, creator outreach). Read REPTILE first, propose one small change at a time, and never spam,
impersonate anyone or spend money.»

`reptile/prueba.ts` checks the REPTILE tools and the euros-based survival against a running REPTILE without starting the agent:
`REPTILE_URL=http://127.0.0.1:4321 npx tsx reptile/prueba.ts`.
