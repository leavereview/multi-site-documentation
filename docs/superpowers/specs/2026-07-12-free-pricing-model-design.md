# Free Pricing Model — mydojo.software & mytattoo.software

**Date:** 2026-07-12
**Status:** Approved, pending implementation

## Problem

Both products should be free to use, with paid monthly subscriptions introduced later.
The two sites are in very different states, and neither currently tells the truth.

**mydojo.software** sells three subscription tiers ($49 / $79 / $119 per month) and a 30-day
free trial. The dojo app cannot take payments at all: `dojo/prisma/schema.prisma:23` says
*"Billing is OUT of MVP scope — no Stripe models here at all"*, the Stripe keys in
`.env.example` are commented out, and `ARCHITECTURE.md:263` lists member billing as backlog.
The entire pricing page is fiction.

**mytattoo.software** is already free, and Stripe Connect is already live — destination
charges, artist connects their own Stripe, deposits settle straight to them
(`mytattoo/src/lib/services/deposit.ts:186`, which deliberately sets no
`application_fee_amount`: *"the platform fee is £0 for the MVP"*).

## Decision

**Both products are free while in early access. No commission. Paid monthly plans in future,
with at least 30 days' notice.**

### Rejected: free + 2% commission on Stripe Connect deposits

This was the original brief. It was rejected for four reasons.

1. **The revenue is a rounding error.** 2% of a typical £50 deposit is £1. A working artist
   books 15–25 new appointments a month, so the commission earns £15–25 per artist per month.
   Clearing £5k/month would need ~250 active artists — and at that scale subscription MRR is
   both larger and more predictable.

2. **It spends the best line in the market.** "We take £0 of your deposit — you keep every
   penny" is a *categorical* claim no competitor can match (Booksy takes 30% of new-client
   bookings). A 2% fee downgrades it to *"we take less than them"* — a quantitative claim
   every competitor can argue with. That is worth far more than £20/artist/month.

3. **Our own content correctly argues against it.** Six MyTattoo pages state that percentage
   fees punish success — e.g. `tattoo-studio-software.astro:406`, *"Many 'free' platforms
   aren't really free — they take 3–5% of every booking."* Adopting a percentage fee would
   mean rewriting our own best content against itself.

4. **It costs two changes instead of one.** free → 2% → subscriptions is two announcements
   and two walk-backs. free → subscriptions is one. Staying at £0 preserves the strongest
   possible pitch for the eventual subscription launch: *"MyTattoo is now £X a month — and we
   still take £0 of your deposits. We're the only booking platform that doesn't touch your
   work."*

**This decision is revisitable.** Nothing here forecloses a commission later; it declines to
pay the positioning cost now, while the revenue it would buy is negligible.

## The model (both sites)

- Free to use. No subscription, no setup fee, no per-student or per-booking fee.
- **No free trial** — there is nothing to trial, the product is free.
- Explicitly time-boxed: free **while we're in early access**.
- Future: paid plans, with **at least 30 days' notice** before any charge (this already matches
  `mytattoo/src/pages/terms.astro:80`).
- MyDojo mentions **no** future commission — that would pre-commit us to the rejected model.
- MyTattoo keeps its £0 platform fee and "you keep every deposit" promise, unchanged.

## Scope — mydojo.software (the bulk of the work)

