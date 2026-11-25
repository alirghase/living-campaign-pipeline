# Lloyds Living · Campaign Agent

**Open the demo:** https://alirghase.github.io/living-campaign-pipeline/

> Concept demo built for an internal pitch. It is not an official Lloyds Living or Lloyds Banking Group product. Developments and news are taken from public sources; offers, numbers, people and audiences are illustrative.

## What is this, in one breath?

A marketer types one campaign request in plain English. A team of **six AI agents built on Google Gemini** turns it into a finished, channel-ready campaign:

| Agent | What it does | Runs on |
|---|---|---|
| **Brief Strategist** | Turns the free-text request into a structured brief: objective, audience, insight, key messages, master headline | Gemini (structured JSON) |
| **Journey Router** | Decides Rental or Shared Ownership, then sets the SLA, reviewers and formats | Gemini + routing rules |
| **Copywriter** | Writes 3 headline options, body and CTA for every format, to each character limit | Gemini |
| **Art Director** | Defines one visual concept and writes the key-visual prompt | Gemini |
| **Image Generator** | Paints **one** key visual, then re-frames it for every aspect ratio using it as a reference, so every format shows the same homes and people | Gemini image models ("Nano Banana") |
| **Brand & Compliance QA** | Runs 8 checks per asset (vision + rules) and sends failures back to the Copywriter or Image Generator to fix themselves | Gemini vision + rules |
| **Brand, Business & Risk** | **People** pick headlines, direct the visuals ("make it golden hour") and approve, all three in parallel | People |

Copywriter and Art Director run in parallel. Everything streams into a live **agent trace** so the room can see each agent think, call a tool and hand off.

**The design rule:** the model makes the *photography*; the brand layout system sets the *type*. Headline, CTA, logo and the mandatory disclaimer are typeset by code at each channel's true pixel size. Nothing the AI generates can misspell a legal line, and Risk always approves the exact words that will run.

The look is taken from the **@lloydsliving Instagram feed**:
- **Palette:** bright green `#11b67a`, dark green `#006c4e`, neon mint `#6cf579`, pale mint `#c8ffc5` and lavender `#9e9ce1`.
- **Ad templates:** the templates copy the feed's own posts. That means swoosh panels ("Growing family?", "Make your move to Lapwings"), heavy sentence-case headlines, tilted location pills ("Osprey View, Worksop"), the stacked LLOYDS / LIVING lockup and the black arrow button with a neon ring. The lockup is text only; the black horse logo is a trademark, so it isn't reproduced.
- **Brand line:** "Built for life's next chapter."

Example briefs use real developments from the feed and the news: Lapwings (Burleyfields, Stafford), Osprey View (Worksop), Warren Wood View (Gainsborough), Oxenden Park (Herne Bay), Hampton Beach (Peterborough), Pathways and *Lloyds Living Stories*.

---

## Live or demo mode

- **Demo mode** (default, no setup): every agent runs with offline outputs and a brand illustration instead of photography. Same flow, same trace, same QA self-repair. Safe for a projector with bad wi-fi.
- **Live mode:** click **Connect Google AI Studio**, paste a key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and press **Connect**. The app lists your models and picks the newest fast text model and image model; you can change both.

Your key stays in your browser (`localStorage`) and is sent only to `generativelanguage.googleapis.com` in the `x-goog-api-key` header.

**When Google is busy:**
- If a model is overloaded, rate-limited, out of quota or retired, the agents switch to the next model on your key, and the trace shows each switch.
- The app remembers which models are down and skips them until they're likely to work again. Reconnecting your key resets this.
- If nothing answers, that agent falls back to its offline output, so the demo never stalls.

### Free routes for the key visual (no billing)

On Google's free tier, the text, vision and QA agents work, but image models have a quota of 0. Under **Creative concept** you have two free options, and either one is then applied to every format and re-checked by the QA agent:

