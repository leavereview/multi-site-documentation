# Add Pillar Links Script

## Overview

This script automatically adds missing internal links from blog posts to relevant pillar pages across all 4 sites. It intelligently finds appropriate paragraphs and appends natural linking text.

## How It Works

1. **Reads audit data** from `cross-link-audit-data.json`
2. **Identifies orphaned blogs** - blog posts that should link to pillar pages but don't
3. **Finds optimal insertion points** by scoring paragraphs based on:
   - Keyword relevance to the pillar page
   - Presence of software/business terms
   - Position in the article (prefers middle sections)
   - Shared themes between blog and pillar
4. **Adds natural link phrases** at the end of relevant paragraphs:
   - "Learn more about [Pillar Title](/pillar-url/)."
   - "See how [Pillar Title](/pillar-url/) can help."
   - "Explore [Pillar Title](/pillar-url/) solutions."
   - "Check out [Pillar Title](/pillar-url/)."

## Usage

### Preview Changes (Dry Run)

```bash
node scripts/add-pillar-links.js --dry-run
```

This shows what links would be added WITHOUT modifying any files.

### Apply Changes

```bash
node scripts/add-pillar-links.js --execute
```

This modifies blog post files and creates backups in `backups/pillar-links-[timestamp]/`

## Safety Features

- ✅ **Automatic backups** - Original files saved before modification
- ✅ **Duplicate detection** - Skips if link already exists
- ✅ **Quality scoring** - Only adds links to relevant paragraphs
- ✅ **Max links per post** - Limited to prevent over-optimization (3 per post)
- ✅ **Dry-run mode** - Preview before executing

## Output

### Console Output
- Shows each pillar page being processed
- Lists which blog posts receive links
- Displays preview of the link text being added
- Summary statistics

### Generated Reports
- `pillar-links-report.md` - Detailed report of all modifications
- Organized by site with context for each link

### Backups
- `backups/pillar-links-[timestamp]/` - Original files before modification

## Example Output

```
📌 BJJ Gym Software (https://mydojo.software/bjj-gym-software/)
   15 blog posts need this link

   ✓ Adult Karate Classes: Getting Started
     Added at end of paragraph: "See how [BJJ Gym Software](/bjj-gym-software/) can help."

   ✓ Best Martial Arts Software 2026
     Added at end of paragraph: "Check out [BJJ Gym Software](/bjj-gym-software/)."
```

## Statistics from Last Run

- **Total links to add**: 289
- **Files affected**: 289 blog posts across 4 sites
- **Coverage improvement**:
  - mydojo.software: ~80 links
  - petcare.software: ~120 links
  - mydriveschool.software: ~50 links
  - mytattoo.software: ~60 links

## What Gets Linked

The script processes pillar pages from the audit data:

**mydojo.software:**
- BJJ Gym Software
- Dojo Management Software
- Karate School Software
- Martial Arts Billing Software
- Martial Arts CRM
- Martial Arts Scheduling Software
- Martial Arts Software
- MMA Gym Software

**petcare.software:**
- Cattery Software
- Dog Boarding Software
- Dog Daycare Software
- Kennel Software
- Pet Grooming Software
- Pet Sitting Software

**mydriveschool.software:**
- Driving School Management Software
- Driving School Scheduling Software
- Free Driving School Software

**mytattoo.software:**
- Tattoo Artist Software
- Tattoo Booking App
- Tattoo Booking Software
- Tattoo Scheduling Software
- Tattoo Studio Software

## Insertion Strategy

### Paragraph Scoring Factors

1. **Keyword Match** (+10 points)
   - Paragraph contains keywords from pillar title

2. **Business Terms** (+5 points)
   - Contains: software, platform, tool, system, solution

3. **Position** (+5 points)
   - Middle sections preferred (15-85% through article)
   - Intro/outro penalized (-5 points)

4. **Theme Overlap** (+3 per theme)
   - Shared themes between blog and pillar

5. **Insertion Keywords** (+3 points)
   - Contains: manage, schedule, booking, automate, etc.

### Minimum Score
Paragraphs need 10+ points to be considered for link insertion.

## Rollback

If you need to undo changes:

1. Find the backup directory: `backups/pillar-links-[timestamp]/`
2. Copy files back to their original locations

Or use git:
```bash
git checkout src/content/blog/*.md
```

## Tips

- **Run audit first**: Always run `cross-link-audit.js` before this script
- **Review dry-run**: Check output before executing
- **Commit before running**: Use git to track changes
- **Review changes**: Check a few modified files manually
- **Re-run audit**: After adding links, run audit again to see improvement

## Troubleshooting

### "cross-link-audit-data.json not found"
Run the audit first:
```bash
node scripts/cross-link-audit.js
```

### "No suitable insertion point found"
The blog post may:
- Already have the link
- Lack relevant keywords
- Be too short or have unusual formatting

This is intentional - better to skip than force an awkward link.

### Too many/few links
Adjust `MAX_LINKS_PER_POST` in the script (default: 3)

## Next Steps After Running

1. Review a sample of modified files
2. Run `cross-link-audit.js` again to verify improvements
3. Check pillar coverage metrics
4. Commit changes with a descriptive message
5. Deploy to see live changes