| Area | Change |
|---|---|
| `pages/pricing.astro` | Full rewrite. Remove the 3 tiers, the 30-day trial, both JSON-LD `Offer`/free-trial schemas, and the 8 tier-policing FAQs (student limits, annual billing, Enterprise). Rebuild as "MyDojo is free" + the full feature list (which survives — it's the best part of the page) + new FAQs: *is it really free / how do you make money / will you start charging*. **The "how do you make money?" answer must not mention a commission** — that would pre-commit us to the rejected model. It answers: *right now, we don't. MyDojo is free while we're in early access. We'll introduce paid monthly plans in future, with at least 30 days' notice before anything changes.* |
| `pages/terms.astro` | §4 *"Access to our Services requires a paid subscription"* and §5 *"trial will automatically convert to a paid subscription"* are both false. Rewrite, mirroring mytattoo's already-correct §7. |
| 6 pillar pages | FAQ price claims (£79/£99 flat-rate) — **each exists twice**, see Gotchas. 4 `ComparisonTable` "Monthly Price" rows → MyDojo becomes `Free`. 6 meta descriptions advertising a free trial. |
| `layouts/PillarPageLayout.astro`, `components/Footer.astro` | Trial CTAs that render across every pillar page and sitewide. |
| `pages/index.astro` | 2 JSON-LD `Offer` blocks (14-day trial), meta description, hero + closing CTAs. |
| Blog (12 files) | 10 × `[Start your free trial](/contact/)` anchor text. `best-martial-arts-software.md:155` MyDojo row (£49/month → Free; the two "No" transaction-fee columns **stay** — still true). `gym-management-software-comparison.md:259,274`. |
| Misc | `about.astro`, `blog/[slug].astro`, `blog/tag/[tag].astro` ("Affordable plans"), `dojo-revenue-calculator.astro`, `privacy-policy.astro`. |

## Scope — mytattoo.software (small)

| Area | Change |
|---|---|
| `pages/pricing.astro` | Keep the £0 promise verbatim. Add an explicit statement that paid plans are coming with at least 30 days' notice, so the page agrees with `terms.astro:80` and the eventual subscription is not a surprise. |
| `pages/tattoo-software-comparison.astro:21` | **Bug.** `{ label: 'Free entry tier', values: [false, false, false, true] }` marks MyTattoo as having no free tier. Columns are `MyTattoo | Booksy | Mindbody | Square` (comment, line 9), and the same page says MyTattoo is free at lines 165 and 195. Flip to `true`. |
| `pages/terms.astro` | **No change.** Verified already correct: lines 76–80 state free of charge, no share of deposits, and 30 days' notice before any charges. |

Everything else on mytattoo — the `£0 Platform Fee` stat cards on 5 pillar pages, the hero stat
at `index.astro:53`, the `£0 Platform Fee` comparison rows, and all eight "3–5% punishes success"
passages — **stays exactly as it is**, because all of it remains true.

## Explicitly out of scope

- **`mytattoo/src/lib/services/deposit.ts`** — no `application_fee_amount`. Unchanged.
- **A `src/config/pricing.ts`** — considered and dropped. It was justified by a 2% rate
  appearing in ~40 places; with no rate, it would hold nothing. Revisit when subscription tiers
  land, which is the change that will actually need it.
- **Revenue calculators** (`dojo-revenue-calculator`, `tattoo-studio-calculator`) — these model
  the *customer's* economics, not ours.
- **Competitor pricing** in comparison tables.
- **Industry-pricing blog posts** (cost-to-open-gym, gym-owner-salary, how-much-do-tattoos-cost,
  tipping guides) — the reader's business, not ours.
- **Building the dojo payment rail** — a separate project.

## Pre-existing bugs fixed in passing

- `mydojo/pricing.astro` displays `$49/$79/$119` while its `Offer` schema declares
  `"priceCurrency": "GBP"`, and every other page quotes £. Mismatched price/currency is a
  Google rich-result risk.
- `mydojo/pricing.astro:175,187,197,373` link to `#trial`. **No `id="trial"` exists anywhere in
  the repo** — four CTAs that scroll nowhere.
- Trial length contradicts itself: `pricing.astro` says 30 days, every pillar page body says 14.
  (Moot — all trial copy is being removed — but worth naming.)
- `mytattoo/tattoo-software-comparison.astro:21`, above.

## Gotchas for implementation

1. **Every pillar FAQ answer exists twice** — once in the `FAQPage` JSON-LD `"text":` field and
   once in the rendered `faqs[].answer` array. Change one and not the other and the rendered FAQ
   contradicts the structured data. This is the easiest mistake to make in this change.
2. **`utils/schema/types.ts:14` declares `offers` as a required field** on
   `SoftwareApplicationSchema`, and `package.json` runs `astro check && astro build`. Do not
   delete the `offers` block — set `price: "0"`. Deleting it fails the build.
3. **`ComparisonTable` arity** — `values[]` must stay the same length as `headers[]`. Substitute
   a value (`'Free'`) or remove the whole row object; never delete a single cell.
4. **Keep the `/pricing/` route on both sites.** 40+ inbound internal links and real SEO equity.
   The page describes a different model; the URL does not change.
5. The MyDojo price sentence is the *last* sentence of a longer market-pricing FAQ answer.
   Deleting it leaves grammatical prose that never mentions MyDojo — replace the sentence, don't
   remove it.
6. **MyDojo has no self-serve signup.** Every CTA points at `/contact/` (unlike MyTattoo, which
   links to `app.mytattoo.software/signin`). So trial CTAs become "Get started free" but the
   link target is unchanged. Worth knowing that "free" on mydojo still means "talk to us" until
   a signup flow exists — that gap is not in scope here, but it blunts the free positioning.

## Verification

1. `npm run build` in each site (postbuild runs `verify-seo.js`).
2. Grep gate — zero residual `$49`, `Starter Plan` / `Growth Plan` / `Professional Plan`,
   `monthlyPrice`, `free trial`, `30-day`, `14-day` in `mydojo.software/src`.
3. Counter-gate on mytattoo — the `£0` / "keep every deposit" claims must still be **present**.
4. `./deploy.sh mydojo.software` and `./deploy.sh mytattoo.software` (guarded: clean rebuild,
   `--delete` dry-run, then fails unless the live sitemap matches the fresh build).
5. Submit changed URLs to the Google Indexing API — pricing and terms especially, whose meta
   descriptions change.
6. Log the change to the SEO changelog via `tools/gsc-client` (required by CLAUDE.md),
   `--category=content`, both sites.
