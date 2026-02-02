#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// ============================================================================
// CONFIGURATION
// ============================================================================

const DRY_RUN = process.argv.includes('--dry-run');
const MAX_LINKS_PER_POST = 3; // Don't over-optimize
const BACKUP_DIR = path.join(__dirname, '..', 'backups', 'pillar-links-' + Date.now());

// Anchor text templates for natural linking
const ANCHOR_TEXT_TEMPLATES = {
  // Software/tool pillar pages
  software: [
    '{pillar}',
    'using {pillar}',
    'specialized {pillar}',
    '{pillar} platform',
    'dedicated {pillar}',
    'the right {pillar}',
    'quality {pillar}'
  ],
  // For phrases like "martial arts scheduling software"
  generic: [
    '{pillar}',
    'using {pillar}',
    '{pillar} solution',
    'proper {pillar}',
    'effective {pillar}'
  ]
};

// Keywords that suggest good insertion points
const INSERTION_KEYWORDS = [
  'manage', 'managing', 'management',
  'schedule', 'scheduling',
  'booking', 'book',
  'software', 'platform', 'tool', 'system',
  'automate', 'automation',
  'organize', 'organization',
  'track', 'tracking',
  'streamline',
  'efficient', 'efficiency',
  'solution'
];

// ============================================================================
// MAIN FUNCTION
// ============================================================================

function main() {
  console.log('🔗 Adding Missing Pillar Links\n');
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (no changes will be made)' : '✏️  EXECUTE (files will be modified)'}\n`);

  // Load audit data
  const auditDataPath = path.join(__dirname, '..', 'cross-link-audit-data.json');
  if (!fs.existsSync(auditDataPath)) {
    console.error('❌ Error: cross-link-audit-data.json not found.');
    console.error('   Run: node scripts/cross-link-audit.js first');
    process.exit(1);
  }

  const auditData = JSON.parse(fs.readFileSync(auditDataPath, 'utf-8'));

  // Create backup directory if executing
  if (!DRY_RUN) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📁 Backup directory: ${BACKUP_DIR}\n`);
  }

  // Process each pillar page
  let totalLinksAdded = 0;
  let totalFilesModified = 0;
  const modifications = [];

  for (const pillarCoverage of auditData.internalAnalysis.pillarCoverage) {
    const pillar = pillarCoverage.pillar;
    const orphanedBlogs = pillarCoverage.orphanedBlogs.slice(0, MAX_LINKS_PER_POST * 5); // Process reasonable number

    if (orphanedBlogs.length === 0) {
      continue;
    }

    console.log(`\n📌 ${pillar.title} (${pillar.url})`);
    console.log(`   ${orphanedBlogs.length} blog posts need this link\n`);

    // Process each orphaned blog
    for (const blog of orphanedBlogs) {
      const result = addPillarLinkToBlog(blog, pillar, auditData.inventory);

      if (result.success) {
        modifications.push(result);
        totalLinksAdded++;

        console.log(`   ✓ ${blog.title}`);
        console.log(`     ${result.preview}`);

        if (!DRY_RUN) {
          // Create backup
          const backupPath = path.join(BACKUP_DIR, path.basename(result.filePath));
          fs.copyFileSync(result.filePath, backupPath);

          // Write modified content
          fs.writeFileSync(result.filePath, result.newContent, 'utf-8');
          totalFilesModified++;
        }
      } else if (result.skipped) {
        console.log(`   ⊘ ${blog.title}: ${result.reason}`);
      } else {
        console.log(`   ⚠ ${blog.title}: ${result.error}`);
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Summary\n');
  console.log(`   Links to add: ${totalLinksAdded}`);
  console.log(`   Files affected: ${modifications.length}`);

  if (DRY_RUN) {
    console.log('\n💡 To apply these changes, run:');
    console.log('   node scripts/add-pillar-links.js --execute\n');
  } else {
    console.log(`\n✅ Successfully modified ${totalFilesModified} files`);
    console.log(`   Backups saved to: ${BACKUP_DIR}\n`);
  }

  // Generate detailed report
  if (modifications.length > 0) {
    generateReport(modifications);
  }
}

// ============================================================================
// LINK INSERTION LOGIC
// ============================================================================

function addPillarLinkToBlog(blog, pillar, inventory) {
  // Find the blog's file path from inventory
  const blogData = inventory.find(item => item.id === blog.id);
  if (!blogData || !blogData.url) {
    return { success: false, error: 'Blog not found in inventory' };
  }

  // Construct file path
  const site = blogData.site;
  const slug = blogData.url.split('/blog/')[1]?.replace('/', '') || 'unknown';
  const filePath = path.join(__dirname, '..', site, 'src/content/blog', `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return { success: false, error: `File not found: ${filePath}` };
  }

  // Read and parse the blog post
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content: markdown } = matter(fileContent);

  // Check if link already exists (safety check)
  const pillarUrl = pillar.url.replace(`https://${site}`, ''); // Convert to relative URL
  if (markdown.includes(pillarUrl) || markdown.includes(pillar.url)) {
    return { success: false, skipped: true, reason: 'Link already exists' };
  }

  // Find best insertion point
  const insertion = findBestInsertionPoint(markdown, pillar, blogData);

  if (!insertion) {
    return { success: false, skipped: true, reason: 'No suitable insertion point found' };
  }

  // Generate natural anchor text and contextual intro
  const anchorText = generateAnchorText(pillar.title, insertion.context);

  // Create natural linking text that appends to the paragraph
  const linkPhrase = generateLinkPhrase(pillarUrl, anchorText, pillar.title);

  // Insert the link
  const newContent = insertLinkAtPosition(fileContent, markdown, insertion, linkPhrase);

  return {
    success: true,
    filePath,
    blogTitle: blog.title,
    pillarTitle: pillar.title,
    anchorText,
    newContent,
    preview: `Added at end of paragraph: "${linkPhrase.trim()}"`
  };
}