- **Generate free with Pollinations:** one click. It sends only the scene description (no brief, names or numbers) to the free [Pollinations](https://pollinations.ai) service. The image is 1024px wide with a small "pollinations.ai" watermark. The keyless tier only accepts requests from approved web addresses such as the published site, so it won't work from `localhost`, and it can be busy (the button retries).
- **Make it in the Gemini app:** copy the prompt, generate the image there, download it and upload it.

With billing enabled, the Image Generator does this itself: one key visual, then re-frames for each format.

**Safety net for the meeting:** after a good live run, click **Save run**. This downloads a JSON file including the generated images. In the meeting, **Load saved run** brings it back instantly with no network needed.

---

## The 5-minute show-and-tell

### Before you start
- Laptop or big screen, light mode (moon/sun button top right).
- Optional: connect Google AI Studio beforehand and do one rehearsal run, then **Save run**.
- **Reset demo data** lives under the round avatar (PS), top right.

### Step 1: One brief in (Campaign Agent, the home screen)
- Pick **Make your move to Lapwings**. Each card cites the post or news it's based on.
- The request box shows what a marketer would really type. Edit it live if you like: change the audience, add LinkedIn.
- **Say:** *"No forms. Just tell it what you need."*
- Click **Run the agent team**.

### Step 2: Watch the agents work
- The rail at the top lights up agent by agent. **Copywriter and Art Director run in parallel.**
- The **agent trace** on the right streams every thought, tool call and hand-off. Click any line with a ▸ to see the raw JSON.
- The brief, routing decision (with confidence) and creative concept fill in as they're produced.
- **Say:** *"Each agent has one job and a typed output. You can audit every decision."*

### Step 3: Self-repair
- Look for the orange **Self-repairing** status and the line *"failed copy length. Sending back to the Copywriter."* QA caught a headline too long for the 728×90 banner, and the Copywriter fixed it before any person saw it.
- **Say:** *"The silly mistakes never reach a manager."*

### Step 4: One key visual, every format
- Six assets, each at its real size, all from **one** key visual. Toggle **In channel** to see them inside an Instagram feed, a story, a Facebook post, a display ad and an email.
- Hover the 8 QA bars on any card to read each check.
- **Say:** *"Create once, adapt many: for real this time, not a mock-up."*

### Step 5: People decide
- Pick a different headline option on a card, and the creative updates.
- Type a direction such as *"golden hour light"* or *"add a family dog"* and press **Refine**. In live mode Gemini edits the photo itself.
- Click **Send 6 to approvers**.
- **Say:** *"AI does the production. People own the judgement."*

### Step 6: Three managers at once (Approvals)
- You land on **Approvals** with the new campaign in the parallel lane: Brand, Business and Risk side by side.
- Open a card: the asset sits next to its brief, and the audit trail lists every agent step.
- Approve as Brand, then Business, then Risk. After the third, it's fully approved.

### Step 7: Package, deliver, measure
- **Campaign Package**: the approved assets bundled by campaign. **Publish**, then confetti 🎉. **Reuse** starts a new brief from approved work.
- **Channel Delivery**: what's live, scheduled or paused per channel.
- **Measurement**: brief to launch is **3.2 days, down from 8.5**, and the numbers move as you click.
- **Pipeline Overview** shows the whole 8-stage loop; **Pilot** at the top narrows everything to one Rental campaign.

---

## If someone asks…

| Question | Answer |
|---|---|
| Is the AI real? | Yes, in live mode. Every agent calls Gemini through Google AI Studio, and images come from Gemini image models. Demo mode uses offline outputs and says so on screen. |
| Can it write something off-brand or non-compliant? | The QA agent checks every asset (journey leakage, banned claims, length, tone, brief fit, stray text in images) and sends failures back. Disclaimers are locked into the layout, not generated. And nothing goes live without three human approvals. |
| Why not let the AI put the text in the image? | Image models still misspell words and can't be trusted with legal lines. Typesetting copy in code keeps it crisp, on-brand and exactly what Risk approved. |
| Where does the key go? | Only to Google, from your browser. For production, calls would go through a Lloyds-hosted service (for example Vertex AI) with no keys in the browser. |
| Is the data real? | Developments and news are public. People, offers, numbers and performance data are made up. |
| Does anything get posted? | No. Publishing is an animation only. |

---

## For developers

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static build in dist/
```

Every push to `main` deploys to GitHub Pages.

React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui, Zustand, React Router, Recharts, dnd-kit.

| Path | What's there |
|---|---|
| `src/ai/gemini.ts` | Minimal Gemini REST client: model discovery, structured JSON (`responseSchema`), image generation with `imageConfig.aspectRatio` and reference images, retries |
| `src/ai/agents.ts` | The six agents, the orchestrator (`runPipeline`), QA rules and the self-repair loop |
| `src/ai/runStore.ts` | Run state, live trace, human edits, save/load run, hand-off into the approvals pipeline |
| `src/ai/brand.ts`, `src/ai/examples.ts` | Condensed brand book that agents follow; example briefs |
| `src/ai/scene.ts` | Procedural brand illustration used offline |
| `src/components/creative/Creative.tsx` | Brand layout system: typesets each format at native pixel size |
| `src/components/agent/*`, `src/pages/Agent.tsx` | Campaign Agent UI |
| `src/data/`, `src/store/useStore.ts`, `src/pages/` | Synthetic pipeline data, workflow actions and the downstream screens |

**Production path:** move the Gemini calls behind a server (Vertex AI or a Cloud Run proxy) so no key is in the browser, persist runs and assets, and connect the approved package to the real channel APIs.
