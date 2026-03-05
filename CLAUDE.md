# CLAUDE.md - Multi-Site Static Hosting Project

## Sites

| Folder | Domain | Deploy Path | Status |
|--------|--------|-------------|--------|
| mydojo.software | mydojo.software | /var/www/mydojo.software/ | Active |
| mydriveschool.software | mydriveschool.software | /var/www/mydriveschool.software/ | Active |
| mytattoo.software | mytattoo.software | /var/www/mytattoo.software/ | Active |
| petcare.software | petcare.software | /var/www/petcare.software/ | Active — Astro rebuild |

## Server Access
```bash
ssh lightsail   # Ubuntu 24.04, IP: 13.43.71.165
```

## Deployment

Auto-deploys via GitHub Actions on push to main. GitHub Secrets required per repo:
- `SSH_PRIVATE_KEY`, `REMOTE_HOST` (13.43.71.165), `SITE_DOMAIN`

### Manual deploy
```bash
cd {site-folder} && npm run build
rsync -avz --delete dist/ ubuntu@13.43.71.165:/var/www/{domain}/
```

### Build fix (if build fails)
```bash
rm -rf node_modules dist .astro && npm install && npm run build
```

## Architecture

All sites: **Astro 5.x**, **Tailwind CSS**, **TypeScript**. Static output to `dist/`.

## Design System

Colors (all sites):
- Primary Navy: `#1A1A2E` · Accent Red: `#E94560` · Light Red: `#FFE7EC`

CSS classes: `.btn-primary` · `.btn-secondary` · `.card` · `.container-custom` · `.section`

## Reference Site

**mydojo.software** is the reference implementation. When building other sites:
1. Copy structure from mydojo.software
2. Update `astro.config.mjs` with correct `site:` URL
3. Update Navigation.astro, Footer.astro, and src/pages/ with site-specific content

## Nginx (on server)
```bash
/etc/nginx/sites-available/{domain}   # edit config here
sudo nginx -t && sudo systemctl reload nginx
```

---

## petcare.software — SEO Architecture (REQUIRED READING)

petcare.software previously had 48/55 pages unknown to Google due to sitemap failure and broken
internal linking. This section defines the rules that prevent that recurring.

### Technical Non-Negotiables

Before ANY page is deployed on petcare.software:

1. **Sitemap** — `@astrojs/sitemap` must be installed and `site: 'https://petcare.software'`
   must be set in `astro.config.mjs`. Every page must appear in `/sitemap-index.xml`.

2. **Verify script** — `scripts/verify-seo.js` must pass with zero errors before deployment.
   It checks: every page in sitemap, self-canonical present, no accidental noindex,
   H1 present, meta description present, ≥2 inbound internal links per page.
   Run: `npm run build` (postbuild runs verify-seo.js automatically).

3. **No page goes live with fewer than 2 internal inbound links** from already-published pages.
   This is enforced by verify-seo.js. It is not optional.

4. **Tag pages must not be generated** — `/blog/tag/*` pages are noindexed or disabled entirely.

### Hub-and-Spoke Cluster Architecture

petcare.software uses a strict hub-and-spoke model. Every blog post belongs to exactly one cluster.
Pillar pages are hubs. Blog posts are spokes. Both must link to each other.

**Cluster 1 — Hub: `/dog-daycare-software`**
Spokes: dog-daycare-software-complete-guide, is-dog-daycare-software-worth-it,
dog-daycare-software-comparison, how-to-start-dog-daycare-business,
dog-daycare-franchise-guide, marketing-dog-daycare-boarding, dog-playgroup-management,
dog-daycare-software-free (to create), best-dog-daycare-software (to create)

**Cluster 2 — Hub: `/dog-boarding-software`**
Spokes: dog-boarding-software-complete-guide, dog-boarding-business-plan,
is-dog-boarding-software-worth-it, dog-boarding-pricing-strategies,
legal-insurance-pet-boarding, staff-training-pet-boarding, pet-boarding-business-plan-guide,
dog-boarding-software-reviews (to create), free-dog-boarding-software (to create)

**Cluster 3 — Hub: `/kennel-software`**
Spokes: kennel-software-complete-guide, how-to-start-kennel-business,
grow-dog-kennel-business, kennel-design-guide, vaccination-tracking-for-kennels,
is-kennel-software-worth-it, boarding-kennel-software (to create)