function findBestInsertionPoint(markdown, pillar, blogData) {
  // Split into paragraphs (better for insertion)
  const paragraphs = markdown.split(/\n\n+/);

  // Extract keywords from pillar title for matching
  const pillarKeywords = extractKeywords(pillar.title.toLowerCase());

  // Score each paragraph for link insertion potential
  const scoredParagraphs = [];
  let currentPosition = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    const paragraphLower = paragraph.toLowerCase();

    // Skip headings, very short paragraphs, lists, code blocks
    if (paragraph.length < 100 ||
        paragraph.match(/^#+\s/) ||
        paragraph.match(/^[-*]\s/) ||
        paragraph.match(/^```/)) {
      currentPosition += paragraph.length + 2; // +2 for \n\n
      continue;
    }

    let score = 0;
    let matchedKeywords = [];

    // 1. Check for pillar-specific keywords
    for (const keyword of pillarKeywords) {
      if (paragraphLower.includes(keyword)) {
        score += 10;
        matchedKeywords.push(keyword);
      }
    }

    // 2. Check for insertion keywords
    for (const keyword of INSERTION_KEYWORDS) {
      if (paragraphLower.includes(keyword)) {
        score += 3;
      }
    }

    // 3. Prefer paragraphs in the middle (not intro or outro)
    const position = i / paragraphs.length;
    if (position > 0.15 && position < 0.85) {
      score += 5;
    } else if (position < 0.1 || position > 0.9) {
      score -= 5; // Penalize intro/outro
    }

    // 4. Prefer paragraphs with shared themes
    const sharedThemes = blogData.themes?.filter(theme =>
      pillarKeywords.some(kw => theme.toLowerCase().includes(kw))
    );
    if (sharedThemes && sharedThemes.length > 0) {
      score += 3 * sharedThemes.length;
    }

    // 5. Bonus for paragraphs that mention "software", "platform", "tool", "system"
    if (paragraphLower.match(/\b(software|platform|tool|system|solution)\b/)) {
      score += 5;
    }

    if (score > 10) { // Minimum threshold
      scoredParagraphs.push({
        paragraph,
        score,
        position: currentPosition,
        index: i,
        matchedKeywords
      });
    }

    currentPosition += paragraph.length + 2;
  }

  // Sort by score and pick the best one
  if (scoredParagraphs.length === 0) {
    return null;
  }

  scoredParagraphs.sort((a, b) => b.score - a.score);
  const best = scoredParagraphs[0];

  // We'll add the link at the END of this paragraph as a natural recommendation
  const paragraphEnd = best.position + best.paragraph.length;

  return {
    position: paragraphEnd,
    paragraph: best.paragraph,
    insertionType: 'append', // We're appending, not replacing
    context: best.paragraph,
    preview: best.paragraph.slice(-100),
    previewWithLink: best.paragraph.slice(-100) + ' {LINK}'
  };
}

function extractKeywords(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .filter(w => !['software', 'guide', 'complete', 'best', 'free'].includes(w));
}

function generateAnchorText(pillarTitle, context) {
  // Use the pillar title directly, but clean it up
  let anchor = pillarTitle
    .replace(/^(Best|Top|Free)\s+/i, '') // Remove superlatives
    .replace(/\s+(Guide|2026|2025|2024)$/i, ''); // Remove year/guide suffixes

  return anchor;
}

function generateLinkPhrase(pillarUrl, anchorText, pillarTitle) {
  // Determine what type of pillar this is
  const title = pillarTitle.toLowerCase();

  let intro = '';

  if (title.includes('software') || title.includes('platform') || title.includes('app')) {
    const options = [
      `Learn more about [${anchorText}](${pillarUrl})`,
      `See how [${anchorText}](${pillarUrl}) can help`,
      `Explore [${anchorText}](${pillarUrl}) solutions`,
      `Check out [${anchorText}](${pillarUrl})`
    ];
    intro = options[Math.floor(Math.random() * options.length)];
  } else if (title.includes('crm') || title.includes('management')) {
    intro = `Learn more about [${anchorText}](${pillarUrl})`;
  } else if (title.includes('scheduling') || title.includes('booking')) {
    intro = `Discover [${anchorText}](${pillarUrl}) options`;
  } else {
    intro = `Read more about [${anchorText}](${pillarUrl})`;
  }

  // Add with proper spacing
  return ` ${intro}.`;
}

function insertLinkAtPosition(fileContent, markdown, insertion, linkPhrase) {
  // Find the position in the full file content (with frontmatter)
  const markdownStart = fileContent.indexOf(markdown);

  if (markdownStart === -1) {
    return fileContent; // Safety fallback
  }

  if (insertion.insertionType === 'append') {
    // Appending to end of paragraph
    const paragraphPos = markdown.indexOf(insertion.paragraph);

    if (paragraphPos === -1) {
      return fileContent; // Safety fallback
    }

    // Calculate absolute position (end of paragraph)
    const absolutePos = markdownStart + paragraphPos + insertion.paragraph.length;

    // Insert the link phrase
    const before = fileContent.slice(0, absolutePos);
    const after = fileContent.slice(absolutePos);

    return before + linkPhrase + after;
  }

  // Legacy replace mode (shouldn't be used anymore)
  return fileContent;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

function generateReport(modifications) {
  const reportPath = path.join(__dirname, '..', 'pillar-links-report.md');

  let report = `# Pillar Links Addition Report\n\n`;
  report += `Generated: ${new Date().toISOString().split('T')[0]}\n\n`;
  report += `Total links added: ${modifications.length}\n\n`;

  // Group by site
  const bySite = {};
  modifications.forEach(mod => {
    const site = mod.filePath.split('/').find(s => s.includes('.software'));
    if (!bySite[site]) bySite[site] = [];
    bySite[site].push(mod);
  });

  for (const [site, mods] of Object.entries(bySite)) {
    report += `## ${site}\n\n`;
    report += `Links added: ${mods.length}\n\n`;

    for (const mod of mods) {
      report += `### ${mod.blogTitle}\n\n`;
      report += `- **Pillar**: [${mod.pillarTitle}](${mod.filePath})\n`;
      report += `- **Anchor Text**: "${mod.anchorText}"\n`;
      report += `- **Context**: ${mod.preview}\n\n`;
    }
  }

  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 Detailed report: pillar-links-report.md`);
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

try {
  main();
} catch (err) {
  console.error('❌ Error:', err.message);
  console.error(err.stack);
  process.exit(1);
}
