# PetCare.Software → MyPetCare.Software Migration & Pillar Page Rewrite

## Context

I'm migrating petcare.software to a new domain (mypetcare.software) because Google has actively rejected my pillar pages. This isn't a "not yet discovered" problem — Google crawled these pages between Oct 2025 and Jan 2026 and decided they weren't worth indexing.

### Current SEO Status (from March 3, 2026 report)

| Metric | Value |
|--------|-------|
| Clicks (28 days) | 0 |
| Impressions | 120 |
| Pages Indexed | 2 of 55 (4%) |
| Avg Position | 103.7 |
| Sitemap Last Fetched | Feb 12 (stale) |

### Pillar Page Status

| Page | Google Status | Last Crawl |
|------|---------------|------------|
| /dog-boarding-software/ | Crawled — **rejected** | Oct 2025 |
| /dog-daycare-software/ | Crawled — **rejected** | Jan 2026 |
| /kennel-software/ | Crawled — **rejected** | Jan 2026 |
| /cattery-software/ | Crawled — **rejected** | Nov 2025 |
| /contact/ | Excluded by noindex | Nov 2025 |

---

## Your Tasks

### Task 1: Audit Current Pillar Pages

For each pillar page in the petcare.software repo, analyze:

1. **Word count** — competitors have 1,500-2,000+ words; we likely have 300-600
2. **Content depth** — are features just bullet lists or explained with benefits?
3. **Screenshots** — do we have actual product images or stock photos?
4. **Social proof** — real testimonials with names, or generic quotes?
5. **FAQ section** — present with schema markup, or missing?
6. **Internal links** — does the page link to supporting blog posts?

Create a gap analysis table comparing each pillar page against the competitor benchmark below.

### Task 2: Check GSC for Additional Insights

Use Google Search Console to:

1. Run URL Inspection on each pillar page — confirm "Crawled - currently not indexed" status
2. Check if any pillar pages have a "Page quality" issue flagged
3. Look at the "Why pages aren't indexed" report for patterns
4. Verify the sitemap includes all pillar page URLs
5. Check for any manual actions or security issues

### Task 3: Check Google Analytics

Look at:

1. Any organic traffic to pillar pages (likely zero, but confirm)
2. Bounce rate and time-on-page for pillar pages from any traffic source
3. Which blog posts ARE getting traffic (these are working — learn from them)

### Task 4: Rewrite Pillar Pages

Using the structure template below, rewrite each pillar page. I have product screenshots and case study material available — ask me for these when you need them for specific sections.

---

## Competitor Benchmark (What Ranking Pages Have)

Based on analysis of Revelation Pets, Gingr, PetExec, and other ranking competitors:

### Content Elements That Work

| Element | Why It Matters |
|---------|----------------|
| 1,500+ words | Google sees thin content as low-value |
| Problem-first narrative | Opens with pain points, not features |
| Named testimonials | "Sarah, Paws & Play Daycare" not "A satisfied customer" |
| Product screenshots | Proves the software exists and works |
| Feature deep-dives | 2-3 sentences per feature, not bullet points |
| FAQ with schema | Captures featured snippets, shows expertise |
| Case study | Detailed story of one customer's transformation |
| Integration mentions | Specific names: QuickBooks, Xero, Stripe |
| Trust badges | Capterra ratings, customer logos |

### Competitor Page Structure (Gingr Example)

```
H1: User-Friendly Dog Boarding and Kennel Software

Hero: Problem statement + screenshot + CTA

Section: Pain point narrative (why kennels struggle)
Section: Solution overview with dashboard screenshot
Section: Feature 1 deep-dive (Capacity Management) + screenshot
Section: Feature 2 deep-dive (Pet Report Cards) + screenshot
Section: Feature 3 deep-dive (Online Booking) + screenshot
Section: Feature 4 deep-dive (Automated Pricing) + screenshot
Section: Customer success story with photo
Section: Customer testimonials (3, with names + businesses)
Section: Additional features grid
Section: FAQ (5-7 questions with detailed answers)
Section: Final CTA
```

---

## Pillar Page Rewrite Template

Use this structure for each pillar page. Adapt the specific content for the page type (daycare vs boarding vs kennel vs cattery).

