# Nutrition for Champions — app concept

A companion app for competitive distance runners built around Cole Hocker's
"Nutrition for Champions" guide. The guide is already a complete rule system; it
just lives as a static PDF. The app turns those rules into a daily system: it
**generates** meals that obey the rules and **tracks** the habits that decide a
season. Tagline: *Control the Controllable.*

> Source material: `Nutrition for Champions` guide (8 chapters) + the fuller
> coaching originals (`Nutrition for Champions.doc`, `COMMITTE2.doc` — Peg Morse /
> distance-program handouts). This doc is the written spec behind the branded
> concept pitch and the Claude-generated UI prototype.

## The thesis

A principle doesn't hydrate you at 3pm, doesn't know you race Saturday, and doesn't
notice you've eaten the same three dinners all week. Everything the app does already
exists in the guide as knowledge — the app converts it to behavior.

| The guide (knowledge) | The app (behavior) |
| --- | --- |
| Hit 40/30/30 at every meal | Generates meals that *are* 40/30/30 |
| Red meat 2–3×/week for heme iron | Schedules the heme meals, tracks the count |
| Pair iron with Vitamin C, 5:1 | Auto-plates a Vit C source beside the iron |
| Low-glycemic before, high-glycemic after | Reads the training day and times the carbs |
| Supplements: 2 weeks on / 5 days off | Runs the cycle, tells you what's on today |
| Sleep, re-fuel windows, no food after 8pm | Nudges the windows, scores the streak |

## Three jobs, one loop

1. **Plan / Generate** — meal ideas built to the guide's rules and today's session
   (macros, iron, timing, pantry solved together). *The meal engine.*
2. **Track / Score** — hydration, macros per meal, weekly iron, servings + variety,
   supplement cycle, recovery habits, on one daily scoreboard. *Adherence.*
3. **Learn / Coach in context** — the guide surfaced where it matters: the "why"
   attached to every meal and nudge, in Cole's voice. *Knowledge base.*

## The meal engine (the differentiator)

A generic meal app optimizes calories. This one optimizes for a distance runner's
physiology, because each rule in the book becomes a constraint the generator must
satisfy before it returns a plate.

| Source | Constraint |
| --- | --- |
| Ch 02 — 40/30/30 at every meal | Hard macro ratio per generated meal, not just per day |
| Ch 02 — glycemic timing | Low-GI carbs pre-session; high-GI in the 30-min post window |
| Ch 04 — heme iron 2–3×/week | Schedules red-meat meals across the week, counts them down |
| Ch 03/05 — nutrient interactions | Auto-plates Vitamin C with iron (5:1); keeps caffeine away from it |
| Ch 02 — good vs. poor foods | Whitelist / blacklist — no margarine, no colored soda, real food first |
| Ch 06 — variety rule | Rotates sources; the body stops absorbing what it sees daily |

**What the generator reads**

- **Session** — today's training load & timing → glycemic + re-fuel logic
- **Week** — heme-iron count, variety history, servings so far
- **Athlete** — male/female iron target, allergies, dislikes, dietary limits
- **Pantry** — on-hand ingredients & travel mode ("convenience is not an excuse")
- **Book** — the full rule set as guardrails on every suggestion

**Example output** — a post-session plate: *seared sirloin, sweet potato, garlicky
spinach, orange wedges* (~640 kcal, 40/30/30). "Why this plate": heme iron (2nd of 3
this week) · orange = Vit C 5:1 for absorption · high-GI carb inside the 30-min
window · no caffeine (protects the iron).

## Track — the daily scoreboard

Chapter 6's "Committed to Recovery" checklist becomes a glanceable dashboard,
most-off-first, with state encoded in color + shape (pill/chip/stripe):

- **Hydration** — ring toward 7–8/day; 15–30 min timer nudges; urine-color check-in
- **Macros today** — 40/30/30 split, checked per meal (not just daily total)
- **Iron this week** — heme servings (target 2–3); ferritin log + retest reminder
- **Fruit/veg** — 4–5 servings/day; variety streak (no repeats)
- **Supplement cycle** — 2 weeks on / 5 days off progress; what's ON today.
  *Coach-approved list only — dosed to Cole's protocol, not the bottle.*
