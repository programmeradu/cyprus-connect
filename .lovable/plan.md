# Vuneli Agent Ecosystem Plan

## 1. Honest starting point

- The agents, runs and tasks in the console are sample rows. No agent does real work today.
- The copilot is the only live AI. It can propose 4 kinds of change, and a person approves each one.
- "Many agents running 24/7" is not an innovation. Evaluators have seen it. The innovation has to be **what** the agents make possible that was impossible before. The rest is good engineering.
- Every idea in Section 3 is **unproven**. Each one goes through our research gates (prior art, fixed hypotheses, experiments) before we claim it in a pitch.

## 2. The test for an idea

An idea only goes on the list if it passes all four:
1. **Kills a job.** A task an SME, bank or buyer does today stops existing. Making the task faster does not count.
2. **Money or risk you can see.** Euros saved, a loan approved, a fine avoided. "Better data" does not count.
3. **Instant to understand.** People hear it and ask "how does that work?", not "how is that different?"
4. **Hard to copy without the network.** It gets better with every business that joins.

## 3. Innovation candidates (deep brainstorm, all unproven)

### A. Grid Surplus Agent: "Get paid to use the sun Cyprus wastes"
- **Pain:** Cyprus is an island grid with no link to other countries. At midday it cuts off (curtails) large amounts of solar power. At the same time, SMEs pay some of the highest electricity prices in the EU.
- **Mechanism:** An agent learns each business's movable loads (cold rooms, water heating, pool pumps, hotel laundry, EV charging, ice making). It plans those loads into the surplus hours every day, controls them where it can connect, and measures the saving against the bill.
- **Kills:** manual energy planning. Turns a national waste into SME savings and real Scope 2 cuts.
- **Why not generic:** demand response exists for large sites in big grids. Nobody offers it for micro-SMEs in a curtailed, isolated grid, with savings checked against the bill.
- **Risks to test:** how much curtailment there really is, by hour (TSO data), whether EAC tariffs pay for shifting, what the SME's equipment can control, and whether a TSO/aggregator licence is required.
- **Research question:** Can an agent that only sees bills and a few device signals shift enough load to save at least 10% for a typical hotel/food SME?

### B. Agents that talk to agents: "Sustainability paperwork answers itself"
- **Pain (measured in S1):** banks, buyers and tenders each send their own sustainability questionnaire. SMEs answer the same facts again and again.
- **Mechanism:** Each SME has an agent that holds its checked facts. A bank's or buyer's agent sends a request. The SME agent works out which facts answer it ("formal answer equivalence", I-24), applies the owner's sharing rules, and answers with the evidence attached. The requester can re-check the answer without a person.
- **Kills:** questionnaires, for both sides.
- **Why not generic:** autofill tools already exist (killed in S2). Two things are new, if I-24 survives: answers stay provably equivalent across different frameworks, and both sides are agents with consent control.
- **Risks:** needs banks/buyers on the other end (cold start), and I-24 is still untested.

### C. Upgrade Club Agent: "SMEs buy solar and heat pumps together, financed by the savings"
- **Pain (measured):** SMEs don't invest in energy upgrades because of upfront cost, not knowing what pays back, and the hassle.
- **Mechanism:** Agents find SMEs with similar upgrade needs (from their bills). They group them into a buying club, get quotes from installers, and put together a finance package for each business that a bank can approve, with verified expected savings. After install, the agents track the real savings.
- **Kills:** energy audits, quote chasing and loan paperwork for small upgrades.
- **Why not generic:** group buying exists for households. The new part is agents forming the groups from bill evidence and producing bank-ready savings evidence.
- **Risks:** installer and bank partners, whether savings forecasts are accurate enough, and whether a credit intermediary licence is required.

### D. Asset Memory Agent: "Your machines build your credit history"
- **Pain:** SMEs can't prove how efficient or well-looked-after their equipment is. Green loans and CBAM default values punish them for it.
- **Mechanism:** Agents keep a running history for each asset from invoices, service records, meter readings and photos. That history becomes evidence for loans, insurance and CBAM declarations that use actual values.
- **Status:** weak lead from mining run 1. Needs a pain check with banks first.