```markdown
---
title: "[Type] Software for [Audience] | MyPetCare"
description: "[160 chars - include primary keyword and benefit]"
---

# [Primary Keyword] That Actually Works

[Hero paragraph: 2-3 sentences addressing the core pain point. End with what we solve.]

[CTA Button: Start Free Trial]

![Screenshot of MyPetCare [feature] dashboard](/images/screenshots/[page]-hero.png)

## Why [Running a Kennel/Daycare/etc] Is Harder Than It Should Be

[300 words on pain points. Be specific:]
- Phone tag for every booking
- Spreadsheets that break
- Vaccination records in filing cabinets
- Double-bookings during holidays
- No way to take deposits
- Staff confusion about which dogs are where

[This section builds empathy and shows we understand the problem]

## How MyPetCare Makes It Simple

[Transition paragraph: "MyPetCare brings everything into one place..."]

### Online Booking That Works While You Sleep

[3-4 sentences explaining the feature AND the benefit]
[Screenshot of booking interface]

### Vaccination Tracking That Keeps You Compliant

[3-4 sentences]
[Screenshot]

### [Feature 3 relevant to this page type]

[3-4 sentences]
[Screenshot]

### [Feature 4 relevant to this page type]

[3-4 sentences]
[Screenshot]

## What [Kennel Owners/Daycare Managers/etc] Say

[3 testimonials with this format:]

> "[Quote about specific benefit they experienced]"
> 
> **[Name]**, [Role], [Business Name]

## [Case Study: How [Business Name] [Achieved Result]]

[200-300 words telling the story:]
- Who they are
- What problem they faced
- How MyPetCare helped
- Specific results (numbers if possible)

## Frequently Asked Questions

### How much does [type] software cost?

[Honest answer with link to pricing page]

### Can I migrate from [competitor/spreadsheets]?

[Yes, explain how]

### Does it work on mobile?

[Yes, explain]

### [Question specific to this page type]

[Answer]

### [Question specific to this page type]

[Answer]

## Ready to Simplify Your [Business Type]?

[Final CTA paragraph]

[Two buttons: Start Free Trial | See Pricing]
```

---

## Page-Specific Guidance

### /dog-daycare-software/
- Primary keyword: "dog daycare software"
- Secondary: "doggy daycare management", "pet daycare booking system"
- Unique angles: playgroups, half-day vs full-day, incident tracking, report cards
- Pain points: managing playgroups, tracking attendance, parent communication

### /dog-boarding-software/
- Primary keyword: "dog boarding software"
- Secondary: "kennel booking software", "pet boarding management"
- Unique angles: overnight stays, room/kennel assignments, feeding schedules, multi-night discounts
- Pain points: holiday overbooking, deposit collection, vaccination expiry

### /kennel-software/
- Primary keyword: "kennel software"
- Secondary: "kennel management system", "boarding kennel software"
- Unique angles: facility management, capacity planning, staff scheduling
- Pain points: occupancy visibility, compliance, facility inspections

### /cattery-software/
- Primary keyword: "cattery software"
- Secondary: "cat boarding software", "cattery booking system"
- Unique angles: individual enclosures, sibling bookings, species-specific care notes
- Pain points: cat-specific needs often ignored by "dog daycare" software

---

## Migration Checklist

Once pillar pages are rewritten:

- [ ] Clone petcare.software repo to mypetcare.software
- [ ] Update astro.config.mjs with new domain
- [ ] Replace all pillar page content with new versions
- [ ] Add product screenshots to /public/images/screenshots/
- [ ] Update Navigation.astro and Footer.astro with any new links
- [ ] Update internal links in blog posts to point to new pillar pages
- [ ] Deploy to Lightsail at /var/www/mypetcare.software/
- [ ] Set up Nginx config for new domain
- [ ] Add to Google Search Console as new property
- [ ] Submit sitemap immediately
- [ ] Request indexing for all 4 pillar pages + homepage
- [ ] Do NOT set up redirects from old domain (clean break)

---

## Available Assets

I have these ready to provide when you need them:
- Product screenshots (multiple views of the software)
- Case study material (customer success stories)

Ask me for specific screenshots or case study details when you're working on each section.

---

## Success Criteria

The rewritten pillar pages should:

1. Pass the "would a human expert write this?" test
2. Be 1,500+ words each
3. Include 3-5 screenshots per page
4. Have FAQ schema markup
5. Link to 3+ relevant blog posts each
6. Include at least 2 named testimonials per page
7. Have clear CTAs above and below the fold

---

## Questions to Answer First

Before starting the rewrite, please:

1. Show me the current word count and structure of each pillar page
2. List which blog posts exist that could support each pillar page
3. Check GSC for any specific quality signals on these pages
4. Confirm the sitemap includes all pillar URLs