- **Recovery habits** — bed by 10–11pm, re-fuel within 30 min, no food after 8pm,
  shoe rotation, soft-surface %

## Signature protocols (the timed edges)

The sharpest ideas in the coaching docs are about *timing* — sequences only an app
can run. These justify the app over the PDF.

- **Natural HGH window** — post hard effort, water + whey only for 0–90 min, *then*
  add carbs + protein. Carbs suppress HGH; delaying them extends secretion for bone
  and muscle recovery. Surfaced as a live countdown.
- **Testosterone plate** — a meal-gen preset run 3–4×/week: heme iron + non-heme
  iron + Vitamin C + antioxidants (e.g. red meat + potato + spinach + dark chocolate).
- **Iron absorption stack** — an iron meal only "counts" when its co-factors are
  present: 5:1 Vitamin C to iron; B6/B12/E/folate/zinc present; no caffeine nearby.
- **Race-day caffeine** — the one stimulant in the system: a single 200mg dose,
  60 min before a race, meet-mode only. Never a daily habit.
- **Pre-fuel / re-fuel windows** — protein + carbs together, 3–3.5h before and
  within 30 min after hard efforts.

## Adaptive layer

Sync a training calendar (or a coach's plan) and the day's nutrition reshapes itself:
hard days arm the pre-/re-fuel windows and schedule the heme-iron meal; recovery days
lean into antioxidants and Omega-3s; race day flips to the travel checklist and the
timed race protocol.

## Knowledge model

Each chapter maps to a table or rule set, so generation is trustworthy — the model
assembles meals within Cole's guardrails rather than inventing nutrition advice.

- **Food library** — `{ name, category, glycemic: low|high, macros{c,p,f},
  iron_mg, iron_type: heme|non-heme, vit_c_mg, calcium, zinc, good|poor, tags[] }`
- **Constraint set** — 40/30/30 per meal; heme_iron ≥ 2×/week; vit_c:iron ≥ 5:1;
  no caffeine ± iron meal; pre → low-GI, post → high-GI; rotate sources
- **Athlete state** — daily `{water, meals[], servings}`; weekly
  `{heme_count, variety}`; `ferritin_log[]`; supplement_cycle; sex, targets,
  allergies, dislikes
- **Generation call** — Claude, given `state + rules + pantry`, returns structured
  meals → validate against constraints → attach the "why" from the guide

## Roadmap

| Phase | Focus | Scope |
| --- | --- | --- |
| **1 · MVP** | The daily scoreboard | Hydration + macro + servings tracking; iron & ferritin log with retest reminders; supplement cycle scheduler; recovery habit checklist; guide readable in-app |
| **2 · Engine** | Meal generation | Rule-constrained meal ideas + "why"; pantry & dietary personalization; pre/post-session timing; grocery list from the week |
| **3 · Adaptive** | Training-aware | Calendar / Strava / coach-plan sync; race & travel mode with protocols; trend insights & season review; Cole content drops as coaching |

Recommended first cut: the **Today scoreboard** and the **Meal Generator** — what an
athlete opens daily, and what makes it more than a PDF. Everything else hangs off
those two.

## Build fit

Rides the same stack as the Cole Hocker site — nothing new to stand up.

- **Frontend** — Next.js App Router (mobile-first; PWA, native later)
- **Data + Auth** — Supabase (Postgres, RLS)
- **Generation** — Claude via Vercel AI Gateway, schema-validated structured output
- **Hosting** — Vercel

## Brand / UI direction

Committed dark theme carried from the guide's cover. Ground near-black (`#0b0b0d`),
single accent "champions" gold (`#c9a24b` / bright `#e0bd68`), warm-grey labels
(`#8f897c`), cream contrast bands. Semantic-only green/amber/red for tracker states
(separate from the accent). Type: thin/light large display (Helvetica-family, weight
200–300, tight tracking) against wide-tracked uppercase monospace labels and data —
that weight-and-tracking contrast is the brand. Tabular figures throughout.

## Open questions

- **Supplement safety** — represent supplements as a coach-approved list with a
  "check with coach" gate rather than the app prescribing dosages directly.
- **Standalone vs. site feature** — its own app, or a gated module inside
  colehocker.com? (Notion brief lists it as "app brief + branded PDF.")
- **MVP line** — ship tracking-only first, or tracking + meal generator together?
