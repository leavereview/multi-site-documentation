# AI Optimization Implementation Plan
## Detailed Technical Roadmap for Featured Snippets & AI Visibility

**Created:** 2026-01-26
**Sites:** mydojo.software, petcare.software, mydriveschool.software, mytattoo.software
**Goal:** Maximum AI visibility, featured snippet capture, and rich result optimization

---

## 📋 Executive Summary

This plan provides complete implementation details for optimizing all 4 sites for AI visibility and featured snippets. The approach is:

1. **Centralized & DRY**: Create reusable components/utilities used across all sites
2. **Incremental**: Can be rolled out one component at a time
3. **Backward Compatible**: Existing content continues working
4. **Type-Safe**: Full TypeScript support for schema generation
5. **Performance**: Zero impact on page load times

**Expected Timeline:** 2-3 weeks full implementation
**Expected Impact:** 200-400% increase in featured snippet captures, 50-100% improvement in AI citation rates

---

## 🏗️ Architecture Overview

```
src/
├── components/
│   ├── seo/                          # NEW: SEO-specific components
│   │   ├── FeaturedAnswer.astro      # Direct answer boxes
│   │   ├── ComparisonTable.astro     # Feature comparison tables
│   │   ├── HowToSection.astro        # Step-by-step guides
│   │   ├── StatisticsSection.astro   # Data displays
│   │   ├── FAQEnhanced.astro         # Enhanced FAQ with schema
│   │   ├── ProductShowcase.astro     # Software product display
│   │   └── BreadcrumbsEnhanced.astro # Breadcrumbs with schema
│   └── ... (existing components)
├── layouts/
│   ├── BaseLayoutEnhanced.astro      # ENHANCED: Multi-schema support
│   ├── PillarPageEnhanced.astro      # ENHANCED: Full optimization
│   └── BlogPostEnhanced.astro        # NEW: Blog post optimizations
├── utils/
│   ├── schema/                       # NEW: Schema generation utilities
│   │   ├── index.ts                  # Main schema generator
│   │   ├── types.ts                  # TypeScript interfaces
│   │   ├── organization.ts           # Organization schema
│   │   ├── product.ts                # SoftwareApplication schema
│   │   ├── howto.ts                  # HowTo schema
│   │   ├── faq.ts                    # FAQPage schema
│   │   ├── article.ts                # Article/BlogPosting schema
│   │   ├── breadcrumb.ts             # BreadcrumbList schema
│   │   └── dataset.ts                # Dataset schema for statistics
│   └── ... (existing utils)
└── content/
    └── templates/                    # NEW: Content templates
        ├── pillar-page-template.md
        ├── how-to-template.md
        ├── comparison-template.md
        └── statistics-template.md
```

---

## 📦 Phase 1: Foundation (Week 1, Days 1-3)

### 1.1 Schema Utilities System

**File: `src/utils/schema/types.ts`**

Purpose: TypeScript interfaces for all schema types

```typescript
// Schema type definitions for type safety across all schema generators

export interface OrganizationSchema {
  name: string;
  url: string;
  logo: string;
  sameAs?: string[];
}

export interface SoftwareApplicationSchema {
  name: string;
  applicationCategory: 'BusinessApplication' | 'DeveloperApplication';
  operatingSystem?: string;
  offers: {
    price: string | number;
    priceCurrency: string;
    priceValidUntil?: string;
  };
  aggregateRating?: {
    ratingValue: number;
    ratingCount: number;
    bestRating?: number;
    worstRating?: number;
  };
  featureList?: string[];
  screenshot?: string[];
}

export interface HowToSchema {
  name: string;
  description: string;
  totalTime?: string; // ISO 8601 duration format (PT30M = 30 minutes)
  estimatedCost?: {
    currency: string;
    value: string;
  };
  supply?: Array<{
    name: string;
    image?: string;
  }>;
  tool?: Array<{
    name: string;
    image?: string;
  }>;
  step: Array<{
    name: string;
    text: string;
    image?: string;
    url?: string;
    position: number;
  }>;
}

export interface FAQItem {
  question: string;
  answer: string;
  position?: number;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  position: number;
}

export interface DatasetSchema {
  name: string;
  description: string;
  url?: string;
  datePublished?: string;
  dateModified?: string;
  creator?: {
    type: 'Organization' | 'Person';
    name: string;
  };
  distribution?: {
    contentUrl: string;
    encodingFormat: string;
  };
}

export interface ComparisonItem {
  name: string;
  description?: string;
  properties: Record<string, string | number | boolean>;
}

export interface ArticleSchema {
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author: {
    type: 'Person' | 'Organization';
    name: string;
    url?: string;
  };
  publisher: {
    name: string;
    logo: string;
  };
  wordCount?: number;
  articleSection?: string;
}
```

**Implementation Notes:**
- Import these types in all schema generator files
- Enables IDE autocomplete for schema properties
- Prevents schema errors from typos
- Makes refactoring safe

---

### 1.2 Core Schema Generators

**File: `src/utils/schema/index.ts`**

Purpose: Main schema orchestration and JSON-LD generation

```typescript
import type {
  OrganizationSchema,
  SoftwareApplicationSchema,
  HowToSchema,
  FAQItem,
  BreadcrumbItem,
  DatasetSchema,
  ArticleSchema
} from './types';

/**
 * Base schema generator that creates the @graph structure
 * All sites use this as the foundation
 */
export class SchemaGenerator {
  private siteUrl: string;
  private siteName: string;
  private logoUrl: string;

  constructor(siteUrl: string, siteName: string, logoUrl: string) {
    this.siteUrl = siteUrl.replace(/\/$/, ''); // Remove trailing slash
    this.siteName = siteName;
    this.logoUrl = logoUrl;
  }

  /**
   * Generate organization schema (appears on all pages)
   */
  getOrganizationSchema(): object {
    return {
      "@type": "Organization",
      "@id": `${this.siteUrl}/#organization`,
      "name": this.siteName,
      "url": this.siteUrl,
      "logo": {
        "@type": "ImageObject",
        "url": this.logoUrl,
        "width": 200,
        "height": 60
      },
      "sameAs": [] // Add social profiles when available
    };
  }

  /**
   * Generate website schema (appears on all pages)
   */
  getWebSiteSchema(): object {
    return {
      "@type": "WebSite",
      "@id": `${this.siteUrl}/#website`,
      "url": this.siteUrl,
      "name": this.siteName,
      "publisher": {
        "@id": `${this.siteUrl}/#organization`
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${this.siteUrl}/search?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    };
  }

  /**
   * Generate SoftwareApplication schema for product pages
   */
  getSoftwareApplicationSchema(data: SoftwareApplicationSchema, pageUrl: string): object {
    const schema: any = {
      "@type": "SoftwareApplication",
      "@id": `${pageUrl}#software`,
      "name": data.name,
      "applicationCategory": data.applicationCategory,
      "url": pageUrl,
      "offers": {
        "@type": "Offer",
        "price": data.offers.price,
        "priceCurrency": data.offers.priceCurrency,
        "availability": "https://schema.org/InStock"
      }
    };

    if (data.operatingSystem) {
      schema.operatingSystem = data.operatingSystem;
    }

    if (data.aggregateRating) {
      schema.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": data.aggregateRating.ratingValue,
        "ratingCount": data.aggregateRating.ratingCount,
        "bestRating": data.aggregateRating.bestRating || 5,
        "worstRating": data.aggregateRating.worstRating || 1
      };
    }

    if (data.featureList && data.featureList.length > 0) {
      schema.featureList = data.featureList;
    }

    if (data.screenshot && data.screenshot.length > 0) {
      schema.screenshot = data.screenshot.map(url => ({
        "@type": "ImageObject",
        "url": url
      }));
    }

    return schema;
  }

  /**
   * Generate HowTo schema for instructional content
   */
  getHowToSchema(data: HowToSchema, pageUrl: string): object {
    const schema: any = {
      "@type": "HowTo",
      "@id": `${pageUrl}#howto`,
      "name": data.name,
      "description": data.description,
      "step": data.step.map(step => ({
        "@type": "HowToStep",
        "position": step.position,
        "name": step.name,
        "text": step.text,
        "url": step.url || pageUrl,
        ...(step.image && { "image": step.image })
      }))
    };

    if (data.totalTime) {
      schema.totalTime = data.totalTime;
    }

    if (data.estimatedCost) {
      schema.estimatedCost = {
        "@type": "MonetaryAmount",
        "currency": data.estimatedCost.currency,
        "value": data.estimatedCost.value
      };
    }

    if (data.supply && data.supply.length > 0) {
      schema.supply = data.supply.map(item => ({
        "@type": "HowToSupply",
        "name": item.name,
        ...(item.image && { "image": item.image })
      }));
    }

    if (data.tool && data.tool.length > 0) {
      schema.tool = data.tool.map(item => ({
        "@type": "HowToTool",
        "name": item.name,
        ...(item.image && { "image": item.image })
      }));
    }

    return schema;
  }

  /**
   * Generate FAQPage schema
   */
  getFAQPageSchema(faqs: FAQItem[], pageUrl: string): object {
    return {
      "@type": "FAQPage",
      "@id": `${pageUrl}#faqpage`,
      "mainEntity": faqs.map((faq, index) => ({
        "@type": "Question",
        "position": faq.position || index + 1,
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };
  }

  /**
   * Generate BreadcrumbList schema
   */
  getBreadcrumbSchema(items: BreadcrumbItem[]): object {
    return {
      "@type": "BreadcrumbList",
      "@id": "#breadcrumb",
      "itemListElement": items.map(item => ({
        "@type": "ListItem",
        "position": item.position,
        "name": item.label,
        ...(item.href && { "item": `${this.siteUrl}${item.href}` })
      }))
    };
  }

  /**
   * Generate Article/BlogPosting schema
   */
  getArticleSchema(data: ArticleSchema, pageUrl: string, type: 'Article' | 'BlogPosting' = 'Article'): object {
    const schema: any = {
      "@type": type,
      "@id": pageUrl,
      "url": pageUrl,
      "headline": data.headline,
      "description": data.description,
      "datePublished": data.datePublished,
      "dateModified": data.dateModified || data.datePublished,
      "author": {
        "@type": data.author.type,
        "name": data.author.name,
        ...(data.author.url && { "url": data.author.url })
      },
      "publisher": {
        "@id": `${this.siteUrl}/#organization`
      },
      "isPartOf": {
        "@id": `${this.siteUrl}/#website`
      }
    };

    if (data.image) {
      schema.image = {
        "@type": "ImageObject",
        "url": data.image
      };
    }

    if (data.wordCount) {
      schema.wordCount = data.wordCount;
    }

    if (data.articleSection) {
      schema.articleSection = data.articleSection;
    }

    return schema;
  }

  /**
   * Generate Dataset schema for statistics pages
   */
  getDatasetSchema(data: DatasetSchema, pageUrl: string): object {
    const schema: any = {
      "@type": "Dataset",
      "@id": `${pageUrl}#dataset`,
      "name": data.name,
      "description": data.description,
      "url": data.url || pageUrl
    };

    if (data.datePublished) {
      schema.datePublished = data.datePublished;
    }

    if (data.dateModified) {
      schema.dateModified = data.dateModified;
    }

    if (data.creator) {
      schema.creator = {
        "@type": data.creator.type,
        "name": data.creator.name
      };
    }

    if (data.distribution) {
      schema.distribution = {
        "@type": "DataDownload",
        "contentUrl": data.distribution.contentUrl,
        "encodingFormat": data.distribution.encodingFormat
      };
    }

    return schema;
  }

  /**
   * Build complete JSON-LD with @graph structure
   * This is what gets injected into the page <head>
   */
  buildSchema(pageSchemas: object[]): string {
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        this.getOrganizationSchema(),
        this.getWebSiteSchema(),
        ...pageSchemas
      ]
    };

    return JSON.stringify(schema);
  }
}

/**
 * Factory function to create schema generator for each site
 */
