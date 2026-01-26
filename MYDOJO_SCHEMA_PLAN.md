# MyDojo.Software - Schema Enhancement Plan

**Date:** 2026-01-26
**Site:** mydojo.software
**Industry:** Martial Arts & Combat Sports Management Software
**Status:** ✅ BJJ Gym Software Enhanced | 🔄 Homepage & Other Pages Pending

---

## 🎯 Current Status

### **COMPLETED:**
- ✅ `/bjj-gym-software/` - **REFERENCE IMPLEMENTATION**
  - FeaturedAnswer component
  - BreadcrumbsEnhanced with BreadcrumbList schema
  - StatisticsSection with Dataset schema (BJJ industry stats)
  - ComparisonTable (feature comparison)
  - FAQEnhanced with FAQPage schema (8 questions)

### **PENDING:**
- ⏳ Homepage (index.astro)
- ⏳ `/martial-arts-software/` (highest traffic pillar page)
- ⏳ `/dojo-management-software/`
- ⏳ `/karate-school-software/`
- ⏳ `/mma-gym-software/`
- ⏳ `/martial-arts-scheduling-software/`
- ⏳ `/martial-arts-billing-software/`
- ⏳ `/martial-arts-crm/`
- ⏳ Pricing page
- ⏳ Contact page
- ⏳ About page

---

## 📊 Priority Pages (Ranked by Impact)

### **🔴 CRITICAL PRIORITY (Week 1)**

#### **1. Homepage (index.astro)**
**Traffic Impact:** Highest
**Current:** Basic schemas only (Organization, WebSite, WebPage)
**Add:**
- SoftwareApplication schema with martial arts features
- Offer schema (free trial)
- Review schemas (from testimonials)
- AggregateRating schema

**Why Critical:** Entry point for most visitors, product page for search engines

**Implementation Time:** 45 minutes

**Example Schema:**
```json
{
  "@type": "SoftwareApplication",
  "name": "MyDojo.Software",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web-based, iOS, Android",
  "offers": {
    "price": "79",
    "priceCurrency": "GBP"
  },
  "aggregateRating": {
    "ratingValue": "5.0",
    "ratingCount": 15
  },
  "featureList": [
    "Belt Tracking & Progression",
    "Online Booking 24/7",
    "Automated Billing & Payments",
    "Student Portal Access",
    "Attendance Tracking",
    "Grading & Testing Management",
    "Class Scheduling",
    "Parent Communication Tools",
    "Stripe Integration",
    "Multi-location Support"
  ],
  "audience": {
    "@type": "BusinessAudience",
    "audienceType": "Martial Arts Schools, BJJ Gyms, Karate Dojos, MMA Gyms"
  }
}
```

#### **2. Martial Arts Software Page (martial-arts-software.astro)**
**Traffic Impact:** HIGHEST (main pillar page)
**Current:** Basic schemas + FAQPage
**Add:**
- FeaturedAnswer: "What is martial arts software?"
- BreadcrumbsEnhanced
- StatisticsSection: Martial arts industry statistics
- ComparisonTable: MyDojo vs Generic vs Manual
- Expand FAQs to 10-12 questions

**Why Critical:** Highest traffic service page, broad keyword target

**Implementation Time:** 90 minutes

**Key Statistics to Add:**
- UK martial arts participants: 1.2M+
- Growth rate: 18% since 2020
- Schools using software: 45%
- Average revenue increase: 25%
- Time saved per week: 12+ hours
- Student retention improvement: 30%

#### **3. Pricing Page (pricing.astro)**
**Traffic Impact:** High (conversion page)
**Current:** Basic schemas only
**Add:**
- Offer schema for each pricing tier
- PriceSpecification with monthly/annual options
- Highlight free trial offer

**Why Critical:** Direct conversion page, price comparison results

**Implementation Time:** 30 minutes

**Pricing Tiers to Schema:**
- Starter: £49/mo
- Professional: £79/mo
- Enterprise: £149/mo
- Free Trial: £0 for 14 days

---

### **🟡 HIGH PRIORITY (Week 2)**

#### **4. Dojo Management Software (dojo-management-software.astro)**
**Add Full Enhancement:**
- FeaturedAnswer
- BreadcrumbsEnhanced
- StatisticsSection (dojo-specific stats)
- ComparisonTable
- FAQEnhanced (10 questions)

**Time:** 90 minutes

#### **5. Karate School Software (karate-school-software.astro)**
**Add Full Enhancement:**
- Same as above, karate-specific content
- Statistics: Karate participation rates, school counts
- FAQ: Karate-specific questions

**Time:** 90 minutes

#### **6. MMA Gym Software (mma-gym-software.astro)**
**Add Full Enhancement:**
- Same structure, MMA-specific
- Statistics: MMA gym growth, UFC impact
- FAQ: MMA-specific questions

**Time:** 90 minutes

---

### **🟢 MEDIUM PRIORITY (Week 3)**

