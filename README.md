# Living Campaign Pipeline

**Open the demo:** https://alirghase.github.io/living-campaign-pipeline/

## What is this, in one breath?

Picture a bakery that has to make the same cake in five sizes for five different shops. Done by hand, someone bakes each cake separately and then walks it round to three managers for a taste test. This app is the machine version. You write **one recipe** (a *brief*), the machine **bakes all five sizes** (the *assets* for Facebook, Instagram, LinkedIn, Google ads and email), a **robot checks** each cake for obvious mistakes, the **three managers taste at the same time** instead of one after another, and the good cakes go out to the shops. A scoreboard at the end shows how much faster that is.

The brand is a made-up property company called **Living**. It sells homes two ways:

- **Rental** (shown in **teal**): you rent a flat.
- **Shared Ownership** (shown in **purple**): you buy part of a home and rent the rest.

**The one rule to remember:** *the machine does the boring, repeatable work, and people make every important decision.*

Everything here is pretend: the people, the homes, the numbers. Nothing is sent anywhere, and no real AI runs. Click whatever you like.

---

## The 5-minute show-and-tell

Follow these steps in order. Each step says **what to click**, **what you'll see**, and **what to say**.

### Before you start
- Use a laptop or a big screen. The app is built for a wide display.
- The **moon/sun button** at the top right switches between dark and light. Use light mode on a projector.
- If things get messy, click the **round avatar (PS)** at the top right and choose **Reset demo data**. Everything goes back to the start.

### Step 1: The big picture (Pipeline Overview)
- **You'll see:** 8 boxes joined in a loop, with little dots moving between them. Those dots are work flowing through.
- **Notice:** each box has a tag. **Automated** means the machine does it. **People decide** means a human does.
- **Notice the colours:** a green dot means fine, amber means slowing down, red means stuck.
- **Click** *Rental* or *Shared Ownership* at the top right to see just one type of home.
- **Say:** *"This is the whole journey, from idea to results. The dotted line on the left means we reuse what we learned next time."*

### Step 2: Write a brief (Structured Briefs)
- **Click** **Structured Briefs** in the left menu. You'll see a list of campaigns.
- **Click** any row. A panel slides out with the full brief: who it's for, the key messages and the tone.
- **Click** **Create new brief** (top right). Type a name, for example *Spring Launch Leeds*.
- **Click the Rental box.** Templates, tone tips and the legal wording fill in by themselves.
- Type a short objective, then **click Submit & auto-route**.
- **Say:** *"Everyone fills in the same form, so nobody has to chase for missing details later."*

### Step 3: It sorts itself (Journey Routing)
- **Click** **Journey Routing**. You'll see two columns, Rental and Shared Ownership. Your new brief is already in the Rental column.
- **Click** **Generate 5 assets** on your brief and wait a second.
- **Say:** *"It went to the right team by itself, and each team has its own templates."*

### Step 4: One idea, many versions (Content Studio)
- You land on a picture with **the main message in the middle** and **lines out to five versions**, one per channel, each a different size and length.
- **This is the "create once, adapt many" moment, so pause here.**
- Scroll down. **Click Regenerate** on any card. It thinks for a moment, then writes new wording.
- **Click** **Send 5 to pre-checks** (top right).
- **Say:** *"One idea becomes five ready-to-use versions. The designer picks and polishes instead of starting from scratch."*

### Step 5: The robot checks (Pre-Checks & QA)
- **Click** **Pre-Checks & QA**. Pick one of your new assets from the list on the left.
- **Click** **Run checks**. Watch it tick through 8 checks one at a time: size, colours, logo, legal wording, tone and more.
- A **green** result shows **Submit for approval**. Click it.
- A **red** result shows what's wrong and a **Send back to creation** button.
- **Say:** *"The robot catches silly mistakes, so the managers never waste time on them."*

### Step 6: Three managers at once (Approvals)
- **Click** **Approvals**. The middle section is the **parallel review lane**: Brand, Business and Risk side by side.
- Cards with a **red timer** are overdue. Nobody has to chase by email, because you can see it.
- **Drag** a card from *Pending* into **Brand**, then drag the same card into **Risk**. It's now in both at once.
- **Click** a card. You see the asset **next to its original brief**, plus the list of who did what and when.
- Under **Review as**, approve as **Brand**, then **Business**, then **Risk**. After the third, it's fully approved.
- **Say:** *"The three checks happen at the same time instead of one after another. That's where most of the waiting used to go."*

### Step 7: The approved library (Campaign Package)
- **Click** **Campaign Package**. Each row is one campaign with all its versions bundled together.
- **Click** a row to open it, then **click Publish**. Bars fill for each channel, then confetti 🎉.
- **Click Reuse** on any asset. It starts a new brief from that approved work.
- **Say:** *"One place for every approved asset, and good work gets reused instead of rebuilt."*

### Step 8: Where it goes (Channel Delivery)
- **Click** **Channel Delivery**. You'll see one column per channel showing what's live, scheduled or paused, plus a pretend social-media scheduler.

### Step 9: The scoreboard (Measurement)
- **Click** **Measurement**. The top row compares then and now. For example, brief to launch is **3.2 days, down from 8.5**.
- The charts and the **Assumptions validation** table check each claim we made against the evidence.
- **Process health** points to the current slow spot.
- **Say:** *"These numbers changed as we clicked through. Every action feeds the scoreboard."*

### Bonus: the Pilot button
- **Click** **Pilot** at the top. Everything shrinks to **one Rental campaign**.
- **Say:** *"We start small with one campaign, prove it works, then roll it out to Shared Ownership."*

---

## If someone asks…

| Question | Answer |
|---|---|
| Is the AI real? | Not in this demo. The words are pre-written to show how it would work. The tool names (Firefly, Figma AI, Copilot) are just labels. |
| Is the data real? | No. Every name, home, number and post is made up. |
| Does anything get posted? | No. Publishing is an animation only. |
| Who makes the decisions? | People do. Brand, Business and Risk approve every asset before it can go live. |

---

## For developers

```bash
npm install
npm run dev      # local version at http://localhost:5173
npm run build    # static build in dist/
```

Every push to `main` deploys to GitHub Pages automatically.

React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Zustand, React Router, Recharts, dnd-kit. Synthetic data lives in `src/data/`, workflow actions in `src/store/useStore.ts`, and the 9 screens in `src/pages/`.