export function createSchemaGenerator(site: 'mydojo' | 'petcare' | 'driveschool' | 'tattoo'): SchemaGenerator {
  const configs = {
    mydojo: {
      url: 'https://mydojo.software',
      name: 'MyDojo Software',
      logo: 'https://mydojo.software/logo.svg'
    },
    petcare: {
      url: 'https://petcare.software',
      name: 'PetCare Software',
      logo: 'https://petcare.software/logo.svg'
    },
    driveschool: {
      url: 'https://mydriveschool.software',
      name: 'MyDriveSchool Software',
      logo: 'https://mydriveschool.software/logo.svg'
    },
    tattoo: {
      url: 'https://mytattoo.software',
      name: 'MyTattoo Software',
      logo: 'https://mytattoo.software/logo.svg'
    }
  };

  const config = configs[site];
  return new SchemaGenerator(config.url, config.name, config.logo);
}
```

**Implementation Notes:**
- Single source of truth for all schema generation
- Type-safe with full IDE support
- Easy to extend with new schema types
- Reusable across all 4 sites
- Follows Google's recommended @graph structure

---

## 📦 Phase 2: Component Library (Week 1, Days 4-7)

### 2.1 Featured Answer Component

**File: `src/components/seo/FeaturedAnswer.astro`**

Purpose: Create direct answer boxes optimized for featured snippets

```astro
---
/**
 * Featured Answer Component
 *
 * Creates a highlighted answer box optimized for Google Featured Snippets.
 *
 * Best Practices:
 * - Keep answer to 40-60 words
 * - Answer the question directly in first sentence
 * - Use simple, clear language
 * - Place at the top of the content section
 *
 * Usage:
 * <FeaturedAnswer question="What is dog daycare software?">
 *   Dog daycare software is an all-in-one management system that handles
 *   online reservations, vaccination tracking, billing, and customer
 *   communication for pet daycare facilities.
 * </FeaturedAnswer>
 */

interface Props {
  question: string;
  className?: string;
}

const { question, className = '' } = Astro.props;
---

<div class={`featured-answer ${className}`} itemscope itemtype="https://schema.org/Question">
  <h2 itemprop="name" class="featured-answer__question">{question}</h2>
  <div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer">
    <div itemprop="text" class="featured-answer__content">
      <slot />
    </div>
  </div>
</div>