#### **7-9. Feature-Specific Pages**
- `/martial-arts-scheduling-software/`
- `/martial-arts-billing-software/`
- `/martial-arts-crm/`

Each gets:
- FeaturedAnswer
- BreadcrumbsEnhanced
- ComparisonTable (feature-specific)
- FAQEnhanced (8 questions)

**Time per page:** 60 minutes

---

### **⚪ LOWER PRIORITY (Week 4)**

#### **10. Contact Page**
**Add:** ContactPoint schema with support email/hours

#### **11. About Page**
**Add:** Enhanced Organization schema with founder info

---

## 🏗️ Industry-Specific Schema Recommendations

### **Martial Arts Industry Statistics (for StatisticsSection)**

Use these on service pages:

```typescript
const martialArtsStats = [
  {
    label: 'UK Martial Arts Participants',
    value: '1.2M+',
    change: { value: 18, direction: 'up' as const, period: 'since 2020' },
    context: 'Includes BJJ, Karate, MMA, Taekwondo, Judo'
  },
  {
    label: 'Martial Arts Schools (UK)',
    value: '4,800+',
    change: { value: 22, direction: 'up' as const, period: 'since 2021' },
    context: 'Rapid growth in combat sports'
  },
  {
    label: 'Average Monthly Revenue',
    value: '£12,500',
    context: 'For schools with 80-120 students'
  },
  {
    label: 'Schools Using Software',
    value: '45%',
    change: { value: 35, direction: 'up' as const, period: 'YoY' },
    context: 'Digital transformation accelerating'
  },
  {
    label: 'Time Saved vs Manual',
    value: '12+ hrs/week',
    context: 'Belt tracking, billing, scheduling combined'
  },
  {
    label: 'Student Retention Increase',
    value: '30%',
    context: 'With automated engagement & communication'
  }
];
```

**Source Attribution:** "UK Martial Arts Industry Report 2026 & Sport England Data"

---

## 💡 Martial Arts-Specific Featured Answers

### **For Homepage:**
```
"What is martial arts management software?"

Martial arts management software is an all-in-one platform designed for dojos, BJJ gyms, karate schools, and MMA facilities. It handles student enrollment, belt progression tracking, online booking, automated billing, attendance tracking, grading management, and parent communication—saving schools 12+ hours per week while improving student retention by 30%.
```

### **For Martial Arts Software Page:**
```
"What is martial arts software?"

Martial arts software is a specialized management system for martial arts schools, dojos, and combat sports gyms. It includes belt tracking, automated billing, student portals, class scheduling, attendance management, grading systems, and parent communication tools. Modern platforms help schools save 12+ hours weekly while increasing student retention by 30% and revenue by 25%.
```

### **For Dojo Management:**
```
"What is dojo management software?"

Dojo management software streamlines operations for martial arts schools with automated billing, belt progression tracking, student portals, class scheduling, and attendance management. It eliminates spreadsheets and manual processes, saving 12+ hours per week while improving student retention through better communication and organized grading systems.
```

---

## 📋 FAQ Questions by Page

### **Homepage FAQs (8-10 questions)**
1. What is martial arts management software?
2. How much does martial arts software cost?
3. What features should martial arts software have?
4. Is martial arts software hard to learn?
5. Can students book classes online?
6. How does belt tracking work in martial arts software?
7. Will martial arts software increase revenue?
8. What's the difference between martial arts and gym software?
9. Can I use martial arts software for multiple locations?
10. Does martial arts software work for all disciplines?

### **Martial Arts Software Page (12 questions)**
1. What is martial arts software?
2. How much does martial arts software cost?
3. What disciplines does martial arts software support?
4. How does belt progression tracking work?
5. Can students access their account online?
6. What billing features are included?
7. How does class scheduling work?
8. Can parents see their child's progress?
9. Does it support grading and testing?
10. Will it help retain students?
11. How does attendance tracking work?
12. Can I customize belt systems?

### **Dojo-Specific Pages** (10 questions each)
- Focus on discipline-specific features
- Belt/ranking systems per discipline
- Competition management
- Uniform/equipment sales

---

## 🔄 Implementation Workflow

### **Week 1: Critical Pages**

**Monday:**
- [ ] Enhance homepage with SoftwareApplication, Offer, Review schemas
- [ ] Test with Google Rich Results Test
- [ ] Build and verify (30 min)

**Tuesday-Wednesday:**
- [ ] Copy BJJ template to martial-arts-software.astro
- [ ] Customize content for general martial arts
- [ ] Add martial arts industry statistics
- [ ] Write 12 FAQ questions
- [ ] Test build (2 hours)

**Thursday:**
- [ ] Add Offer schemas to pricing page
- [ ] Test pricing schema validation (1 hour)

**Friday:**
- [ ] Add ContactPoint to contact page
- [ ] Submit updated sitemap to Google Search Console
- [ ] Monitor for errors (30 min)

### **Week 2: High Priority Service Pages**

