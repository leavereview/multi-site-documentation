# Comparison-Intent Content Build — Design

**Date:** 2026-07-29
**Status:** Implemented and deployed

## Problem

The `/seo-check` run on 2026-07-28 surfaced a pattern across the portfolio: large volumes of
comparison-intent impressions earning **zero clicks**, because the pages meant to serve them
either did not exist, did not name any competitor, or ranked far below the query's position band.

Measured comparison-intent demand, 90 days to 2026-07-28:

| Site | Comparison impressions | Clicks |
|---|---|---|
| mydojo.software | 2,238 | 0 |
| mytattoo.software | 1,291 | 0 |
| driveschoolpro.com | 568 | 0 |
| petcare.software | 4 | 0 |

## Key finding: two page types, different economics

The user's premise — that driveschoolpro's best page is a comparison page — held, but the data
distinguished two formats that behave very differently:

| Type | Example | Position | Volume |
|---|---|---|---|
| Roundup ("best X software") | `/blog/best-driving-school-software/` | 20.7 | 2,692 impr, 16 clicks |
| Head-to-head ("A vs B") | `/compare/total-drive/` | **7.8** | 71 impr, 0 clicks |

Head-to-heads rank easily and attract almost no search volume. Roundups carry the demand but
rank on page 2–3. The strategy uses both: roundups for traffic, head-to-heads for conversion
on switching intent.

## Decisions taken

1. **petcare gets authority work, not content.** It already has 47 pages and all five
   CLAUDE.md quick-wins. Server logs showed ~0 genuine Googlebot crawls in 14 days against
   41–96 for its siblings. More content would not be crawled.
2. **Competitors named, verified against vendor pricing pages**, date-stamped "verified July
   2026". Aggregator figures used only where a vendor publishes nothing, and labelled as such.

## Scope delivered

### mydojo.software
- Rewrote `/blog/best-martial-arts-software/` (6,262 impr @ pos 67.3) from abstract categories
  into a named 6-platform roundup with verified pricing bands.
- New `/free-martial-arts-software/` (~690 impr of unserved demand; matches the product truth
  that MyDojo is free during early access).
- Retargeted `/blog/gym-management-software-comparison/` to the dojo-specific category decision.

### mytattoo.software
- New `/booksy-alternative/` built on the Boost 30%-of-first-booking commission.
- New `/best-tattoo-studio-software/` roundup.
- Upgraded `/tattoo-software-comparison/`: added Vagaro + Fresha, a subscription-vs-commission
  table, and retitled for the "reviews"/"scheduling comparison" variants it was missing.

### driveschoolpro.com
- Added "Cheapest ... Ranked by Price" and "Best Booking Software for Solo Driving Instructors"
  sections to `/blog/best-driving-school-software/`.
- **Corrected false comparative claims** on `/compare/total-drive/` — see below.
- The `/free-driving-school-software/` cannibalisation was already resolved: the blog URL
  301s to the page version. No action needed.

### petcare.software
- 16 legacy WordPress URL 301s (off-topic legacy URLs deliberately left to 404).
- Deleted 13 tag pages; repointed "Browse by Topic" to the 4 pillar hubs.
- Fixed 12 dead `/early-access/` CTAs across all 4 pillar pages.
- Gave 3 orphaned posts real contextual inbound links.

### All sites
- Honest `<lastmod>`, replacing driveschoolpro's build-time stamp and the absence of any
  lastmod on the other three.

## Notable correction

`/compare/total-drive/` ranked at position 7.8 while asserting that Total Drive has no
transparent public pricing and no free trial without a demo. Total Drive's own homepage states
"From only £18 per month" and "30 Day Free Trial — No payment details needed". The competitor
is £4/month cheaper with a trial twice as long. Both claims were corrected across the matrix,
FeaturedAnswer, three FAQ answers and the pricing card, and the two now-invalid advantage
blocks were replaced with claims that are true. The roundup carried the same error.

Beyond accuracy, unverifiable comparative claims about a named competitor carry CAP Code risk.

## Success measure

Both mydojo and mytattoo have had **zero comparison-intent clicks across 90 days**. Ranking
produces impressions well before clicks, so the honest measure for the next month is
**position movement**, not traffic. Clicks are a 2–3 month measure.

petcare's measure is different again: whether genuine Googlebot crawls rise above ~0. If they
do not, no amount of content or structure will change its outcome and the constraint is
external links.
