# Performance Optimization Guide

This document outlines all performance optimizations implemented across the four static Astro sites.

## Implemented Optimizations

### 1. Build Configuration

All sites now include in `astro.config.mjs`:

- **astro-compress**: Minifies HTML, CSS, JavaScript, and SVG
- **Sitemap generation**: Automatic XML sitemap for better SEO
- **CSS code splitting**: Splits CSS for better caching
- **Prefetch**: Hover-based prefetching for faster navigation

### 2. Font Optimization

Fonts load asynchronously to prevent blocking:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
      rel="stylesheet"
      media="print"
      onload="this.media='all'" />
<noscript>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet" />
</noscript>
```

### 3. Resource Hints

DNS prefetching for external resources:

```html
<meta http-equiv="x-dns-prefetch-control" content="on" />
<link rel="dns-prefetch" href="https://fonts.googleapis.com" />
<link rel="dns-prefetch" href="https://fonts.gstatic.com" />
<link rel="dns-prefetch" href="https://www.googletagmanager.com" />
```

### 4. Image Optimization

#### Current Implementation
- Added `loading="lazy"` to all images
- Added explicit `width` and `height` attributes to prevent layout shift
- Imported `astro:assets` Image component for future optimization

#### Required: Manual Image Optimization

The `about-founder.jpg` file is 1.3MB and other images are 200-300KB. Run this optimization script:

```bash
#!/bin/bash
# Image Optimization Script
# Run this in each site's public/images/ directory

# Install dependencies (one time)
# brew install imagemagick webp jpegoptim

# Optimize JPGs in place
find . -name "*.jpg" -exec jpegoptim --size=100k --strip-all {} \;

# Create WebP versions (modern format with better compression)
find . -name "*.jpg" -exec sh -c 'cwebp -q 85 "$1" -o "${1%.jpg}.webp"' _ {} \;

echo "Image optimization complete!"
```

#### To Convert Pages to Use Optimized Images

Replace `<img>` tags with Astro's Image component:

```astro
---
import { Image } from 'astro:assets';
import heroImage from '../public/images/hero.jpg';
---

<Image
  src={heroImage}
  alt="Description"
  width={600}
  height={400}
  format="webp"
  loading="lazy"
/>
```

### 5. CSS Delivery

- `inlineStylesheets: 'auto'` in Astro config automatically inlines critical CSS
- Tailwind CSS purges unused styles in production
- CSS is minified via astro-compress

### 6. Server-Side Compression

#### Nginx Configuration Required

Add to `/etc/nginx/nginx.conf` or in each site's server block:

```nginx
# Gzip Compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_comp_level 6;
gzip_types
  text/plain
  text/css
  text/javascript
  application/javascript
  application/json
  application/xml+rss
  application/xml
  application/xhtml+xml
  image/svg+xml
  image/x-icon;

# Brotli Compression (if available)
brotli on;
brotli_comp_level 6;
brotli_types
  text/plain
  text/css
  text/javascript
  application/javascript
  application/json
  application/xml+rss
  application/xml
  image/svg+xml;

# Browser Caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|webp|woff|woff2|ttf|eot)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

location ~* \.(html)$ {
  expires 1h;
  add_header Cache-Control "public, must-revalidate";
}
```

Apply changes:

```bash
ssh lightsail
sudo nano /etc/nginx/nginx.conf
# Add the configuration above
sudo nginx -t
sudo systemctl reload nginx
```

## Performance Checklist

### Before Deployment

- [ ] Run `npm run build` in each site directory
- [ ] Check build output for warnings or errors
- [ ] Verify dist/ folder size is reasonable

### Image Optimization (One Time)

- [ ] Run image optimization script on mydojo.software/public/images/
- [ ] Run image optimization script on petcare.software/public/images/
- [ ] Run image optimization script on mydriveschool.software/public/images/
- [ ] Run image optimization script on mytattoo.software/public/images/
- [ ] Commit optimized images to git

### Server Configuration (One Time)

- [ ] Update Nginx configuration on Lightsail server
- [ ] Test with `sudo nginx -t`
- [ ] Reload Nginx with `sudo systemctl reload nginx`
- [ ] Verify compression with browser DevTools

### Testing

After deployment, test each site with:

1. **PageSpeed Insights**: https://pagespeed.web.dev/
2. **WebPageTest**: https://www.webpagetest.org/
3. **GTmetrix**: https://gtmetrix.com/

### Expected Scores

With all optimizations:

- **Performance**: 90-100
- **Accessibility**: 95-100
- **Best Practices**: 95-100
- **SEO**: 95-100

## Maintenance

### When Adding New Images

1. Optimize before committing:
   ```bash
   jpegoptim --size=100k --strip-all image.jpg
   cwebp -q 85 image.jpg -o image.webp
   ```

2. Use in pages with lazy loading:
   ```html
   <img
     src="/images/image.jpg"
     alt="Description"
     loading="lazy"
     width="600"
     height="400"
   />
   ```

### When Adding New External Resources

Add DNS prefetch hints in BaseLayout.astro:
```html
<link rel="dns-prefetch" href="https://new-domain.com" />
```

## Troubleshooting

### Build Errors

If you see errors about image optimization:
```bash
rm -rf node_modules dist .astro
npm install
npm run build
```

### Images Not Loading

- Verify images exist in `public/images/`
- Check file permissions: `chmod 644 public/images/*.jpg`
- Verify Nginx has read access on server

### Fonts Not Loading

- Check browser console for CORS errors
- Verify preconnect tags are in BaseLayout.astro
- Test font URL directly in browser

## Resources

- [Astro Performance Guide](https://docs.astro.build/en/guides/performance/)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Web.dev Performance](https://web.dev/performance/)
- [Image Optimization Guide](https://web.dev/fast/#optimize-your-images)