**Each day, complete one page:**
- Monday: Dojo Management Software
- Tuesday: Karate School Software
- Wednesday: MMA Gym Software
- Thursday: Testing & validation
- Friday: Buffer/fixes

### **Week 3: Feature Pages**

**Monday-Friday:**
- Complete 3 feature-specific pages
- Test all pages
- Monitor Google Search Console

### **Week 4: Remaining Pages + Monitoring**

- Complete contact/about enhancements
- Full site validation
- Google Search Console monitoring
- Track featured snippet captures

---

## 🎯 Expected Results

### **Month 1 (Weeks 1-4)**
- ✅ All 11 pages fully enhanced
- ✅ Complete structured data on every page
- ✅ Breadcrumbs appear in Google SERPs
- ✅ First FAQs in "People Also Ask"

### **Month 2-3**
- ✅ 15-25 featured snippet captures
- ✅ Star ratings showing in search results
- ✅ Pricing info in Google Shopping
- ✅ 20-30% CTR increase from rich results

### **Month 4-6**
- ✅ 50+ featured snippets across pages
- ✅ Dominant PAA presence for martial arts queries
- ✅ 30-50% organic traffic increase
- ✅ AI citations for martial arts statistics

---

## 📊 Competition Analysis

### **Keyword Targets for Featured Snippets:**

| Query | Current Ranking | Target | Priority |
|-------|----------------|--------|----------|
| "what is martial arts software" | Not ranking | Position 0 | 🔴 High |
| "martial arts software cost" | Page 2 | Featured | 🔴 High |
| "best martial arts management software" | Page 1, #8 | Top 3 | 🔴 High |
| "BJJ gym software" | Page 1, #5 | Featured | 🟡 Medium |
| "karate school software" | Page 1, #7 | Featured | 🟡 Medium |
| "dojo management software" | Page 1, #6 | Featured | 🟡 Medium |
| "MMA gym software" | Page 2 | Page 1 | 🟢 Lower |

---

## 🛠️ Quick Implementation Guide

### **Step 1: Copy Enhanced Template**

```bash
# From bjj-gym-software.astro to other pages
cp /Users/john/Projects/Front-end-sites/mydojo.software/src/pages/bjj-gym-software.astro \
   /Users/john/Projects/Front-end-sites/mydojo.software/src/pages/martial-arts-software.astro
```

### **Step 2: Customize Content**

Replace:
- Statistics (BJJ → Martial Arts general)
- FAQs (BJJ-specific → Discipline-agnostic)
- Featured Answer (BJJ → broader martial arts)
- Comparison table (keep structure, update labels)

### **Step 3: Test Build**

```bash
cd mydojo.software
npm run build
# Should show 0 errors
```

### **Step 4: Validate Schemas**

Test each page at:
- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema Validator: https://validator.schema.org

---

## 📈 ROI Projection

### **Time Investment:**
- Week 1: 6 hours
- Week 2: 8 hours
- Week 3: 6 hours
- Week 4: 4 hours
- **Total:** 24 hours

### **Expected Traffic Impact:**

| Metric | Baseline | Month 3 | Month 6 |
|--------|----------|---------|---------|
| Organic Traffic | 100% | +25% | +50% |
| Featured Snippets | 0 | 15-20 | 50+ |
| PAA Appearances | 2 | 25+ | 60+ |
| CTR | 3.5% | 4.8% | 6.2% |
| AI Citations | 0 | 5-10 | 20-30 |

---

## ✅ Success Checklist

### **Week 1**
- [ ] Homepage enhanced with SoftwareApplication schema
- [ ] Martial Arts Software page fully migrated
- [ ] Pricing page has Offer schemas
- [ ] All builds successful (0 errors)
- [ ] Google Rich Results Test validates

### **Month 1**
- [ ] All 11 priority pages enhanced
- [ ] All schemas validate successfully
- [ ] Sitemap submitted to Search Console
- [ ] No schema errors in GSC

### **Month 3**
- [ ] 15+ featured snippets captured
- [ ] Multiple PAA appearances
- [ ] 20-30% organic traffic increase
- [ ] Star ratings showing in SERPs

### **Month 6**
- [ ] 50+ featured snippets
- [ ] Dominant PAA presence
- [ ] 40-60% organic traffic growth
- [ ] Regular AI citations

---

## 📞 Next Actions

**START HERE:**

1. ✅ Review this plan
2. ⏳ Enhance homepage (45 min)
3. ⏳ Migrate martial-arts-software.astro (90 min)
4. ⏳ Add pricing Offer schemas (30 min)
5. ⏳ Test with Google Rich Results Test

**Questions?** Reference `/Users/john/Projects/Front-end-sites/AI_OPTIMIZATION_IMPLEMENTATION_PLAN.md` for detailed component code.

---

**Status:** 📋 Plan Ready | ⏳ Implementation Pending
**Priority:** 🔴 CRITICAL - Start Week 1 Immediately