### E. Rule Change Agent (supporting, not a headline)
- When an EU or Cyprus rule changes, work out what changes for each workspace and draft the tasks. Useful, but regtech tools already do this. **It is engineering, not innovation.**

### Dropped at brainstorm
- "Confidence ranges" as a headline (the founder rejected it; it stays as an internal part).
- Proof or audit trails as the pitch (infrastructure, not impact).
- Generic "AI employee" rosters.

**Recommended lead for Slush:** A (Grid Surplus) as the "how does that work?" story, with C as the money story. B is the long-term network moat. All three share one engine.

## 4. The ecosystem architecture

```text
 Triggers            Orchestrator              Agents                  Outside world
 cron / webhook  ->  queue + durable state ->  Evidence, Grid,     ->  EAC, banks, buyers,
 new document        budget + risk policy      Club, CBAM,             installers, devices
 other agents        approval gate             Exchange, Rules         (via tool contract)
                          |
                  Ledger: every step, input hash, model, cost, approver
```

- **Runtime:** Cloudflare Workers with Cron, Queues and Durable Objects (one per workspace: state, locks, schedule). This keeps us inside the Cloudflare-only hosting rule. It departs from the strategy doc's Inngest choice, so it needs founder sign-off.
- **Tool contract:** every capability (read bill, query tariff, send request, control device) is one typed tool with a risk level. Agents never call outside systems directly.
- **Autonomy levels per act:**
  - L0 read and analyse: runs freely
  - L1 internal writes (tasks, readings): runs freely, can be undone
  - L2 outward-facing (send an answer, move a device schedule): runs inside limits the owner set, otherwise asks
  - L3 legal or financial (CBAM filing, loan application): always a human signature
- **Safety:** a spending cap per workspace, a kill switch, retries with limits, a dead-letter queue, and loop detection.
- **Memory:** workspace facts with their sources. Agents share facts, not free-text chat.
- **EU AI Act / GDPR:** the ledger records which agent produced what and who approved it. Pilot data is used for research only with consent.
- **Approve that acts:** approving a proposal runs the real follow-up act. This closes roadmap items P3c and P3d.

## 5. Build order

| Step | Build | Proves |
|---|---|---|
| 1 | Orchestrator, ledger, tool contract, autonomy levels, kill switch | The platform runs safely 24/7 |
| 2 | Evidence agent (collects and reads bills on a schedule) | Real data flows in |
| 3 | CBAM agent (first paid job, L3 signature) | Revenue and "approve that acts" |
| 4 | Research gates on A and C (curtailment data, tariffs, pilot SMEs) | Whether the headline is real |
| 5 | Grid Surplus agent pilot with 3 hotels/food SMEs | Measured euros saved |
| 6 | Upgrade Club and Exchange agents | Network effect |

## 6. Open items and blockers
- Curtailment and tariff data from TSO Cyprus / EAC (public or by request).
- 3 to 5 pilot SMEs with movable loads and their consent.
- Legal check: aggregator licence (A), credit intermediation (C).
- Founder sign-off on Cloudflare Queues/Durable Objects instead of Inngest.
- Nothing from Section 3 goes into the pitch until it passes research gate S4.

## Technical details
- New tables: `agent_runs` (real, replacing the sample data), `agent_steps` (the ledger), `tool_calls`, `autonomy_policies`, `workspace_facts` (value, source hash, time valid).
- A per-workspace Durable Object holds the schedule and lock. Queue consumers run the steps. The existing Cloudflare cron handler enqueues due work.
- AI calls go through the existing `src/lib/lovable-ai.ts`, with a cost cap per run.
- Research registry: add I-25 (A), I-26 (C) and I-27 (D) to `research/ideas.csv`, and link B to I-24.