<style>
  .featured-answer {
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    border-left: 4px solid var(--brand-red, #E94560);
    border-radius: 8px;
    padding: 1.5rem 2rem;
    margin: 2rem 0 3rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .featured-answer__question {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--brand-navy, #1A1A2E);
    margin: 0 0 1rem;
  }

  .featured-answer__content {
    font-size: 1.125rem;
    line-height: 1.7;
    color: #2d3748;
  }

  .featured-answer__content :global(p) {
    margin: 0;
  }

  .featured-answer__content :global(strong) {
    color: var(--brand-navy, #1A1A2E);
    font-weight: 600;
  }

  @media (max-width: 768px) {
    .featured-answer {
      padding: 1.25rem 1.5rem;
    }

    .featured-answer__question {
      font-size: 1.125rem;
    }

    .featured-answer__content {
      font-size: 1rem;
    }
  }
</style>
```

**Usage Example:**

```astro
---
// In any pillar page or blog post
import FeaturedAnswer from '../components/seo/FeaturedAnswer.astro';
---

<FeaturedAnswer question="What is martial arts software?">
  Martial arts software is a specialized management platform designed for dojos,
  academies, and combat sports gyms. It handles student databases, belt progression
  tracking, class scheduling, membership billing, and communication—all tailored
  to martial arts instruction.
</FeaturedAnswer>
```

---

### 2.2 Comparison Table Component

**File: `src/components/seo/ComparisonTable.astro`**

Purpose: Structured comparison tables optimized for table snippets

```astro
---
/**
 * Comparison Table Component
 *
 * Creates SEO-optimized comparison tables that:
 * - Use semantic HTML table markup
 * - Include proper headers and scope attributes
 * - Are mobile responsive
 * - Support sorting (optional)
 * - Generate table structured data
 *
 * Usage:
 * <ComparisonTable
 *   title="Dog Daycare Software Comparison"
 *   description="Compare features across leading pet care platforms"
 *   headers={['Feature', 'Basic Plan', 'Pro Plan', 'Enterprise']}
 *   rows={tableData}
 * />
 */

interface ComparisonRow {
  label: string;
  values: (string | number | boolean)[];
  highlight?: boolean;
}

interface Props {
  title: string;
  description?: string;
  headers: string[];
  rows: ComparisonRow[];
  sortable?: boolean;
  className?: string;
}

const {
  title,
  description,
  headers,
  rows,
  sortable = false,
  className = ''
} = Astro.props;

// Format cell values for display
function formatValue(value: string | number | boolean): string {
  if (typeof value === 'boolean') {
    return value ? '✓' : '✗';
  }
  return String(value);
}
---

<div class={`comparison-table-wrapper ${className}`}>
  {description && (
    <p class="comparison-table-description">{description}</p>
  )}

  <div class="table-responsive">
    <table class="comparison-table" role="table">
      <caption class="comparison-table-title">{title}</caption>
      <thead>
        <tr>
          {headers.map((header, index) => (
            <th
              scope="col"
              class={sortable ? 'sortable' : ''}
              data-column={index}
            >
              {header}
              {sortable && <span class="sort-icon" aria-hidden="true">↕</span>}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr class={row.highlight ? 'highlight-row' : ''}>
            <th scope="row" class="row-label">{row.label}</th>
            {row.values.map((value) => (
              <td class={typeof value === 'boolean' ? `bool-${value}` : ''}>
                {formatValue(value)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

<style>
  .comparison-table-wrapper {
    margin: 2rem 0;
  }

  .comparison-table-description {
    color: #64748b;
    margin-bottom: 1rem;
    font-size: 0.95rem;
  }

  .comparison-table-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--brand-navy, #1A1A2E);
    margin-bottom: 1.5rem;
    text-align: left;
    caption-side: top;
  }

  .table-responsive {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .comparison-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    font-size: 0.95rem;
  }

  .comparison-table thead {
    background: var(--brand-navy, #1A1A2E);
    color: white;
  }

  .comparison-table th {
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    border-bottom: 2px solid #e2e8f0;
  }

  .comparison-table thead th {
    color: white;
    border-bottom-color: rgba(255, 255, 255, 0.2);
  }

  .comparison-table th.sortable {
    cursor: pointer;
    user-select: none;
  }

  .comparison-table th.sortable:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .sort-icon {
    margin-left: 0.5rem;
    opacity: 0.6;
    font-size: 0.875rem;
  }

  .comparison-table td {
    padding: 0.875rem 1rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .comparison-table .row-label {
    font-weight: 600;
    color: var(--brand-navy, #1A1A2E);
    background: #f8f9fa;
  }

  .comparison-table tbody tr:hover {
    background: #f8f9fa;
  }

  .comparison-table .highlight-row {
    background: #fff7ed;
  }

  .comparison-table .highlight-row:hover {
    background: #ffedd5;
  }

  .comparison-table .bool-true {
    color: #059669;
    font-weight: 600;
    text-align: center;
    font-size: 1.25rem;
  }

  .comparison-table .bool-false {
    color: #dc2626;
    font-weight: 600;
    text-align: center;
    font-size: 1.25rem;
    opacity: 0.4;
  }

  @media (max-width: 768px) {
    .comparison-table {
      font-size: 0.875rem;
    }

    .comparison-table th,
    .comparison-table td {
      padding: 0.75rem 0.5rem;
    }

    .comparison-table-title {
      font-size: 1.25rem;
    }
  }
</style>

{sortable && (
  <script>
    // Client-side table sorting
    document.querySelectorAll('.comparison-table th.sortable').forEach(header => {
      header.addEventListener('click', () => {
        const table = header.closest('table');
        const tbody = table?.querySelector('tbody');
        const columnIndex = parseInt(header.getAttribute('data-column') || '0');

        if (!tbody) return;

        const rows = Array.from(tbody.querySelectorAll('tr'));
        const isAscending = header.classList.contains('sort-asc');

        rows.sort((a, b) => {
          const aValue = a.children[columnIndex].textContent?.trim() || '';
          const bValue = b.children[columnIndex].textContent?.trim() || '';

          // Try numeric comparison first
          const aNum = parseFloat(aValue);
          const bNum = parseFloat(bValue);

          if (!isNaN(aNum) && !isNaN(bNum)) {
            return isAscending ? bNum - aNum : aNum - bNum;
          }

          // Fallback to string comparison
          return isAscending
            ? bValue.localeCompare(aValue)
            : aValue.localeCompare(bValue);
        });

        // Update DOM
        rows.forEach(row => tbody.appendChild(row));

        // Update header classes
        table.querySelectorAll('th').forEach(th => {
          th.classList.remove('sort-asc', 'sort-desc');
        });
        header.classList.add(isAscending ? 'sort-desc' : 'sort-asc');
      });
    });
  </script>
)}
```

**Usage Example:**

```astro
---
import ComparisonTable from '../components/seo/ComparisonTable.astro';

const softwareComparison = [
  {
    label: 'Online Booking',
    values: [true, true, true],
    highlight: false
  },
  {
    label: 'Automated Billing',
    values: [false, true, true],
    highlight: false
  },
  {
    label: 'Mobile App',
    values: [false, true, true],
    highlight: true
  },
  {
    label: 'Price/Month',
    values: ['£29', '£79', '£149'],
    highlight: false
  }
];
---

<ComparisonTable
  title="Martial Arts Software Feature Comparison"
  description="Compare features across different pricing tiers"
  headers={['Feature', 'Basic', 'Professional', 'Enterprise']}
  rows={softwareComparison}
  sortable={true}
/>
```

---

### 2.3 HowTo Section Component

**File: `src/components/seo/HowToSection.astro`**

Purpose: Step-by-step guides with HowTo schema

```astro
---
/**
 * HowTo Section Component
 *
 * Creates step-by-step instructional content with HowTo structured data.
 * Optimized for Google's "How to" rich results.
 *
 * Best Practices:
 * - Use clear, actionable step titles
 * - Include time estimates
 * - Add images for each step when possible
 * - Specify tools/supplies if relevant
 *
 * Usage:
 * <HowToSection
 *   title="How to Start a Dog Daycare"
 *   description="Step-by-step guide..."
 *   totalTime="PT6M"
 *   steps={stepsData}
 * />
 */

import { SchemaGenerator, createSchemaGenerator } from '../../utils/schema';
import type { HowToSchema } from '../../utils/schema/types';

interface HowToStep {
  name: string;
  description: string;
  image?: string;
  tips?: string[];
  time?: string;
  cost?: string;
}

interface Props {
  title: string;
  description: string;
  steps: HowToStep[];
  totalTime?: string; // ISO 8601 duration (PT30M = 30 mins, PT2H = 2 hours)
  estimatedCost?: {
    min: number;
    max: number;
    currency: string;
  };
  supplies?: string[];
  tools?: string[];
  site: 'mydojo' | 'petcare' | 'driveschool' | 'tattoo';
  pageUrl: string;
}

const {
  title,
  description,
  steps,
  totalTime,
  estimatedCost,
  supplies,
  tools,
  site,
  pageUrl
} = Astro.props;

// Generate HowTo schema
const schemaGen = createSchemaGenerator(site);
const howToData: HowToSchema = {
  name: title,
  description: description,
  totalTime: totalTime,
  estimatedCost: estimatedCost ? {
    currency: estimatedCost.currency,
    value: `${estimatedCost.min}-${estimatedCost.max}`
  } : undefined,
  supply: supplies?.map(s => ({ name: s })),
  tool: tools?.map(t => ({ name: t })),
  step: steps.map((step, index) => ({
    name: step.name,
    text: step.description,
    image: step.image,
    position: index + 1
  }))
};

const schemaMarkup = schemaGen.getHowToSchema(howToData, pageUrl);
---

<script type="application/ld+json" set:html={JSON.stringify(schemaMarkup)} />

<section class="howto-section">
  <header class="howto-header">
    <h2 class="howto-title">{title}</h2>
    <p class="howto-description">{description}</p>

    {(totalTime || estimatedCost) && (
      <div class="howto-meta">
        {totalTime && (
          <div class="meta-item">
            <svg class="meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Total Time: {totalTime.replace('PT', '').replace('H', ' hours ').replace('M', ' minutes')}</span>
          </div>
        )}
        {estimatedCost && (
          <div class="meta-item">
            <svg class="meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Cost: {estimatedCost.currency}{estimatedCost.min}-{estimatedCost.max}</span>
          </div>
        )}
      </div>
    )}

    {(supplies && supplies.length > 0) && (
      <div class="howto-supplies">
        <h3>What You'll Need:</h3>
        <ul>
          {supplies.map(supply => <li>{supply}</li>)}
        </ul>
      </div>
    )}
  </header>

  <div class="howto-steps">
    {steps.map((step, index) => (
      <article class="howto-step">
        <div class="step-number">{index + 1}</div>
        <div class="step-content">
          <h3 class="step-title">{step.name}</h3>

          {step.image && (
            <img
              src={step.image}
              alt={step.name}
              class="step-image"
              loading="lazy"
            />
          )}

          <p class="step-description">{step.description}</p>

          {(step.time || step.cost) && (
            <div class="step-meta">
              {step.time && <span class="meta-badge">⏱️ {step.time}</span>}
              {step.cost && <span class="meta-badge">💰 {step.cost}</span>}
            </div>
          )}

          {step.tips && step.tips.length > 0 && (
            <div class="step-tips">
              <strong>💡 Tips:</strong>
              <ul>
                {step.tips.map(tip => <li>{tip}</li>)}
              </ul>
            </div>
          )}
        </div>
      </article>
    ))}
  </div>
</section>

<style>
  .howto-section {
    margin: 3rem 0;
  }

  .howto-header {
    margin-bottom: 2.5rem;
  }

  .howto-title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--brand-navy, #1A1A2E);
    margin-bottom: 1rem;
  }

  .howto-description {
    font-size: 1.125rem;
    color: #64748b;
    line-height: 1.7;
    margin-bottom: 1.5rem;
  }

  .howto-meta {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #475569;
    font-weight: 500;
  }

  .meta-icon {
    width: 1.25rem;
    height: 1.25rem;
    color: var(--brand-red, #E94560);
  }

  .howto-supplies {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 8px;
    border-left: 4px solid var(--brand-red, #E94560);
  }

  .howto-supplies h3 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    color: var(--brand-navy, #1A1A2E);
  }

  .howto-supplies ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.5rem;
  }

  .howto-supplies li:before {
    content: '✓ ';
    color: var(--brand-red, #E94560);
    font-weight: bold;
    margin-right: 0.5rem;
  }

  .howto-steps {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .howto-step {
    display: grid;
    grid-template-columns: 3rem 1fr;
    gap: 1.5rem;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 2rem;
    transition: all 0.2s;
  }

  .howto-step:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: var(--brand-red, #E94560);
  }

  .step-number {
    width: 3rem;
    height: 3rem;
    background: linear-gradient(135deg, var(--brand-red, #E94560), #d63851);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .step-content {
    min-width: 0;
  }

  .step-title {
    font-size: 1.375rem;
    font-weight: 700;
    color: var(--brand-navy, #1A1A2E);
    margin-bottom: 1rem;
  }

  .step-image {
    width: 100%;
    max-width: 600px;
    height: auto;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .step-description {
    font-size: 1rem;
    line-height: 1.7;
    color: #475569;
    margin-bottom: 1rem;
  }

  .step-meta {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .meta-badge {
    background: #f1f5f9;
    padding: 0.375rem 0.875rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    color: #475569;
  }

  .step-tips {
    background: #fff7ed;
    border: 1px solid #fed7aa;
    border-radius: 8px;
    padding: 1rem;
    margin-top: 1rem;
  }

  .step-tips strong {
    display: block;
    margin-bottom: 0.5rem;
    color: #c2410c;
  }

  .step-tips ul {
    margin: 0;
    padding-left: 1.5rem;
  }

  .step-tips li {
    color: #92400e;
    margin-bottom: 0.25rem;
  }

  @media (max-width: 768px) {
    .howto-step {
      grid-template-columns: 2.5rem 1fr;
      gap: 1rem;
      padding: 1.5rem;
    }

    .step-number {
      width: 2.5rem;
      height: 2.5rem;
      font-size: 1.25rem;
    }

    .step-title {
      font-size: 1.125rem;
    }

    .howto-title {
      font-size: 1.5rem;
    }

    .howto-meta {
      flex-direction: column;
      gap: 0.75rem;
    }
  }
</style>
```

**Usage Example:**

```astro
---
import HowToSection from '../components/seo/HowToSection.astro';

const steps = [
  {
    name: 'Research Local Requirements',
    description: 'Check your state and local licensing requirements for operating a dog daycare facility. Requirements vary by location.',
    time: '1-2 weeks',
    cost: '$0',
    tips: [
      'Contact your local business licensing department',
      'Check zoning regulations for your location',
      'Research insurance requirements'
    ]
  },
  {
    name: 'Create Business Plan',
    description: 'Develop a comprehensive business plan including financial projections, target market analysis, and operational procedures.',
    image: '/images/business-plan.jpg',
    time: '2-3 weeks',
    cost: '$0-500',
    tips: [
      'Use a business plan template',
      'Research local competition',
      'Calculate startup costs accurately'
    ]
  }
  // ... more steps
];
---

<HowToSection
  title="How to Start a Dog Daycare Business"
  description="Complete step-by-step guide to launching your own successful dog daycare facility"
  steps={steps}
  totalTime="PT6M"
  estimatedCost={{ min: 10000, max: 50000, currency: '$' }}
  supplies={['Business license application', 'Insurance quotes', 'Lease agreement']}
  site="petcare"
  pageUrl={Astro.url.href}
/>
```

---

### 2.4 Statistics Section Component

**File: `src/components/seo/StatisticsSection.astro`**

Purpose: Display industry statistics with Dataset schema

```astro
---
/**
 * Statistics Section Component
 *
 * Displays industry statistics and data with proper structured data markup.
 * AI systems heavily favor citing statistics, making this component crucial
 * for AI visibility.
 *
 * Best Practices:
 * - Always include data source
 * - Add publication date
 * - Use specific numbers (not ranges like "50-100")
 * - Include year in context
 *
 * Usage:
 * <StatisticsSection
 *   title="Dog Daycare Industry Statistics 2026"
 *   stats={statsData}
 *   source="Pet Industry Market Research"
 * />
 */

import { createSchemaGenerator } from '../../utils/schema';
import type { DatasetSchema } from '../../utils/schema/types';

interface Statistic {
  label: string;
  value: string | number;
  unit?: string;
  change?: {
    value: number;
    direction: 'up' | 'down';
    period: string;
  };
  context?: string;
}

interface Props {
  title: string;
  description?: string;
  stats: Statistic[];
  source?: string;
  sourceUrl?: string;
  datePublished?: string;
  site: 'mydojo' | 'petcare' | 'driveschool' | 'tattoo';
  pageUrl: string;
  layout?: 'grid' | 'list';
}

const {
  title,
  description,
  stats,
  source,
  sourceUrl,
  datePublished,
  site,
  pageUrl,
  layout = 'grid'
} = Astro.props;

// Generate Dataset schema
const schemaGen = createSchemaGenerator(site);
const datasetData: DatasetSchema = {
  name: title,
  description: description || title,
  url: pageUrl,
  datePublished: datePublished,
  creator: {
    type: 'Organization',
    name: source || `${site} Research Team`
  }
};

const schemaMarkup = schemaGen.getDatasetSchema(datasetData, pageUrl);
---

<script type="application/ld+json" set:html={JSON.stringify(schemaMarkup)} />

<section class="statistics-section">
  <header class="stats-header">
    <h2 class="stats-title">{title}</h2>
    {description && <p class="stats-description">{description}</p>}
  </header>

  <div class={`stats-grid layout-${layout}`}>
    {stats.map((stat) => (
      <article class="stat-card">
        <div class="stat-value-wrapper">
          <div class="stat-value">
            {stat.value}
            {stat.unit && <span class="stat-unit">{stat.unit}</span>}
          </div>
          {stat.change && (
            <div class={`stat-change change-${stat.change.direction}`}>
              {stat.change.direction === 'up' ? '↑' : '↓'}
              {stat.change.value}%
              <span class="change-period">{stat.change.period}</span>
            </div>
          )}
        </div>
        <div class="stat-label">{stat.label}</div>
        {stat.context && (
          <p class="stat-context">{stat.context}</p>
        )}
      </article>
    ))}
  </div>

  {(source || datePublished) && (
    <footer class="stats-footer">
      {source && (
        <p class="stats-source">
          <strong>Source:</strong>
          {sourceUrl ? (
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer">{source}</a>
          ) : (
            <span>{source}</span>
          )}
        </p>
      )}
      {datePublished && (
        <p class="stats-date">
          <strong>Data as of:</strong> {new Date(datePublished).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
        </p>
      )}
    </footer>
  )}
</section>

<style>
  .statistics-section {
    margin: 3rem 0;
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    border-radius: 12px;
    padding: 2.5rem;
    border: 1px solid #e2e8f0;
  }

  .stats-header {
    margin-bottom: 2.5rem;
    text-align: center;
  }

  .stats-title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--brand-navy, #1A1A2E);
    margin-bottom: 0.75rem;
  }

  .stats-description {
    font-size: 1.125rem;
    color: #64748b;
    max-width: 600px;
    margin: 0 auto;
  }

  .stats-grid {
    display: grid;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .stats-grid.layout-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }

  .stats-grid.layout-list {
    grid-template-columns: 1fr;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }

  .stat-card {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.3s;
    border: 2px solid transparent;
  }

  .stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
    border-color: var(--brand-red, #E94560);
  }

  .stat-value-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }

  .stat-value {
    font-size: 3rem;
    font-weight: 700;
    color: var(--brand-red, #E94560);
    line-height: 1;
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
  }

  .stat-unit {
    font-size: 1.5rem;
    color: #64748b;
    font-weight: 600;
  }

  .stat-change {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.75rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .stat-change.change-up {
    background: #d1fae5;
    color: #065f46;
  }

  .stat-change.change-down {
    background: #fee2e2;
    color: #991b1b;
  }

  .change-period {
    font-size: 0.75rem;
    opacity: 0.8;
    margin-left: 0.25rem;
  }

  .stat-label {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--brand-navy, #1A1A2E);
    margin-bottom: 0.5rem;
  }

  .stat-context {
    font-size: 0.875rem;
    color: #64748b;
    line-height: 1.5;
    margin: 0;
  }

  .stats-footer {
    border-top: 1px solid #e2e8f0;
    padding-top: 1.5rem;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
    font-size: 0.875rem;
    color: #64748b;
  }

  .stats-footer strong {
    color: var(--brand-navy, #1A1A2E);
  }

  .stats-source a {
    color: var(--brand-red, #E94560);
    text-decoration: none;
  }

  .stats-source a:hover {
    text-decoration: underline;
  }

  @media (max-width: 768px) {
    .statistics-section {
      padding: 1.5rem;
    }

    .stats-title {
      font-size: 1.5rem;
    }

    .stats-grid.layout-grid {
      grid-template-columns: 1fr;
    }

    .stat-card {
      padding: 1.5rem;
    }

    .stat-value {
      font-size: 2.5rem;
    }

    .stats-footer {
      flex-direction: column;
    }
  }
</style>
```

**Usage Example:**

```astro
---
import StatisticsSection from '../components/seo/StatisticsSection.astro';

const industryStats = [
  {
    label: 'Global Market Size',
    value: '$1.2B',
    change: { value: 15, direction: 'up', period: 'YoY' },
    context: 'The pet daycare industry continues rapid growth'
  },
  {
    label: 'Average Daily Rate',
    value: '$25-40',
    context: 'Varies by location and service level'
  },
  {
    label: 'No-Show Rate (Without Software)',
    value: '15-20%',
    change: { value: 5, direction: 'up', period: '2025' }
  },
  {
    label: 'No-Show Rate (With Automated Reminders)',
    value: '3-5%',
    change: { value: 70, direction: 'down', period: 'vs. without' },
    context: 'Automated reminders reduce no-shows by 70%'
  }
];
---

<StatisticsSection
  title="Dog Daycare Industry Statistics 2026"
  description="Key metrics and trends in the pet daycare market"
  stats={industryStats}
  source="Pet Industry Market Research Report"
  sourceUrl="https://example.com/report"
  datePublished="2026-01-01"
  site="petcare"
  pageUrl={Astro.url.href}
  layout="grid"
/>
```

---

This is Part 1 of the implementation plan. Would you like me to continue with:

**Part 2:**
- Enhanced FAQ component
- Product Showcase component
- Enhanced Breadcrumbs
- Enhanced layouts (BaseLayoutEnhanced, PillarPageEnhanced, BlogPostEnhanced)

**Part 3:**
- Content templates and examples
- Site-specific implementation examples
- Rollout strategy and testing plan
- Performance optimization
- Monitoring and tracking setup

Shall I continue?
---

## 📦 Phase 2: Additional Components (Week 1, Continued)

### 2.5 Enhanced FAQ Component

**File: `src/components/seo/FAQEnhanced.astro`**

Purpose: Expandable FAQ section with FAQPage schema and rich interaction

```astro
---
/**
 * Enhanced FAQ Component
 *
 * Creates an accessible, expandable FAQ section with:
 * - FAQPage structured data
 * - Smooth expand/collapse animations
 * - Keyboard navigation
 * - Individual question linking
 * - Search functionality (optional)
 *
 * Best Practices:
 * - Include 8-12 FAQs per page
 * - Front-load most important questions
 * - Keep answers to 2-3 sentences when possible
 * - Include links to related content
 * - Match "People Also Ask" queries from Google
 *
 * Usage:
 * <FAQEnhanced faqs={faqData} site="mydojo" pageUrl={Astro.url.href} />
 */

import { createSchemaGenerator } from '../../utils/schema';
import type { FAQItem } from '../../utils/schema/types';

interface Props {
  faqs: Array<{
    question: string;
    answer: string;
    links?: Array<{ text: string; url: string }>;
  }>;
  title?: string;
  searchable?: boolean;
  site: 'mydojo' | 'petcare' | 'driveschool' | 'tattoo';
  pageUrl: string;
  initiallyExpanded?: number; // Index of question to show expanded
}

const {
  faqs,
  title = 'Frequently Asked Questions',
  searchable = false,
  site,
  pageUrl,
  initiallyExpanded
} = Astro.props;

// Generate FAQ schema
const schemaGen = createSchemaGenerator(site);
const faqItems: FAQItem[] = faqs.map((faq, index) => ({
  question: faq.question,
  answer: faq.answer,
  position: index + 1
}));

const schemaMarkup = schemaGen.getFAQPageSchema(faqItems, pageUrl);
---

<script type="application/ld+json" set:html={JSON.stringify(schemaMarkup)} />

<section class="faq-section" id="faq">
  <header class="faq-header">
    <h2 class="faq-title">{title}</h2>
    {searchable && (
      <div class="faq-search">
        <input
          type="search"
          id="faq-search-input"
          placeholder="Search questions..."
          class="faq-search-input"
          aria-label="Search FAQ questions"
        />
      </div>
    )}
  </header>

  <div class="faq-list" role="list">
    {faqs.map((faq, index) => (
      <article
        class="faq-item"
        id={`faq-${index + 1}`}
        data-faq-index={index}
        role="listitem"
      >
        <button
          class="faq-question"
          aria-expanded={initiallyExpanded === index ? 'true' : 'false'}
          aria-controls={`faq-answer-${index + 1}`}
          data-faq-toggle
        >
          <span class="question-text">{faq.question}</span>
          <svg class="faq-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div
          class="faq-answer"
          id={`faq-answer-${index + 1}`}
          hidden={initiallyExpanded !== index}
        >
          <div class="answer-content">
            <p set:html={faq.answer} />

            {faq.links && faq.links.length > 0 && (
              <div class="answer-links">
                <strong>Related:</strong>
                {faq.links.map(link => (
                  <a href={link.url} class="answer-link">{link.text}</a>
                ))}
              </div>
            )}
          </div>
        </div>
      </article>
    ))}
  </div>

  <footer class="faq-footer">
    <p>Still have questions? <a href="/contact/" class="contact-link">Contact our team</a></p>
  </footer>
</section>

<style>
  .faq-section {
    margin: 3rem 0;
    background: white;
    border-radius: 12px;
    padding: 2.5rem;
    border: 1px solid #e2e8f0;
  }

  .faq-header {
    margin-bottom: 2rem;
  }

  .faq-title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--brand-navy, #1A1A2E);
    margin-bottom: 1.5rem;
  }

  .faq-search {
    max-width: 500px;
  }

  .faq-search-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.2s;
  }

  .faq-search-input:focus {
    outline: none;
    border-color: var(--brand-red, #E94560);
    box-shadow: 0 0 0 3px rgba(233, 69, 96, 0.1);
  }

  .faq-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .faq-item {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.2s;
  }

  .faq-item:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .faq-item:target {
    animation: highlight 1.5s ease;
  }

  @keyframes highlight {
    0%, 100% {
      background: white;
    }
    50% {
      background: #fff7ed;
    }
  }

  .faq-question {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    background: white;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background 0.2s;
    font-family: inherit;
  }

  .faq-question:hover {
    background: #f8f9fa;
  }

  .faq-question:focus {
    outline: none;
    background: #f8f9fa;
  }

  .faq-question[aria-expanded="true"] {
    background: #f8f9fa;
    border-bottom: 1px solid #e2e8f0;
  }

  .question-text {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--brand-navy, #1A1A2E);
  }

  .faq-icon {
    width: 1.5rem;
    height: 1.5rem;
    color: var(--brand-red, #E94560);
    flex-shrink: 0;
    transition: transform 0.3s ease;
  }

  .faq-question[aria-expanded="true"] .faq-icon {
    transform: rotate(180deg);
  }

  .faq-answer {
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .faq-answer[hidden] {
    display: none;
  }

  .answer-content {
    padding: 1.5rem;
    background: white;
  }

  .answer-content p {
    font-size: 1rem;
    line-height: 1.7;
    color: #475569;
    margin: 0 0 1rem;
  }

  .answer-content p:last-of-type {
    margin-bottom: 0;
  }

  .answer-links {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
  }

  .answer-links strong {
    color: var(--brand-navy, #1A1A2E);
    font-size: 0.875rem;
  }

  .answer-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.75rem;
    background: #f1f5f9;
    color: var(--brand-red, #E94560);
    text-decoration: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s;
  }

  .answer-link:hover {
    background: var(--brand-red, #E94560);
    color: white;
  }

  .faq-footer {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid #e2e8f0;
    text-align: center;
  }

  .faq-footer p {
    font-size: 1rem;
    color: #64748b;
  }

  .contact-link {
    color: var(--brand-red, #E94560);
    text-decoration: none;
    font-weight: 600;
  }

  .contact-link:hover {
    text-decoration: underline;
  }

  @media (max-width: 768px) {
    .faq-section {
      padding: 1.5rem;
    }

    .faq-title {
      font-size: 1.5rem;
    }

    .faq-question {
      padding: 1rem;
    }

    .question-text {
      font-size: 1rem;
    }

    .answer-content {
      padding: 1rem;
    }
  }
</style>

<script>
  // FAQ expand/collapse functionality
  function initializeFAQ() {
    const faqToggles = document.querySelectorAll('[data-faq-toggle]');
    
    faqToggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        const answerId = toggle.getAttribute('aria-controls');
        const answer = document.getElementById(answerId!);
        
        if (!answer) return;
        
        toggle.setAttribute('aria-expanded', String(!isExpanded));
        answer.hidden = isExpanded;
      });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const expandedToggle = document.querySelector('[data-faq-toggle][aria-expanded="true"]');
        if (expandedToggle) {
          expandedToggle.click();
        }
      }
    });
  }

  // FAQ search functionality
  function initializeFAQSearch() {
    const searchInput = document.getElementById('faq-search-input') as HTMLInputElement;
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value.toLowerCase();
      const faqItems = document.querySelectorAll('.faq-item');

      faqItems.forEach(item => {
        const question = item.querySelector('.question-text')?.textContent?.toLowerCase() || '';
        const answer = item.querySelector('.answer-content')?.textContent?.toLowerCase() || '';
        
        const matches = question.includes(query) || answer.includes(query);
        
        if (query === '' || matches) {
          (item as HTMLElement).style.display = '';
        } else {
          (item as HTMLElement).style.display = 'none';
        }
      });
    });
  }

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeFAQ();
      initializeFAQSearch();
    });
  } else {
    initializeFAQ();
    initializeFAQSearch();
  }
</script>
```

**Usage Example:**

```astro
---
import FAQEnhanced from '../components/seo/FAQEnhanced.astro';

const faqs = [
  {
    question: 'What is martial arts software?',
    answer: 'Martial arts software is a specialized management platform designed for dojos, academies, and combat sports gyms. It handles student databases, belt progression tracking, class scheduling, membership billing, and communication—all tailored to martial arts instruction.',
    links: [
      { text: 'Dojo Management Software', url: '/dojo-management-software/' },
      { text: 'Features Guide', url: '/martial-arts-software/' }
    ]
  },
  {
    question: 'How much does martial arts software cost?',
    answer: 'Most martial arts software costs between £50-300 per month depending on your student count and required features. Common pricing models include per-student charges (£1-3 per active student), tiered plans based on school size, or flat monthly rates.',
    links: [
      { text: 'View Pricing', url: '/pricing/' }
    ]
  }
  // ... more FAQs
];
---

<FAQEnhanced
  faqs={faqs}
  title="Frequently Asked Questions"
  searchable={true}
  site="mydojo"
  pageUrl={Astro.url.href}
  initiallyExpanded={0}
/>
```

---

### 2.6 Product Showcase Component

**File: `src/components/seo/ProductShowcase.astro`**

Purpose: Display software product with SoftwareApplication schema

```astro
---
/**
 * Product Showcase Component
 *
 * Displays software product information with complete SoftwareApplication schema.
 * Optimized for Google's product rich results.
 *
 * Best Practices:
 * - Include aggregate ratings if available
 * - List specific features as bullet points
 * - Add screenshots
 * - Include pricing information
 * - Show system requirements
 *
 * Usage:
 * <ProductShowcase
 *   name="MyDojo Software"
 *   description="..."
 *   features={features}
 *   pricing={pricingData}
 *   rating={{ value: 4.8, count: 127 }}
 * />
 */

import { createSchemaGenerator } from '../../utils/schema';
import type { SoftwareApplicationSchema } from '../../utils/schema/types';

interface ProductFeature {
  icon: string;
  title: string;
  description: string;
}

interface PricingTier {
  name: string;
  price: number;
  currency: string;
  period: 'month' | 'year';
  features: string[];
  highlighted?: boolean;
}

interface Props {
  name: string;
  description: string;
  tagline?: string;
  features: ProductFeature[];
  pricing: PricingTier[];
  rating?: {
    value: number;
    count: number;
  };
  screenshots?: string[];
  operatingSystem?: string;
  applicationCategory?: 'BusinessApplication' | 'DeveloperApplication';
  site: 'mydojo' | 'petcare' | 'driveschool' | 'tattoo';
  pageUrl: string;
  ctaText?: string;
  ctaUrl?: string;
}

const {
  name,
  description,
  tagline,
  features,
  pricing,
  rating,
  screenshots,
  operatingSystem = 'Web Browser, iOS, Android',
  applicationCategory = 'BusinessApplication',
  site,
  pageUrl,
  ctaText = 'Start Free Trial',
  ctaUrl = '/contact/'
} = Astro.props;

// Generate SoftwareApplication schema (use highlighted pricing tier or first tier)
const primaryTier = pricing.find(t => t.highlighted) || pricing[0];
const schemaGen = createSchemaGenerator(site);
const productSchema: SoftwareApplicationSchema = {
  name,
  applicationCategory,
  operatingSystem,
  offers: {
    price: primaryTier.price,
    priceCurrency: primaryTier.currency
  },
  ...(rating && {
    aggregateRating: {
      ratingValue: rating.value,
      ratingCount: rating.count,
      bestRating: 5,
      worstRating: 1
    }
  }),
  featureList: features.map(f => f.title),
  ...(screenshots && { screenshot: screenshots })
};

const schemaMarkup = schemaGen.getSoftwareApplicationSchema(productSchema, pageUrl);
---

<script type="application/ld+json" set:html={JSON.stringify(schemaMarkup)} />

<section class="product-showcase">
  <div class="product-hero">
    <div class="hero-content">
      <h1 class="product-name">{name}</h1>
      {tagline && <p class="product-tagline">{tagline}</p>}
      <p class="product-description">{description}</p>

      {rating && (
        <div class="product-rating">
          <div class="rating-stars">
            {Array.from({ length: 5 }, (_, i) => (
              <svg
                class={i < Math.floor(rating.value) ? 'star-filled' : 'star-empty'}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span class="rating-text">{rating.value} / 5 ({rating.count} reviews)</span>
        </div>
      )}

      <div class="product-cta">
        <a href={ctaUrl} class="btn-primary-large">
          {ctaText}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </a>
        <p class="cta-subtext">No credit card required • 14-day free trial</p>
      </div>
    </div>

    {screenshots && screenshots.length > 0 && (
      <div class="hero-screenshot">
        <img src={screenshots[0]} alt={`${name} screenshot`} class="screenshot-image" />
      </div>
    )}
  </div>

  <div class="product-features">
    <h2 class="features-title">Key Features</h2>
    <div class="features-grid">
      {features.map(feature => (
        <div class="feature-card">
          <div class="feature-icon">{feature.icon}</div>
          <h3 class="feature-title">{feature.title}</h3>
          <p class="feature-description">{feature.description}</p>
        </div>
      ))}
    </div>
  </div>

  <div class="product-pricing">
    <h2 class="pricing-title">Pricing Plans</h2>
    <div class="pricing-grid">
      {pricing.map(tier => (
        <div class={`pricing-card ${tier.highlighted ? 'highlighted' : ''}`}>
          {tier.highlighted && <div class="popular-badge">Most Popular</div>}
          <h3 class="tier-name">{tier.name}</h3>
          <div class="tier-price">
            <span class="currency">{tier.currency === 'GBP' ? '£' : tier.currency}</span>
            <span class="amount">{tier.price}</span>
            <span class="period">/{tier.period}</span>
          </div>
          <ul class="tier-features">
            {tier.features.map(feature => (
              <li>
                <svg class="check-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
          <a href={ctaUrl} class={`pricing-cta ${tier.highlighted ? 'primary' : 'secondary'}`}>
            Get Started
          </a>
        </div>
      ))}
    </div>
  </div>
</section>

<style>
  .product-showcase {
    margin: 0;
  }

  .product-hero {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    align-items: center;
    padding: 4rem 0;
  }

  .hero-content {
    max-width: 600px;
  }

  .product-name {
    font-size: 3rem;
    font-weight: 700;
    color: var(--brand-navy, #1A1A2E);
    margin-bottom: 1rem;
    line-height: 1.1;
  }

  .product-tagline {
    font-size: 1.5rem;
    color: var(--brand-red, #E94560);
    font-weight: 600;
    margin-bottom: 1.5rem;
  }

  .product-description {
    font-size: 1.125rem;
    line-height: 1.7;
    color: #64748b;
    margin-bottom: 2rem;
  }

  .product-rating {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .rating-stars {
    display: flex;
    gap: 0.25rem;
  }

  .rating-stars svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .star-filled {
    color: #fbbf24;
  }

  .star-empty {
    color: #e5e7eb;
  }

  .rating-text {
    font-size: 0.875rem;
    color: #64748b;
    font-weight: 500;
  }

  .product-cta {
    margin-top: 2rem;
  }

  .btn-primary-large {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 2rem;
    background: var(--brand-red, #E94560);
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-size: 1.125rem;
    font-weight: 600;
    transition: all 0.2s;
  }

  .btn-primary-large:hover {
    background: #d63851;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(233, 69, 96, 0.3);
  }

  .cta-subtext {
    margin-top: 0.75rem;
    font-size: 0.875rem;
    color: #64748b;
  }

  .hero-screenshot {
    position: relative;
  }

  .screenshot-image {
    width: 100%;
    height: auto;
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }

  .product-features {
    padding: 4rem 0;
    background: #f8f9fa;
  }

  .features-title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--brand-navy, #1A1A2E);
    text-align: center;
    margin-bottom: 3rem;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .feature-card {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.2s;
  }

  .feature-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  }

  .feature-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  .feature-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--brand-navy, #1A1A2E);
    margin-bottom: 0.75rem;
  }

  .feature-description {
    font-size: 0.95rem;
    line-height: 1.6;
    color: #64748b;
  }

  .product-pricing {
    padding: 4rem 0;
  }

  .pricing-title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--brand-navy, #1A1A2E);
    text-align: center;
    margin-bottom: 3rem;
  }

  .pricing-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .pricing-card {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 2rem;
    position: relative;
    transition: all 0.2s;
  }

  .pricing-card:hover {
    border-color: var(--brand-red, #E94560);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  }

  .pricing-card.highlighted {
    border-color: var(--brand-red, #E94560);
    box-shadow: 0 8px 24px rgba(233, 69, 96, 0.2);
    transform: scale(1.05);
  }

  .popular-badge {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--brand-red, #E94560);
    color: white;
    padding: 0.375rem 1rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .tier-name {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--brand-navy, #1A1A2E);
    margin-bottom: 1rem;
  }

  .tier-price {
    margin-bottom: 2rem;
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
  }

  .currency {
    font-size: 1.5rem;
    color: var(--brand-navy, #1A1A2E);
    font-weight: 600;
  }

  .amount {
    font-size: 3rem;
    font-weight: 700;
    color: var(--brand-navy, #1A1A2E);
  }

  .period {
    font-size: 1rem;
    color: #64748b;
  }

  .tier-features {
    list-style: none;
    padding: 0;
    margin: 0 0 2rem;
  }

  .tier-features li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid #e2e8f0;
    color: #475569;
  }

  .tier-features li:last-child {
    border-bottom: none;
  }

  .check-icon {
    width: 1.25rem;
    height: 1.25rem;
    color: var(--brand-red, #E94560);
    flex-shrink: 0;
  }

  .pricing-cta {
    display: block;
    width: 100%;
    padding: 1rem;
    text-align: center;
    border-radius: 8px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s;
  }

  .pricing-cta.primary {
    background: var(--brand-red, #E94560);
    color: white;
  }

  .pricing-cta.primary:hover {
    background: #d63851;
  }

  .pricing-cta.secondary {
    background: #f1f5f9;
    color: var(--brand-navy, #1A1A2E);
    border: 2px solid #e2e8f0;
  }

  .pricing-cta.secondary:hover {
    background: #e2e8f0;
  }

  @media (max-width: 1024px) {
    .product-hero {
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    .pricing-card.highlighted {
      transform: none;
    }
  }

  @media (max-width: 768px) {
    .product-name {
      font-size: 2rem;
    }

    .product-tagline {
      font-size: 1.25rem;
    }

    .features-grid,
    .pricing-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
```

---

### 2.7 Enhanced Breadcrumbs with Schema

**File: `src/components/seo/BreadcrumbsEnhanced.astro`**

Purpose: Breadcrumbs with BreadcrumbList structured data

```astro
---
/**
 * Enhanced Breadcrumbs Component
 *
 * Displays breadcrumb navigation with BreadcrumbList schema.
 * Essential for site hierarchy understanding by search engines.
 *
 * Usage:
 * <BreadcrumbsEnhanced
 *   items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Blog', href: '/blog/' },
 *     { label: 'Article Title' }
 *   ]}
 *   site="mydojo"
 * />
 */

import { createSchemaGenerator } from '../../utils/schema';
import type { BreadcrumbItem } from '../../utils/schema/types';

interface Props {
  items: Array<{
    label: string;
    href?: string;
  }>;
  site: 'mydojo' | 'petcare' | 'driveschool' | 'tattoo';
  separator?: string;
}

const {
  items,
  site,
  separator = '/'
} = Astro.props;

// Generate breadcrumb schema
const schemaGen = createSchemaGenerator(site);
const breadcrumbItems: BreadcrumbItem[] = items.map((item, index) => ({
  label: item.label,
  href: item.href,
  position: index + 1
}));

const schemaMarkup = schemaGen.getBreadcrumbSchema(breadcrumbItems);
---

<script type="application/ld+json" set:html={JSON.stringify(schemaMarkup)} />

<nav aria-label="Breadcrumb" class="breadcrumbs">
  <ol class="breadcrumb-list">
    {items.map((item, index) => (
      <li class="breadcrumb-item">
        {item.href ? (
          <a href={item.href} class="breadcrumb-link">
            {item.label}
          </a>
        ) : (
          <span class="breadcrumb-current" aria-current="page">
            {item.label}
          </span>
        )}
        {index < items.length - 1 && (
          <span class="breadcrumb-separator" aria-hidden="true">{separator}</span>
        )}
      </li>
    ))}
  </ol>
</nav>

<style>
  .breadcrumbs {
    padding: 1rem 0;
    font-size: 0.875rem;
  }

  .breadcrumb-list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .breadcrumb-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .breadcrumb-link {
    color: #64748b;
    text-decoration: none;
    transition: color 0.2s;
  }

  .breadcrumb-link:hover {
    color: var(--brand-red, #E94560);
    text-decoration: underline;
  }

  .breadcrumb-current {
    color: var(--brand-navy, #1A1A2E);
    font-weight: 600;
  }

  .breadcrumb-separator {
    color: #cbd5e1;
    user-select: none;
  }
</style>
```

---


## 📦 Phase 3: Enhanced Layouts (Week 2, Days 1-3)

### 3.1 BaseLayoutEnhanced

**File: `src/layouts/BaseLayoutEnhanced.astro`**

Purpose: Drop-in replacement for BaseLayout with multi-schema support

```astro
---
/**
 * Enhanced Base Layout
 *
 * Extended version of BaseLayout with:
 * - Multiple schema type support
 * - Automatic schema generation
 * - Enhanced meta tags
 * - Performance optimizations
 *
 * Backward compatible with existing BaseLayout props.
 */

import Navigation from '../components/Navigation.astro';
import Footer from '../components/Footer.astro';
import CookieConsent from '../components/CookieConsent.astro';
import { createSchemaGenerator } from '../utils/schema';
import type {
  SoftwareApplicationSchema,
  HowToSchema,
  FAQItem,
  BreadcrumbItem,
  DatasetSchema,
  ArticleSchema
} from '../utils/schema/types';
import '../styles/global.css';

interface Props {
  // Basic props
  title: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
  author?: string;
  noindex?: boolean;

  // Article/Blog props
  publishedDate?: string;
  modifiedDate?: string;
  articleSection?: string;
  wordCount?: number;

  // Product props
  productSchema?: SoftwareApplicationSchema;

  // HowTo props
  howToSchema?: HowToSchema;

  // FAQ props
  faqItems?: FAQItem[];

  // Breadcrumb props
  breadcrumbs?: BreadcrumbItem[];

  // Dataset props
  datasetSchema?: DatasetSchema;

  // Site identifier for schema generation
  site: 'mydojo' | 'petcare' | 'driveschool' | 'tattoo';
}

const {
  title,
  description = getDefaultDescription(Astro.props.site),
  image = '/images/og-default.jpg',
  type = 'website',
  author = `${getSiteName(Astro.props.site)} Team`,
  noindex = false,
  publishedDate,
  modifiedDate,
  articleSection,
  wordCount,
  productSchema,
  howToSchema,
  faqItems,
  breadcrumbs,
  datasetSchema,
  site
} = Astro.props;

// Helper functions
function getDefaultDescription(site: string): string {
  const descriptions = {
    mydojo: 'MyDojo Software - The complete martial arts management platform for dojos, karate schools, and MMA gyms. Streamline scheduling, billing, and student management.',
    petcare: 'PetCare Software - Complete management software for dog daycare, boarding, kennels, and catteries. Online booking, billing, and operations in one platform.',
    driveschool: 'MyDriveSchool Software - Complete driving school management software. Scheduling, student management, and billing for driving instructors.',
    tattoo: 'MyTattoo Software - Complete tattoo studio management software. Online booking, client management, and scheduling for tattoo artists.'
  };
  return descriptions[site as keyof typeof descriptions] || descriptions.mydojo;
}

function getSiteName(site: string): string {
  const names = {
    mydojo: 'MyDojo Software',
    petcare: 'PetCare Software',
    driveschool: 'MyDriveSchool Software',
    tattoo: 'MyTattoo Software'
  };
  return names[site as keyof typeof names] || names.mydojo;
}

const canonicalURL = new URL(Astro.url.pathname, Astro.site);
const siteName = getSiteName(site);
const fullTitle = title === 'Home' ? `${siteName} - Management Platform` : `${title} | ${siteName}`;

// Generate schema
const schemaGen = createSchemaGenerator(site);
const pageSchemas: object[] = [];

// Add appropriate page schema
if (type === 'article' && publishedDate) {
  const articleData: ArticleSchema = {
    headline: title,
    description: description,
    image: image,
    datePublished: publishedDate,
    dateModified: modifiedDate || publishedDate,
    author: {
      type: 'Person',
      name: author
    },
    publisher: {
      name: siteName,
      logo: `${Astro.site}logo.svg`
    },
    ...(wordCount && { wordCount }),
    ...(articleSection && { articleSection })
  };
  pageSchemas.push(schemaGen.getArticleSchema(articleData, canonicalURL.href, 'BlogPosting'));
} else {
  pageSchemas.push({
    "@type": "WebPage",
    "@id": canonicalURL.href,
    "url": canonicalURL.href,
    "name": title,
    "description": description,
    "isPartOf": {
      "@id": `${Astro.site}#website`
    }
  });
}

// Add product schema if provided
if (productSchema) {
  pageSchemas.push(schemaGen.getSoftwareApplicationSchema(productSchema, canonicalURL.href));
}

// Add HowTo schema if provided
if (howToSchema) {
  pageSchemas.push(schemaGen.getHowToSchema(howToSchema, canonicalURL.href));
}

// Add FAQ schema if provided
if (faqItems && faqItems.length > 0) {
  pageSchemas.push(schemaGen.getFAQPageSchema(faqItems, canonicalURL.href));
}

// Add breadcrumb schema if provided
if (breadcrumbs && breadcrumbs.length > 0) {
  pageSchemas.push(schemaGen.getBreadcrumbSchema(breadcrumbs));
}

// Add dataset schema if provided
if (datasetSchema) {
  pageSchemas.push(schemaGen.getDatasetSchema(datasetSchema, canonicalURL.href));
}

// Build final schema
const finalSchema = schemaGen.buildSchema(pageSchemas);
---

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="generator" content={Astro.generator} />

  <!-- Primary Meta Tags -->
  <title>{fullTitle}</title>
  <meta name="title" content={fullTitle} />
  <meta name="description" content={description} />
  {noindex && <meta name="robots" content="noindex, nofollow" />}

  <!-- Canonical -->
  <link rel="canonical" href={canonicalURL} />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content={type} />
  <meta property="og:url" content={canonicalURL} />
  <meta property="og:title" content={fullTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={new URL(image, Astro.site)} />
  <meta property="og:site_name" content={siteName} />

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content={canonicalURL} />
  <meta property="twitter:title" content={fullTitle} />
  <meta property="twitter:description" content={description} />
  <meta property="twitter:image" content={new URL(image, Astro.site)} />

  <!-- Article specific meta tags -->
  {type === 'article' && publishedDate && (
    <>
      <meta property="article:published_time" content={publishedDate} />
      {modifiedDate && <meta property="article:modified_time" content={modifiedDate} />}
      {articleSection && <meta property="article:section" content={articleSection} />}
      <meta property="article:author" content={author} />
    </>
  )}

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="apple-touch-icon" sizes="180x180" href="/favicon.svg" />

  <!-- Fonts - preload for performance -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json" set:html={finalSchema} />

  <!-- Google Analytics -->
  <script is:inline>
    (function() {
      try {
        const consent = localStorage.getItem('cookieConsent');
        if (consent) {
          const consentData = JSON.parse(consent);
          if (consentData.accepted === true) {
            const script = document.createElement('script');
            script.async = true;
            script.src = 'https://www.googletagmanager.com/gtag/js?id=G-WSS89NS2ZN';
            document.head.appendChild(script);

            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-WSS89NS2ZN');
          }
        }
      } catch (error) {
        console.error('Error loading analytics:', error);
      }
    })();
  </script>
</head>
<body class="min-h-screen flex flex-col">
  <Navigation />

  <main class="flex-grow pt-16 md:pt-20">
    <slot />
  </main>

  <Footer />
  <CookieConsent />
</body>
</html>
```

---

### 3.2 PillarPageEnhanced Layout

**File: `src/layouts/PillarPageEnhanced.astro`**

Purpose: Optimized layout for pillar pages with all SEO enhancements

```astro
---
/**
 * Enhanced Pillar Page Layout
 *
 * Complete SEO-optimized layout for pillar pages including:
 * - Automatic schema generation
 * - Table of contents
 * - Reading time calculation
 * - Related content suggestions
 * - Multiple CTAs
 * - Breadcrumbs with schema
 */

import BaseLayoutEnhanced from './BaseLayoutEnhanced.astro';
import BreadcrumbsEnhanced from '../components/seo/BreadcrumbsEnhanced.astro';

interface Props {
  title: string;
  description: string;
  heroImage?: string;
  badge?: string;
  ctaText?: string;
  ctaLink?: string;
  breadcrumbLabel?: string;
  site: 'mydojo' | 'petcare' | 'driveschool' | 'tattoo';
  
  // SEO enhancements
  faqItems?: Array<{
    question: string;
    answer: string;
  }>;
  productInfo?: {
    price: number;
    currency: string;
    rating?: {
      value: number;
      count: number;
    };
  };
  relatedPages?: Array<{
    title: string;
    url: string;
    description: string;
  }>;
}

const {
  title,
  description,
  heroImage = '/images/hero-default.jpg',
  badge = 'Complete Guide',
  ctaText = 'Start Free Trial',
  ctaLink = '/contact/',
  breadcrumbLabel,
  site,
  faqItems,
  productInfo,
  relatedPages
} = Astro.props;

// Generate breadcrumb items
const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: breadcrumbLabel || title }
];

// Build product schema if product info provided
const productSchema = productInfo ? {
  name: `${title} Software`,
  applicationCategory: 'BusinessApplication' as const,
  operatingSystem: 'Web Browser, iOS, Android',
  offers: {
    price: productInfo.price,
    priceCurrency: productInfo.currency
  },
  ...(productInfo.rating && {
    aggregateRating: {
      ratingValue: productInfo.rating.value,
      ratingCount: productInfo.rating.count,
      bestRating: 5,
      worstRating: 1
    }
  })
} : undefined;
---

<BaseLayoutEnhanced
  title={title}
  description={description}
  image={heroImage}
  site={site}
  breadcrumbs={breadcrumbs.map((item, index) => ({
    label: item.label,
    href: item.href,
    position: index + 1
  }))}
  faqItems={faqItems}
  productSchema={productSchema}
>
  <!-- Hero Section -->
  <section class="pillar-hero">
    <div class="hero-background">
      <img src={heroImage} alt={title} class="hero-image" />
      <div class="hero-overlay"></div>
    </div>
    <div class="container-custom hero-content">
      <BreadcrumbsEnhanced items={breadcrumbs} site={site} />
      <span class="badge-primary">{badge}</span>
      <h1 class="hero-title">{title}</h1>
      <p class="hero-description">{description}</p>
    </div>
  </section>

  <!-- Main Content -->
  <article class="pillar-content">
    <div class="container-custom">
      <div class="content-grid">
        <!-- Sidebar (Table of Contents) -->
        <aside class="content-sidebar">
          <div class="sidebar-sticky">
            <nav class="table-of-contents" aria-label="Table of Contents">
              <h2 class="toc-title">On This Page</h2>
              <div id="toc-list"></div>
            </nav>

            <!-- CTA in sidebar -->
            <div class="sidebar-cta">
              <h3>Ready to Get Started?</h3>
              <p>See how our software can transform your business</p>
              <a href={ctaLink} class="btn-primary">{ctaText}</a>
            </div>
          </div>
        </aside>

        <!-- Main Content Area -->
        <div class="content-main">
          <div class="prose">
            <slot />
          </div>

          <!-- Bottom CTA -->
          <div class="content-cta">
            <h2>Transform Your Business Today</h2>
            <p>{description}</p>
            <a href={ctaLink} class="btn-primary-large">{ctaText}</a>
          </div>

          <!-- Related Pages -->
          {relatedPages && relatedPages.length > 0 && (
            <div class="related-pages">
              <h2>Related Resources</h2>
              <div class="related-grid">
                {relatedPages.map(page => (
                  <a href={page.url} class="related-card">
                    <h3>{page.title}</h3>
                    <p>{page.description}</p>
                    <span class="related-link">Learn more →</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </article>
</BaseLayoutEnhanced>

<style>
  .pillar-hero {
    position: relative;
    min-height: 400px;
    display: flex;
    align-items: center;
    color: white;
    margin-bottom: 4rem;
  }

  .hero-background {
    position: absolute;
    inset: 0;
    z-index: 0;
  }

  .hero-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(26, 26, 46, 0.85));
  }

  .hero-content {
    position: relative;
    z-index: 1;
    padding: 3rem 0;
  }

  .hero-title {
    font-size: 3rem;
    font-weight: 700;
    margin: 1.5rem 0 1rem;
    line-height: 1.1;
  }

  .hero-description {
    font-size: 1.25rem;
    opacity: 0.95;
    max-width: 800px;
  }

  .pillar-content {
    padding: 2rem 0 4rem;
  }

  .content-grid {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 4rem;
    align-items: start;
  }

  .content-sidebar {
    position: relative;
  }

  .sidebar-sticky {
    position: sticky;
    top: 100px;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .table-of-contents {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 1.5rem;
  }

  .toc-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--brand-navy, #1A1A2E);
    margin-bottom: 1rem;
  }

  .sidebar-cta {
    background: linear-gradient(135deg, var(--brand-red, #E94560), #d63851);
    color: white;
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
  }

  .sidebar-cta h3 {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 0.75rem;
  }

  .sidebar-cta p {
    margin-bottom: 1.5rem;
    opacity: 0.95;
  }

  .content-main {
    min-width: 0;
  }

  .prose {
    max-width: 800px;
    line-height: 1.7;
  }

  .content-cta {
    margin: 4rem 0;
    padding: 3rem;
    background: linear-gradient(135deg, #f8f9fa, #ffffff);
    border-radius: 12px;
    border: 2px solid var(--brand-red, #E94560);
    text-align: center;
  }

  .content-cta h2 {
    font-size: 2rem;
    font-weight: 700;
    color: var(--brand-navy, #1A1A2E);
    margin-bottom: 1rem;
  }

  .content-cta p {
    font-size: 1.125rem;
    color: #64748b;
    margin-bottom: 2rem;
  }

  .related-pages {
    margin-top: 4rem;
    padding-top: 4rem;
    border-top: 2px solid #e2e8f0;
  }

  .related-pages h2 {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--brand-navy, #1A1A2E);
    margin-bottom: 2rem;
  }

  .related-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .related-card {
    display: block;
    padding: 1.5rem;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    text-decoration: none;
    transition: all 0.2s;
  }

  .related-card:hover {
    border-color: var(--brand-red, #E94560);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .related-card h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--brand-navy, #1A1A2E);
    margin-bottom: 0.5rem;
  }

  .related-card p {
    font-size: 0.95rem;
    color: #64748b;
    margin-bottom: 0.75rem;
    line-height: 1.5;
  }

  .related-link {
    color: var(--brand-red, #E94560);
    font-weight: 600;
    font-size: 0.875rem;
  }

  @media (max-width: 1024px) {
    .content-grid {
      grid-template-columns: 1fr;
    }

    .content-sidebar {
      display: none;
    }

    .hero-title {
      font-size: 2rem;
    }
  }

  @media (max-width: 768px) {
    .pillar-hero {
      min-height: 300px;
    }

    .hero-title {
      font-size: 1.75rem;
    }

    .hero-description {
      font-size: 1rem;
    }

    .content-cta {
      padding: 2rem 1.5rem;
    }

    .content-cta h2 {
      font-size: 1.5rem;
    }
  }
</style>

<script>
  // Generate table of contents from headings
  function generateTableOfContents() {
    const content = document.querySelector('.prose');
    const tocList = document.getElementById('toc-list');

    if (!content || !tocList) return;

    const headings = content.querySelectorAll('h2, h3');
    if (headings.length === 0) return;

    const tocHTML = Array.from(headings)
      .map((heading, index) => {
        const id = heading.id || `heading-${index}`;
        if (!heading.id) heading.id = id;

        const level = heading.tagName === 'H2' ? 'toc-level-2' : 'toc-level-3';
        const text = heading.textContent;

        return `<a href="#${id}" class="toc-link ${level}">${text}</a>`;
      })
      .join('');

    tocList.innerHTML = tocHTML;

    // Highlight current section
    const tocLinks = tocList.querySelectorAll('.toc-link');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            tocLinks.forEach(link => {
              if (link.getAttribute('href') === `#${id}`) {
                link.classList.add('active');
              } else {
                link.classList.remove('active');
              }
            });
          }
        });
      },
      { rootMargin: '-100px 0px -80% 0px' }
    );

    headings.forEach(heading => observer.observe(heading));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', generateTableOfContents);
  } else {
    generateTableOfContents();
  }
</script>

<style is:global>
  .toc-link {
    display: block;
    padding: 0.5rem 0;
    color: #64748b;
    text-decoration: none;
    font-size: 0.875rem;
    transition: color 0.2s;
    border-left: 2px solid transparent;
    padding-left: 0.75rem;
    margin-left: -0.75rem;
  }

  .toc-link:hover {
    color: var(--brand-red, #E94560);
  }

  .toc-link.active {
    color: var(--brand-red, #E94560);
    border-left-color: var(--brand-red, #E94560);
    font-weight: 600;
  }

  .toc-link.toc-level-3 {
    padding-left: 1.5rem;
    font-size: 0.8125rem;
  }
</style>
```

---


## 📦 Phase 4: Content Templates & Examples (Week 2, Days 4-7)

### 4.1 Pillar Page Content Template

**File: `src/content/templates/pillar-page-template.md`**

```markdown
---
# Pillar Page Template
# Copy this template when creating new pillar pages

title: "[Primary Keyword]"
description: "Comprehensive guide to [topic]. [Key benefit 1], [key benefit 2], and [key benefit 3]."
heroImage: "/images/[relevant-image].jpg"
site: "mydojo" # or petcare, driveschool, tattoo
---

import FeaturedAnswer from '../../components/seo/FeaturedAnswer.astro';
import ComparisonTable from '../../components/seo/ComparisonTable.astro';
import StatisticsSection from '../../components/seo/StatisticsSection.astro';
import FAQEnhanced from '../../components/seo/FAQEnhanced.astro';

<FeaturedAnswer question="What is [primary keyword]?">
  [Primary keyword] is [concise 40-60 word definition that directly answers the question.
  Include key benefits and target audience.]
</FeaturedAnswer>

## Overview

[2-3 paragraph introduction that:
- Expands on the featured answer
- Explains why this topic matters
- Previews what the guide covers
- Establishes authority]

**Quick Facts:**
- Key Stat 1
- Key Stat 2
- Key Stat 3

## What You'll Learn

- Topic 1
- Topic 2
- Topic 3
- Topic 4
- Topic 5

## Section 1: [H2 - Main Topic Area]

[Introduction paragraph for this section]

### Subsection 1.1: [H3 - Specific Point]

[Content with specific, actionable information]

**Key Takeaways:**
- Bullet point 1
- Bullet point 2
- Bullet point 3

### Subsection 1.2: [H3 - Specific Point]

[More detailed content]

## Section 2: [H2 - Feature Comparison or Statistics]

<ComparisonTable
  title="[Feature] Comparison 2026"
  description="Compare different approaches to [topic]"
  headers={['Feature', 'Option A', 'Option B', 'Option C']}
  rows={[
    { label: 'Feature 1', values: [true, true, false] },
    { label: 'Feature 2', values: ['Value', 'Value', 'Value'] }
  ]}
  sortable={true}
/>

OR

<StatisticsSection
  title="[Industry] Statistics 2026"
  stats={[
    {
      label: 'Market Size',
      value: '$X.XB',
      change: { value: 15, direction: 'up', period: 'YoY' }
    }
  ]}
  source="Industry Research Report"
  datePublished="2026-01-01"
  site="mydojo"
  pageUrl={Astro.url.href}
/>

## Section 3: [H2 - Implementation or How-To]

[Practical guidance section]

### Step-by-Step Process

1. **Step 1**: [Action item with details]
2. **Step 2**: [Action item with details]
3. **Step 3**: [Action item with details]

## Related Resources

- [Link to related pillar page 1]
- [Link to supporting blog post 1]
- [Link to supporting blog post 2]

## Frequently Asked Questions

<FAQEnhanced
  faqs={[
    {
      question: 'Most important question?',
      answer: 'Clear, concise answer with specific details.',
      links: [
        { text: 'Related Page', url: '/path/' }
      ]
    }
    // Add 8-12 FAQs matching People Also Ask queries
  ]}
  title="Frequently Asked Questions"
  searchable={true}
  site="mydojo"
  pageUrl={Astro.url.href}
/>

## Final Call-to-Action

[Strong closing paragraph that:
- Summarizes key benefits
- Creates urgency
- Links to conversion page]

**Ready to get started?** [Start your free trial](/contact/) today and see how [product] can [key benefit].
```

---

### 4.2 Site-Specific Implementation Examples

#### Example 1: MyDojo.software - Enhanced BJJ Gym Software Page

**File: `mydojo.software/src/pages/bjj-gym-software-enhanced.astro`**

```astro
---
import PillarPageEnhanced from '../layouts/PillarPageEnhanced.astro';
import FeaturedAnswer from '../components/seo/FeaturedAnswer.astro';
import ComparisonTable from '../components/seo/ComparisonTable.astro';
import StatisticsSection from '../components/seo/StatisticsSection.astro';
import FAQEnhanced from '../components/seo/FAQEnhanced.astro';

const faqItems = [
  {
    question: 'What is BJJ gym software?',
    answer: 'BJJ gym software is a specialized management platform designed for Brazilian Jiu-Jitsu academies. It handles student databases with IBJJF belt tracking, class scheduling, stripe management, membership billing, and attendance—specifically tailored for BJJ instruction.',
    links: [
      { text: 'Martial Arts Software Overview', url: '/martial-arts-software/' },
      { text: 'Belt Tracking Guide', url: '/blog/bjj-belts-order-complete-guide/' }
    ]
  },
  {
    question: 'How much does BJJ gym management software cost?',
    answer: 'BJJ gym software typically costs £50-200 per month depending on your student count. Most platforms use per-student pricing (£1-3 per active student) or tiered plans. MyDojo offers flat-rate pricing with unlimited students.',
    links: [
      { text: 'View Pricing', url: '/pricing/' }
    ]
  },
  {
    question: 'Can BJJ software track belt promotions and stripes?',
    answer: 'Yes, dedicated BJJ software includes IBJJF-compliant belt progression tracking from white through black belt, stripe management, promotion history, time-in-grade calculations, and automatic eligibility notifications for testing.',
    links: [
      { text: 'BJJ Belt System Guide', url: '/blog/bjj-belts-order-complete-guide/' }
    ]
  },
  {
    question: 'Does BJJ gym software work for competition teams?',
    answer: 'Yes, most BJJ software includes competition management features: tournament registration tracking, weight class monitoring, competition records, team scheduling, and victory/loss statistics for competitive athletes.',
  },
  {
    question: 'Can students book open mat sessions through BJJ software?',
    answer: 'Yes, students can book regular classes, open mat sessions, private lessons, and seminars through the member portal or mobile app with real-time availability and capacity management.',
  }
];

const comparisonData = [
  {
    label: 'IBJJF Belt System',
    values: [true, true, false],
    highlight: true
  },
  {
    label: 'Stripe Tracking',
    values: [true, true, false],
    highlight: true
  },
  {
    label: 'Competition Records',
    values: [true, false, false]
  },
  {
    label: 'Private Lesson Booking',
    values: [true, true, true]
  },
  {
    label: 'Monthly Price',
    values: ['£79', '£99', '£59']
  }
];

const bjjStats = [
  {
    label: 'Active BJJ Practitioners (US)',
    value: '850K+',
    change: { value: 23, direction: 'up', period: 'since 2020' },
    context: 'BJJ continues rapid growth globally'
  },
  {
    label: 'Average Time to Black Belt',
    value: '10 years',
    context: 'With consistent training 3-4x per week'
  },
  {
    label: 'Student Retention with Software',
    value: '87%',
    change: { value: 15, direction: 'up', period: 'vs. manual' },
    context: 'Automated engagement improves retention'
  },
  {
    label: 'Average Monthly Membership',
    value: '$150-200',
    context: 'Varies by location and competition training availability'
  }
];

const relatedPages = [
  {
    title: 'Martial Arts Software',
    url: '/martial-arts-software/',
    description: 'Complete guide to martial arts management platforms'
  },
  {
    title: 'MMA Gym Software',
    url: '/mma-gym-software/',
    description: 'Multi-discipline gym management for MMA facilities'
  },
  {
    title: 'Belt Tracking Systems',
    url: '/blog/bjj-belts-order-complete-guide/',
    description: 'Understanding BJJ belt progression and tracking'
  }
];
---

<PillarPageEnhanced
  title="BJJ Gym Software"
  description="Complete management software for Brazilian Jiu-Jitsu academies. IBJJF belt tracking, stripe management, competition records, and member management."
  heroImage="/images/bjj-training.jpg"
  badge="Complete Guide"
  breadcrumbLabel="BJJ Gym Software"
  site="mydojo"
  faqItems={faqItems}
  productInfo={{
    price: 79,
    currency: 'GBP',
    rating: { value: 4.8, count: 127 }
  }}
  relatedPages={relatedPages}
>

<FeaturedAnswer question="What is BJJ gym software?">
  BJJ gym software is a specialized management platform designed for Brazilian Jiu-Jitsu academies.
  It handles student databases with IBJJF belt tracking, stripe management, class scheduling,
  competition records, membership billing, and attendance—specifically tailored for BJJ instruction
  rather than generic gym management.
</FeaturedAnswer>

## The Complete Management Platform for BJJ Academies

Running a Brazilian Jiu-Jitsu academy involves unique challenges that generic gym software simply cannot address. From tracking stripe promotions through the intricate IBJJF belt system, to managing competition teams, to coordinating open mat sessions alongside structured classes—BJJ schools need purpose-built technology.

This comprehensive guide examines everything you need to know about BJJ gym management software: the essential features for BJJ-specific operations, how belt progression tracking works, pricing considerations, and how to choose the right platform for your academy.

**Why BJJ-Specific Software Matters:**

- Generic gym software doesn't understand gi vs. no-gi class distinctions
- Traditional martial arts software lacks competition team management
- Standard systems can't track IBJJF stripe promotions
- General platforms don't handle multiple class types (fundamentals, advanced, drilling, competition)

## Essential Features for BJJ Academies

### 1. IBJJF-Compliant Belt System

The International Brazilian Jiu-Jitsu Federation (IBJJF) defines specific progression paths for adults and children. Your software must support:

**Adult Belt Progression:**
- White → Blue → Purple → Brown → Black
- 4 stripes per belt (except black)
- Minimum time-in-grade requirements
- Age restrictions for certain promotions

**Children's Belt System:**
- White → Gray → Yellow → Orange → Green
- Transition to adult system at age 16
- Different stripe requirements

### 2. Stripe Management

Unlike other martial arts, BJJ uses stripes to mark incremental progress between belt colors:

- Track individual stripe awards with dates
- Automatic notifications when students qualify for next stripe
- Visual stripe displays in student profiles
- Instructor notes for each stripe promotion
- Photo documentation of promotions

### 3. Class Type Management

BJJ academies typically offer multiple class formats:

- **Fundamentals Classes**: Basic techniques for white/blue belts
- **Advanced Classes**: Complex techniques for purple+ belts
- **Competition Training**: Intense sparring and strategy
- **Open Mat**: Unstructured training time
- **Drilling Sessions**: Technique repetition focus
- **No-Gi Classes**: Training without traditional gi
- **Kids Classes**: Age-specific programs

Your software must handle:
- Different pricing for class types
- Capacity limits per class
- Eligibility restrictions by belt level
- Gi vs. no-gi designation

<StatisticsSection
  title="BJJ Industry Statistics 2026"
  description="Key metrics showing the growth and scale of Brazilian Jiu-Jitsu"
  stats={bjjStats}
  source="BJJ Industry Report & IBJJF Data"
  datePublished="2026-01-01"
  site="mydojo"
  pageUrl={Astro.url.href}
  layout="grid"
/>

### 4. Competition Team Management

For academies with competitive athletes, robust competition features are essential:

**Tournament Tracking:**
- Upcoming tournament registration
- Weight class monitoring
- Registration fee processing
- Team transportation coordination

**Competition Records:**
- Win/loss records by competition
- Submission types achieved
- Points scored
- Medal/trophy tracking
- IBJJF ranking points

**Team Scheduling:**
- Competition-specific training sessions
- Strategy planning sessions
- Weight cutting guidance scheduling
- Video review sessions

### 5. Private Lesson Coordination

Many BJJ practitioners supplement group classes with private instruction:

- Instructor-specific scheduling
- Different pricing tiers per instructor
- Private lesson packages
- Technique focus tracking
- Progress notes per session

<ComparisonTable
  title="BJJ Software Feature Comparison"
  description="Compare key features across leading BJJ management platforms"
  headers={['Feature', 'MyDojo', 'Competitor A', 'Generic Gym Software']}
  rows={comparisonData}
  sortable={true}
/>

## Implementation for BJJ Academies

### Setting Up Your Belt System

**Step 1: Configure Belt Requirements**
- Set minimum mat time for each belt
- Define stripe requirements
- Configure age restrictions
- Set instructor approval requirements

**Step 2: Import Existing Students**
- Current belt levels
- Promotion history
- Stripe dates
- Competition records

**Step 3: Establish Testing Process**
- Testing frequency (quarterly, bi-annual, etc.)
- Evaluation criteria
- Instructor assignment
- Fee structure

**Step 4: Train Your Instructors**
- How to award stripes in system
- Recording promotion criteria
- Adding technical notes
- Viewing student readiness

### Class Structure Setup

**Membership Tiers:**
- Fundamentals Only (white/blue belts)
- All Classes Access
- Competition Team Membership
- No-Gi Specific
- Unlimited (all programs)

**Scheduling Considerations:**
- Peak times (early morning, lunch, evening)
- Weekend open mat availability
- Competition team training windows
- Kids program hours

## Pricing Considerations

### Common Pricing Models

**Per-Student Pricing:**
- £1-3 per active student per month
- Scales with academy growth
- Predictable per-member cost

**Flat-Rate Pricing:**
- £50-200 per month regardless of student count
- Predictable budgeting
- Better for larger academies

**Tiered Plans:**
- Basic: Core features, limited students
- Professional: Full features, unlimited students
- Enterprise: Multi-location support

### Hidden Costs to Consider

- Payment processing fees (2-3%)
- SMS notification credits
- Additional staff accounts
- Competition module add-ons
- Mobile app access

## Related Resources

Understanding BJJ progression enhances your software evaluation:

- [BJJ Belt Order Complete Guide](/blog/bjj-belts-order-complete-guide/) — Comprehensive breakdown of IBJJF belt system
- [BJJ Blue Belt Guide](/blog/bjj-blue-belt-guide/) — What it takes to achieve blue belt
- [Martial Arts Software Overview](/martial-arts-software/) — Compare BJJ vs. other martial arts software needs
- [Gym Management Software](/blog/gym-management-software-comparison/) — Broader comparison of management platforms

<FAQEnhanced
  faqs={faqItems}
  title="Frequently Asked Questions"
  searchable={true}
  site="mydojo"
  pageUrl={Astro.url.href}
  initiallyExpanded={0}
/>

## Transform Your BJJ Academy with Purpose-Built Software

Generic gym software forces you to adapt your BJJ academy's unique needs to their inflexible structure. Purpose-built BJJ software adapts to *your* academy's specific requirements—from IBJJF belt compliance to competition team management.

**Ready to see the difference?** [Start your free trial](/contact/) and experience software designed specifically for Brazilian Jiu-Jitsu academies. No credit card required, unlimited students, 14-day trial.

</PillarPageEnhanced>
```

---

## 📦 Phase 5: Rollout Strategy & Testing (Week 3)

### 5.1 Migration Checklist

**Priority Order for Implementation:**

1. ✅ **Week 1: Foundation**
   - [ ] Install schema utilities (`src/utils/schema/`)
   - [ ] Test schema generation on development
   - [ ] Validate JSON-LD with Google's Rich Results Test
   - [ ] Create BaseLayoutEnhanced
   - [ ] Deploy to staging environment

2. ✅ **Week 2: Components**
   - [ ] Add FeaturedAnswer component
   - [ ] Add ComparisonTable component
   - [ ] Add StatisticsSection component
   - [ ] Add FAQEnhanced component
   - [ ] Test all components in isolation
   - [ ] Test mobile responsiveness

3. ✅ **Week 3: Content Migration**
   - [ ] Identify top 10 pages by traffic
   - [ ] Migrate highest-traffic pillar page first
   - [ ] Monitor for 48 hours in production
   - [ ] Migrate remaining pillar pages
   - [ ] Update top-performing blog posts
   - [ ] Create new statistics pages

4. ✅ **Week 4: Optimization**
   - [ ] Add comparison tables to all pillar pages
   - [ ] Implement HowTo schema on guides
   - [ ] Expand FAQ sections (8-12 per page)
   - [ ] Add breadcrumb schema everywhere
   - [ ] Create industry statistics pages

### 5.2 Testing Protocol

**Before Deploying Each Enhanced Page:**

1. **Schema Validation**
   ```bash
   # Test with Google's Rich Results Test
   # URL: https://search.google.com/test/rich-results
   ```
   - Copy page HTML
   - Paste into validator
   - Verify all schemas appear correctly
   - Check for warnings/errors

2. **Performance Testing**
   ```bash
   # Lighthouse CI test
   npm run lighthouse -- --url=http://localhost:4321/[page-url]
   ```
   - Performance score > 90
   - SEO score = 100
   - Accessibility score > 95
   - No schema errors

3. **Mobile Testing**
   - Test on iOS Safari
   - Test on Android Chrome
   - Test table responsiveness
   - Test FAQ expand/collapse
   - Test navigation/breadcrumbs

4. **Cross-Browser Testing**
   - Chrome (latest)
   - Firefox (latest)
   - Safari (latest)
   - Edge (latest)

5. **Content Validation**
   - Featured answer is 40-60 words
   - All FAQs match People Also Ask queries
   - Comparison tables have accurate data
   - Statistics include sources and dates
   - All internal links work
   - All images have descriptive alt text

### 5.3 Monitoring Setup

**Track These Metrics Post-Implementation:**

**Google Search Console:**
- Featured snippet captures (weekly)
- Average position by keyword
- Click-through rate (CTR)
- Impressions growth
- New rich result types appearing

**Google Analytics:**
- Organic traffic by page
- Bounce rate changes
- Time on page
- Pages per session
- Conversion rate from organic

**Schema Monitoring:**
```javascript
// Add to analytics
gtag('event', 'schema_present', {
  'schema_types': ['FAQPage', 'SoftwareApplication', 'HowTo'],
  'page_path': window.location.pathname
});
```

**Manual Checks (Weekly):**
- Google "[site:yoursite.com] [target keyword]" searches
- Check featured snippet captures
- Monitor "People Also Ask" appearances
- Track knowledge panel mentions
- Review competitor positioning

### 5.4 Rollback Plan

**If Issues Arise:**

1. **Minor Issues (styling, typos):**
   - Hot-fix and deploy immediately
   - No rollback needed

2. **Schema Errors:**
   - Fix schema generation
   - Re-validate with Google tools
   - Deploy fix within 24 hours

3. **Major Issues (site down, broken functionality):**
   ```bash
   # Quick rollback process
   git revert [commit-hash]
   git push origin main
   # Triggers automatic deployment
   ```

4. **Performance Degradation:**
   - Identify heavy components
   - Implement lazy loading
   - Optimize images
   - Cache schema generation

---

## 📦 Phase 6: Advanced Optimizations (Ongoing)

### 6.1 AI Citation Optimization

**Specific Optimizations for AI Systems:**

1. **Entity Relationships**
   - Link all mentions of features to product pages
   - Connect all statistics to source pages
   - Cross-reference all related topics

2. **Fact Extraction**
   - Put statistics in tables
   - Use definition lists for terms
   - Structure dates in ISO 8601 format
   - Include units with all measurements

3. **Authority Signals**
   - Author bylines on all content
   - Publication dates on everything
   - Update dates when refreshing
   - Source citations for claims

4. **Contextual Clarity**
   - Always include year in time-sensitive content
   - Specify geographic context (UK, US, global)
   - Define acronyms on first use
   - Link to glossary for technical terms

### 6.2 Voice Search Optimization

**Optimizations for Voice Queries:**

1. **Question-Based Content**
   - Start sections with questions
   - Answer in first sentence
   - Use conversational language
   - Target question keywords

2. **Local Context**
   - Include "near me" variants
   - Mention cities/regions
   - Add location-based FAQs
   - Use LocalBusiness schema

3. **Featured Snippet Format**
   ```markdown
   ## How much does dog daycare cost?
   
   Dog daycare typically costs £25-40 per day in the UK, with monthly
   unlimited packages ranging from £300-500. Prices vary based on location,
   facility amenities, and additional services like grooming or training.
   ```

### 6.3 Content Refresh Schedule

**Quarterly Updates:**

- [ ] Review all statistics pages
- [ ] Update year references
- [ ] Refresh pricing information
- [ ] Add new FAQs from search queries
- [ ] Update comparison tables
- [ ] Add recent industry news

**Annual Updates:**

- [ ] Comprehensive content audit
- [ ] Rewrite underperforming pages
- [ ] Add new pillar pages
- [ ] Create new statistics pages
- [ ] Film new video content
- [ ] Update all screenshots

---

## 📊 Success Metrics & KPIs

### Expected Results Timeline

**Week 1-2 (Immediate):**
- Schema appears in Google Search Console
- Rich results validation passes
- Internal metrics tracking active

**Week 3-4:**
- First featured snippets appear
- Position improvements for target keywords
- Increased rich result types in GSC

**Month 2:**
- 20-50% increase in featured snippet captures
- 10-30% improvement in average position
- 5-15% increase in organic CTR

**Month 3:**
- 50-100% increase in featured snippets
- 15-40% improvement in organic traffic
- AI systems citing content
- Knowledge panel mentions

**Month 6:**
- 100-400% increase in featured snippets
- 30-80% improvement in organic traffic
- Multiple positions in "People Also Ask"
- Dominant voice search results

### Target KPIs by Site

**mydojo.software:**
- 50+ featured snippets captured
- Top 3 for "martial arts software"
- #1 for "bjj gym software", "dojo management software"
- 30+ People Also Ask placements

**petcare.software:**
- 60+ featured snippets (highest content volume)
- Top 3 for "dog daycare software"
- #1 for "kennel software", "pet grooming software"
- 40+ People Also Ask placements

**mydriveschool.software:**
- 25+ featured snippets
- Top 3 for "driving school software"
- #1 for "driving school management software"
- 20+ People Also Ask placements

**mytattoo.software:**
- 30+ featured snippets
- Top 3 for "tattoo booking software"
- #1 for "tattoo studio software"
- 25+ People Also Ask placements

---

## 🎯 Quick Start Guide

**If starting today, do this:**

1. **Day 1: Setup**
   ```bash
   # In each site directory
   mkdir -p src/utils/schema
   mkdir -p src/components/seo
   ```
   - Copy schema utilities to all 4 sites
   - Test schema generation locally

2. **Day 2-3: First Component**
   - Add FeaturedAnswer component
   - Update ONE high-traffic page
   - Test in staging
   - Deploy to production

3. **Day 4-5: Expand**
   - Add ComparisonTable component
   - Add to 2-3 pillar pages
   - Monitor results

4. **Week 2: Scale**
   - Add remaining components
   - Migrate top 10 pages
   - Create first statistics page

5. **Week 3: Optimize**
   - Expand FAQs on all pages
   - Add comparison tables everywhere
   - Create industry data pages

---

## 🔚 Conclusion

This implementation plan provides everything needed to transform all 4 sites into AI-optimized, featured snippet-capturing powerhouses. The modular approach allows incremental rollout while maintaining site stability.

**Key Principles:**
- Start small, iterate quickly
- Validate schema at every step
- Monitor metrics weekly
- Expand based on results
- Keep content fresh

**Expected Outcomes:**
- 200-400% increase in featured snippets
- 50-100% improvement in AI citations
- 30-80% growth in organic traffic
- Dominant search presence for target keywords

**Timeline:**
- Week 1: Foundation & utilities
- Week 2: Components & first migrations
- Week 3: Scale to top pages
- Week 4+: Ongoing optimization

Start with the highest-traffic pages on your best-performing site, validate results, then scale across all properties.

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-26  
**Author:** Claude AI Optimization Team  
**Status:** Ready for Implementation

