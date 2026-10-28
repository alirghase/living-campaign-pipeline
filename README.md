# Living Campaign Pipeline

A clickable MVP of an automated campaign asset pipeline for **Living**, a fictional property brand with two journeys: **Rental** and **Shared Ownership**.

One approved brief becomes copy and graphics for every channel: Facebook, Instagram, LinkedIn, Google Display and Email. Automation handles production, routing, checking, chasing, packaging and measurement. People own strategy, creative judgement, the brand, business and risk decisions, and final approval.

Everything runs in the browser on synthetic data. There is no backend, no login and no real AI calls.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static build in dist/, which opens from any web server
```

## Demo walkthrough (about 5 minutes)

1. **Pipeline Overview**: the 8-stage loop. Switch between All, Rental and Shared Ownership. Each stage is tagged *Automated* or *People decide*.
2. **Structured Briefs** → *Create new brief*. Picking a journey fills in its templates, tone and disclaimer. *Submit & auto-route* sends the brief to its queue.
3. **Journey Routing** → *Generate assets* on the new brief. The Studio opens on the "create once, adapt many" cluster.
4. **Content Studio** → *Regenerate* a variant, then *Send to pre-checks*.
5. **Pre-Checks & QA** → *Run checks*. The scan runs gate by gate. Failed assets go back to creation, and passed ones are submitted for approval.
6. **Approvals**: drag a card into Brand and Risk to run both at once, or open it to review the asset next to its brief. Each reviewer approves on their own, and the audit trail records every step.
7. **Campaign Package** → *Publish* (shows progress per channel, then confetti) or *Reuse* (creates a draft brief from an approved asset).
8. **Measurement**: KPIs, charts and the assumptions table update from what you just did.

Use **Pilot** in the top bar to narrow everything to one Rental campaign. *Reset demo data* is in the avatar menu.

## Stack

React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Zustand, React Router, Recharts, dnd-kit.

- `src/data/`: typed synthetic data (team, briefs, assets, checks, copy banks, baseline metrics)
- `src/store/useStore.ts`: every workflow action
- `src/lib/selectors.ts`, `src/lib/metrics.ts`: derived stage counts and live KPIs
- `src/pages/`: the 9 views

All names, developments, figures and copy are synthetic.
