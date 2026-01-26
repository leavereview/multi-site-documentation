# CLAUDE.md - Multi-Site Static Hosting Project

## Overview

This workspace contains 4 static Astro sites that share the same architecture and deploy to a single Lightsail server.

## Sites

| Folder | Domain | Deploy Path |
|--------|--------|-------------|
| mydojo.software | mydojo.software | /var/www/mydojo.software/ |
| petcare.software | petcare.software | /var/www/petcare.software/ |
| mydriveschool.software | mydriveschool.software | /var/www/mydriveschool.software/ |
| mytattoo.software | mytattoo.software | /var/www/mytattoo.software/ |

## Server Access
```bash
ssh lightsail   # Ubuntu 24.04, IP: 13.43.71.165
```

## Commands (run from each site's folder)
```bash
npm install      # Install dependencies
npm run dev      # Start dev server (localhost:4321)
npm run build    # Build to dist/
npm run preview  # Preview production build
```

## Deployment

Each site auto-deploys via GitHub Actions when pushed to main branch.

### GitHub Secrets Required (per repo)
- `SSH_PRIVATE_KEY` - Deploy key for server
- `REMOTE_HOST` - 13.43.71.165
- `SITE_DOMAIN` - The specific domain (e.g., mydojo.software)

### Manual Deploy (if needed)
```bash
cd {site-folder}
npm run build
rsync -avz --delete dist/ ubuntu@13.43.71.165:/var/www/{domain}/
```

## Architecture

All sites use:
- **Astro 4.x** - Static site generator
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

### Project Structure
```
{site}/
├── src/
│   ├── pages/           # .astro pages → routes
│   ├── layouts/         # BaseLayout.astro, PillarPageLayout.astro
│   ├── components/      # Navigation.astro, Footer.astro
│   ├── content/blog/    # Markdown blog posts
│   ├── styles/          # global.css
│   └── utils/           # internalLinks.ts
├── public/              # Static assets (images, favicon)
├── dist/                # Built output (git-ignored)
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```

## Design System

### Colors (consistent across all sites)
- Primary Navy: `#1A1A2E`
- Accent Red: `#E94560`
- Light Red: `#FFE7EC`

### CSS Classes
- `.btn-primary` - Red CTA button
- `.btn-secondary` - White outlined button
- `.card` - White card with shadow
- `.container-custom` - Max-width centered container
- `.section` - Vertical padding for sections

## Reference Site

**mydojo.software** is the reference implementation. When building other sites:
1. Copy the structure from mydojo.software
2. Update `astro.config.mjs` with correct site URL
3. Update Navigation.astro with site-specific links
4. Update Footer.astro with site branding
5. Replace content in src/pages/ and src/content/blog/

## Common Issues

### Build fails
```bash
rm -rf node_modules dist .astro
npm install
npm run build
```

### Deploy not working
1. Check GitHub Actions tab for errors
2. Verify secrets are set correctly
3. Test SSH: `ssh lightsail "ls /var/www/"`

### Site shows old content
- Clear browser cache
- Check dist/ folder has new build
- Verify rsync completed in GitHub Actions log

## Nginx Config Location (on server)
```bash
/etc/nginx/sites-available/{domain}
/etc/nginx/sites-enabled/{domain}
```

Test config: `sudo nginx -t`
Reload: `sudo systemctl reload nginx`

## Legacy WordPress Sites (Content Reference)

These are the original WordPress sites hosted on separate Bitnami instances. Use these to extract content when building out the new Astro sites.

| SSH Alias | Domain | IP | User |
|-----------|--------|-----|------|
| driveschool-wp | mydriveschool.software | 13.135.67.114 | bitnami |
| tattoo-wp | mytattoo.software | 3.9.13.136 | bitnami |
| petcare-wp | petcare.software | 18.171.175.199 | bitnami |

### Accessing WordPress Sites
```bash
ssh driveschool-wp   # MyDriveSchool WordPress
ssh tattoo-wp        # MyTattoo WordPress
ssh petcare-wp       # PetCare WordPress
```

### WordPress File Locations (Bitnami)
- Document root: `/opt/bitnami/wordpress/`
- Uploads: `/opt/bitnami/wordpress/wp-content/uploads/`
- Themes: `/opt/bitnami/wordpress/wp-content/themes/`
