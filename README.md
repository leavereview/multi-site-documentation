# Multi-Site Static Hosting Project

> **Status:** Production - 4 sites deployed and optimized for performance

## 🌐 Overview

This workspace contains 4 high-performance static Astro sites sharing a common architecture, design system, and deployment pipeline. All sites deploy to a single Lightsail server via GitHub Actions.

## 📁 Sites

| Folder | Domain | Deploy Path | Status |
|--------|--------|-------------|--------|
| mydojo.software | [mydojo.software](https://mydojo.software) | /var/www/mydojo.software/ | ✅ Live |
| petcare.software | [petcare.software](https://petcare.software) | /var/www/petcare.software/ | ✅ Live |
| mydriveschool.software | [mydriveschool.software](https://mydriveschool.software) | /var/www/mydriveschool.software/ | ✅ Live |
| mytattoo.software | [mytattoo.software](https://mytattoo.software) | /var/www/mytattoo.software/ | ✅ Live |

## 🚀 Quick Start

### Development

```bash
# Navigate to any site
cd mydojo.software

# Install dependencies
npm install

# Start dev server (http://localhost:4321)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Creating a New Site

1. **Copy the reference site structure:**
   ```bash
   cp -r mydojo.software/ newsite.software/
   cd newsite.software/
   ```

2. **Update configuration:**
   - `astro.config.mjs` - Change site URL
   - `package.json` - Update name and description
   - `src/layouts/BaseLayout.astro` - Update branding, GA ID, schema.org data
   - `src/components/Navigation.astro` - Update menu links
   - `src/components/Footer.astro` - Update footer content
   - `tailwind.config.mjs` - Verify brand colors (or customize)

3. **Clean up content:**
   - Replace pages in `src/pages/`
   - Update blog posts in `src/content/blog/`
   - Replace images in `public/images/`
   - Update favicon and logo in `public/`

4. **Initialize repository:**
   ```bash
   rm -rf .git
   git init
   git add .
   git commit -m "Initial commit for newsite.software"
   ```

5. **Set up GitHub repo and deployment:**
   - Create GitHub repo
   - Add remote: `git remote add origin <repo-url>`
   - Push: `git push -u origin main`
   - Add GitHub secrets (see Deployment section)

6. **Configure server:**
   ```bash
   ssh lightsail
   sudo mkdir -p /var/www/newsite.software
   sudo chown ubuntu:ubuntu /var/www/newsite.software
   sudo nano /etc/nginx/sites-available/newsite.software
   # Copy config from existing site, update domain
   sudo ln -s /etc/nginx/sites-available/newsite.software /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## 🏗️ Architecture

### Tech Stack

- **Astro 5.x** - Static site generator with zero JS by default
- **Tailwind CSS 3.x** - Utility-first styling
- **TypeScript** - Type safety
- **astro-compress** - Asset optimization and minification

### Project Structure

```
{site}/
├── src/
│   ├── pages/              # .astro pages → routes (file-based routing)
│   │   ├── index.astro     # Homepage
│   │   ├── about.astro     # About page
│   │   ├── pricing.astro   # Pricing page
│   │   ├── contact.astro   # Contact page
│   │   └── blog/
│   │       ├── index.astro # Blog listing
│   │       └── [slug].astro # Dynamic blog posts
│   ├── layouts/
│   │   ├── BaseLayout.astro        # Main layout with SEO
│   │   └── PillarPageLayout.astro  # SEO pillar page layout
│   ├── components/
│   │   ├── Navigation.astro
│   │   ├── Footer.astro
│   │   ├── CookieConsent.astro
│   │   └── seo/            # SEO enhancement components
│   ├── content/
│   │   ├── blog/           # Markdown blog posts
│   │   └── config.ts       # Content collection schemas
│   ├── styles/
│   │   └── global.css      # Tailwind + custom components
│   └── utils/
│       ├── internalLinks.ts
│       └── schema/         # Schema.org utilities
├── public/
│   ├── images/             # Static images
│   ├── favicon.svg
│   ├── logo.svg
│   └── robots.txt
├── astro.config.mjs        # Astro configuration
├── tailwind.config.mjs     # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── package.json
```

## 🎨 Design System

All sites share a consistent design language for brand cohesion.

### Colors

```javascript
// tailwind.config.mjs
colors: {
  'brand-navy': '#1A1A2E',       // Primary dark
  'brand-red': '#E94560',        // Accent/CTA
  'brand-red-dark': '#D63851',   // Hover state
  'brand-red-light': '#FFE7EC',  // Light backgrounds
}
```

### Typography

- **Font:** Inter (Google Fonts)
- **Weights:** 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Loading:** Async to prevent render-blocking

### CSS Component Classes

Defined in `src/styles/global.css`:

```css
/* Buttons */
.btn-primary      /* Red CTA button */
.btn-secondary    /* White outlined button */
.btn-outline      /* Transparent with red border */

/* Containers */
.container-custom /* Max-width centered container */
.card             /* White card with shadow */

/* Layout */
.section          /* Standard section padding (py-16 md:py-24) */

/* Forms */
.input            /* Text input styling */

/* Typography */
.prose            /* Blog post content styling */

/* Badges */
.badge-primary    /* Red badge */
.badge-navy       /* Navy badge */
```

### Usage Example

```astro
<section class="section bg-gray-50">
  <div class="container-custom">
    <div class="grid md:grid-cols-3 gap-6">
      <div class="card">
        <h3 class="text-xl font-bold text-brand-navy mb-4">Feature</h3>
        <p class="text-gray-600 mb-6">Description</p>
        <a href="/learn-more/" class="btn-primary">Learn More</a>
      </div>
    </div>
  </div>
</section>
```

## ⚡ Performance Optimizations

All sites are optimized for 90+ PageSpeed Insights scores.

### Implemented Optimizations

1. **File Compression** (astro-compress)
   - HTML minification: ~4% size reduction
   - CSS/JS minification: Automatic
   - SVG optimization: ~14% reduction

2. **Font Loading**
   ```html
   <!-- Async loading eliminates render-blocking -->
   <link href="..." rel="stylesheet" media="print" onload="this.media='all'" />
   ```

3. **Resource Hints**
   ```html
   <!-- DNS prefetch for faster external connections -->
   <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
   <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
   <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
   ```

4. **Image Optimization**
   - Lazy loading: `loading="lazy"` on all images
   - Dimensions: Explicit `width` and `height` to prevent CLS
   - Formats: JPG optimized, WebP versions available

5. **CSS Optimization**
   - Critical CSS inlined automatically
   - Tailwind purges unused styles
   - Code splitting for better caching

6. **JavaScript**
   - Minimal JS (only mobile menu toggle)
   - Google Analytics lazy-loaded after consent
   - Prefetch on hover for instant navigation

### Image Optimization Script

```bash
# Install tools (one time)
brew install jpegoptim webp

# Optimize images for a new site
./optimize-images.sh

# Or manually for a specific site:
cd newsite.software/public/images

# Compress JPGs
find . -name "*.jpg" -exec jpegoptim --size=150k --strip-all {} \;

# Create WebP versions
find . -name "*.jpg" -exec sh -c 'cwebp -q 85 "$1" -o "${1%.jpg}.webp"' _ {} \;
```

### Expected Performance Scores

- **Performance:** 90-100
- **Accessibility:** 95-100
- **Best Practices:** 95-100
- **SEO:** 95-100

### Core Web Vitals Targets

- **LCP** (Largest Contentful Paint): < 2.5s
- **FID/INP** (Interactivity): < 100ms / < 200ms
- **CLS** (Cumulative Layout Shift): < 0.1

## 🔧 Configuration Files

### astro.config.mjs

```javascript
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import compress from 'astro-compress';

export default defineConfig({
  site: 'https://yoursite.software',
  integrations: [
    tailwind(),
    sitemap(),
    compress({
      CSS: true,
      HTML: {
        'html-minifier-terser': {
          removeAttributeQuotes: false,
          collapseWhitespace: true,
          removeComments: true,
        }
      },
      Image: false,
      JavaScript: true,
      SVG: true,
    })
  ],
  build: {
    inlineStylesheets: 'auto',
    assets: '_astro'
  },
  vite: {
    build: {
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: undefined,
        }
      }
    }
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover'
  }
});
```

### package.json

```json
{
  "name": "yoursite-static",
  "type": "module",
  "version": "1.0.0",
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "@astrojs/check": "^0.9.2",
    "@astrojs/sitemap": "^3.2.1",
    "@astrojs/tailwind": "^5.1.3",
    "astro": "^5.16.15",
    "astro-compress": "^2.3.1",
    "tailwindcss": "^3.4.16",
    "typescript": "^5.7.2"
  }
}
```

## 🚢 Deployment

### Server Setup

**Server:** AWS Lightsail Ubuntu 24.04
**IP:** 13.43.71.165
**SSH:** `ssh lightsail`

### GitHub Actions Workflow

Each site auto-deploys on push to `main` branch.

**Required GitHub Secrets:**

```yaml
SSH_PRIVATE_KEY    # Deploy key for server access
REMOTE_HOST        # 13.43.71.165
SITE_DOMAIN        # e.g., mydojo.software
```

**Workflow file:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to Lightsail

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - run: npm ci
      - run: npm run build

      - name: Deploy to server
        uses: easingthemes/ssh-deploy@v2.1.5
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
          REMOTE_USER: ubuntu
          SOURCE: "dist/"
          TARGET: "/var/www/${{ secrets.SITE_DOMAIN }}/"
```

### Manual Deployment

```bash
cd yoursite.software
npm run build
rsync -avz --delete dist/ ubuntu@13.43.71.165:/var/www/yoursite.software/
```

### Nginx Configuration

**Location:** `/etc/nginx/sites-available/{domain}`

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yoursite.software www.yoursite.software;

    root /var/www/yoursite.software;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/javascript application/javascript application/json application/xml+rss application/xml image/svg+xml;

    # Browser caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|webp|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ =404;
    }

    # Redirect www to non-www
    if ($host = www.yoursite.software) {
        return 301 https://yoursite.software$request_uri;
    }
}
```

**Apply configuration:**

```bash
sudo ln -s /etc/nginx/sites-available/yoursite.software /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL Certificates

```bash
sudo certbot --nginx -d yoursite.software -d www.yoursite.software
```

## 📝 Content Management

### Blog Posts

Blog posts are Markdown files in `src/content/blog/`.

**File structure:**

```
src/content/blog/
├── my-post.md
├── another-post.md
└── third-post.md
```

**Frontmatter schema:**

```yaml
---
title: "Your Blog Post Title"
description: "A compelling description for SEO"
publishedDate: 2026-01-26
image: "/images/blog/post-image.jpg"
tags: ["tag1", "tag2", "tag3"]
author: "Author Name"
---

Your markdown content here...
```

### SEO Best Practices

1. **Title Tags:**
   - Homepage: "Brand - What You Do"
   - Pages: "Page Title | Brand"
   - Max 60 characters

2. **Meta Descriptions:**
   - 150-160 characters
   - Include primary keyword
   - Include CTA

3. **Images:**
   - Always include alt text
   - Optimize before committing (< 150KB)
   - Use descriptive filenames

4. **URLs:**
   - Use hyphens, not underscores
   - Keep short and descriptive
   - Include target keyword

5. **Internal Links:**
   - Link to related content
   - Use descriptive anchor text
   - Use `internalLinks.ts` utility

### Schema.org Markup

Each site includes structured data for:

- **Organization** - Company info
- **WebSite** - Site structure
- **SoftwareApplication** - Product details
- **Article/BlogPosting** - Blog content
- **BreadcrumbList** - Navigation hierarchy
- **FAQPage** - FAQ sections

## 🔍 SEO & Analytics

### Google Analytics

GA4 is loaded conditionally based on cookie consent.

**Update GA ID:**

```astro
// src/layouts/BaseLayout.astro
gtag('config', 'G-YOUR-GA-ID');
```

### Sitemap

Auto-generated via `@astrojs/sitemap` at `/sitemap.xml`.

### Robots.txt

```
# public/robots.txt
User-agent: *
Allow: /
Sitemap: https://yoursite.software/sitemap.xml
```

## 🧪 Testing

### Local Testing

```bash
# Development
npm run dev

# Production build
npm run build
npm run preview
```

### Performance Testing

```bash
# After deployment
open "https://pagespeed.web.dev/analysis?url=https://yoursite.software"
```

### Accessibility Testing

```bash
# Install lighthouse
npm install -g @lhci/cli

# Run audit
lhci autorun --collect.url=http://localhost:4321
```

## 🐛 Troubleshooting

### Build Fails

```bash
# Clear cache and reinstall
rm -rf node_modules dist .astro
npm install
npm run build
```

### Deployment Not Working

1. Check GitHub Actions tab for errors
2. Verify secrets are set correctly
3. Test SSH: `ssh lightsail "ls /var/www/"`
4. Check server logs: `ssh lightsail "sudo tail -100 /var/log/nginx/error.log"`

### Site Shows Old Content

1. Clear browser cache (Cmd+Shift+R)
2. Check dist/ folder has new build
3. Verify rsync completed in GitHub Actions log
4. Check server file timestamps: `ssh lightsail "ls -lt /var/www/yoursite.software/ | head"`

### Performance Score Dropped

1. Run PageSpeed Insights
2. Check "Opportunities" section
3. Verify images are optimized
4. Check for new external scripts
5. Verify compression is enabled: `curl -I -H "Accept-Encoding: gzip" https://yoursite.software`

## 📚 Reference Sites

### Primary Reference: mydojo.software

Use this as the template for new sites:
- ✅ Latest performance optimizations
- ✅ Complete SEO implementation
- ✅ Full schema.org markup
- ✅ Cookie consent implementation
- ✅ Blog with content collections

### Legacy WordPress Sites

Original WordPress sites (for content extraction only):

| SSH Alias | Domain | IP | User |
|-----------|--------|-----|------|
| driveschool-wp | mydriveschool.software | 13.135.67.114 | bitnami |
| tattoo-wp | mytattoo.software | 3.9.13.136 | bitnami |
| petcare-wp | petcare.software | 18.171.175.199 | bitnami |

**WordPress file locations:**
- Document root: `/opt/bitnami/wordpress/`
- Uploads: `/opt/bitnami/wordpress/wp-content/uploads/`

## 📖 Additional Documentation

- **PERFORMANCE_OPTIMIZATION_GUIDE.md** - Detailed performance guide
- **PERFORMANCE_OPTIMIZATIONS_SUMMARY.md** - Overview of optimizations
- **DEPLOYMENT_SUMMARY.md** - Latest deployment details
- **CLAUDE.md** - Instructions for Claude Code AI
- Individual site `CLAUDE.md` files - Site-specific guidance

## 🛠️ Maintenance

### Monthly Tasks

- [ ] Update dependencies: `npm update`
- [ ] Test all sites on PageSpeed Insights
- [ ] Review analytics for performance issues
- [ ] Check for broken links
- [ ] Update blog content

### Quarterly Tasks

- [ ] Review and update pricing
- [ ] Audit SEO rankings
- [ ] Update screenshots/images
- [ ] Review competitor sites
- [ ] Update copyright year in footer

### Annual Tasks

- [ ] Renew SSL certificates (auto via certbot)
- [ ] Review and update content strategy
- [ ] Major dependency upgrades
- [ ] Server maintenance and updates

## 🤝 Contributing

When making changes:

1. **Test locally first:** `npm run build && npm run preview`
2. **Check for errors:** Build must succeed without warnings
3. **Test on mobile:** Use browser DevTools device emulation
4. **Verify performance:** Run Lighthouse before committing
5. **Write descriptive commits:** Follow conventional commit format
6. **Update documentation:** If architecture changes

## 📞 Support

### Common Commands

```bash
# Server access
ssh lightsail

# Check Nginx status
ssh lightsail "sudo systemctl status nginx"

# Reload Nginx
ssh lightsail "sudo systemctl reload nginx"

# View logs
ssh lightsail "sudo tail -f /var/log/nginx/access.log"
ssh lightsail "sudo tail -f /var/log/nginx/error.log"

# Check disk space
ssh lightsail "df -h"
```

### Useful Links

- [Astro Documentation](https://docs.astro.build/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Schema.org Documentation](https://schema.org/)
- [Google Search Console](https://search.google.com/search-console)

---

**Last Updated:** 2026-01-26
**Maintained By:** John (with Claude Code)
**Version:** 2.0 - Performance Optimized