**Cluster 4 — Hub: `/cattery-software`**
Spokes: cattery-software-complete-guide, is-cattery-software-worth-it,
how-to-start-cattery-business

### Internal Linking Rules (Enforced)

Every page you create on petcare.software must follow these rules — no exceptions:

- **Pillar pages** must link to ≥3 spokes in a Related Articles section
- **Pillar pages** must link to ≥1 other pillar page in body copy
- **Every spoke/blog post** must link to its parent pillar page within the first 200 words
- **Every spoke/blog post** must link to ≥2 other posts in the same cluster
- **Homepage** must link to all 4 pillar pages above the fold
- **About page** must link to all 4 pillar pages

### Content Requirements Per Page Type

**Pillar pages** (dog-daycare-software, dog-boarding-software, kennel-software, cattery-software):
- Minimum 1,800 words (competitors average 2,000–2,500)
- 4+ screenshots (use ScreenshotPlaceholder.astro with descriptive captions until real images available)
- 3 named testimonials (name, business, location) — use clearly marked [PLACEHOLDER] until real ones available
- 1 case study block (business, problem, solution, specific metrics) — [PLACEHOLDER] OK
- 5–7 question FAQ section with FAQ JSON-LD schema in `<head>`
- 6–8 H2 sections following the pillar page structure template
- CTA above fold AND below fold
- All semantic keywords for the keyword naturally integrated

**Cluster blog posts**:
- Minimum 1,200 words
- Contextual link to parent pillar in first 200 words
- Related Articles section at bottom (parent pillar + 2 cluster posts)
- FAQ schema if post contains 3+ question-style headings

**Quick-win blog posts** (KD <30 targets — create these):
- `/blog/dog-daycare-software-free` — 1,400+ words, KD 17
- `/blog/dog-boarding-software-reviews` — 1,600+ words, KD 16
- `/blog/best-dog-daycare-software` — 1,600+ words, KD 25
- `/blog/free-dog-boarding-software` — 1,200+ words, KD 20
- `/blog/boarding-kennel-software` — 1,400+ words, KD 29

### Staged Launch Protocol

Do not publish all content at once. Follow this sequence:

- **Sprint 1** (publish first): /about, /, /dog-daycare-software, /dog-boarding-software,
  /kennel-software, /pricing. Submit sitemap + request indexing. Confirm all 6 indexed before Sprint 2.
- **Sprint 2**: 6 complete-guide and how-to migrate posts. Link from pillars first.
- **Sprint 3**: 9 quick-win pages. Monitor GSC impressions weekly.
- **Sprint 4**: Remaining expand/rewrite posts in batches of 5.

### Do Not Create These Pages

The following pages must NOT exist on petcare.software:
- `/blog/tag/*` — tag archive pages (noindex or disable)
- Grooming content (poodle grooming, goldendoodle grooming, dog grooming tips, etc.)
- `/roadmap` — low value

---

## Content Quality Standard (All Sites — REQUIRED)

When creating blog posts or pillar pages, **always prioritise depth and quality over speed**.

Every piece of content must:
- **Target a specific keyword** with clear search intent
- **Be comprehensive** — meet the word count minimums above; outcover the top 3 competitors
- **Include real structure** — H2/H3 hierarchy, comparison tables, numbered steps, FAQs
- **Link strategically** — internal links to pillar pages + related posts following cluster rules
- **Have a clear CTA** — drive readers toward a pillar page or trial signup
- **Use the [Benefit] + [Data] + [CTA] formula** for meta descriptions

Do not create placeholder content, short posts, or stubs.

---

## SEO Changelog (REQUIRED)

After **any** SEO-related change — blog posts, pillar pages, meta tags, internal links,
schema, technical fixes — log it:
```bash
cd /Users/john/Projects-code/Front-end-sites/tools/gsc-client
node src/enhanced-report.js \
  --log-change="What you changed" \
  --sites=petcare.software \
  --category=content \
  --reason="Why you made the change" \
  --expected-impact="What metric should improve" \
  --expected-timeline="2-4 weeks"
```

**Categories:** `content` | `technical` | `meta` | `links` | `schema` | `analytics` | `conversion` | `performance`

**Sites:** comma-separated domains or omit for `all`

Do not skip this step — it feeds the Recent Changes section in `/seo-check`.

