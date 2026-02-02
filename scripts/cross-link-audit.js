#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const SITES = [
  'mydojo.software',
  'petcare.software',
  'mydriveschool.software',
  'mytattoo.software'
];

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'about', 'as', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'under', 'again',
  'this', 'that', 'these', 'those', 'can', 'will', 'just', 'should',
  'your', 'have', 'has', 'had', 'been', 'being', 'more', 'most', 'some',
  'also', 'they', 'them', 'their', 'there', 'when', 'where', 'which',
  'while', 'who', 'what', 'software', 'business', 'help', 'make', 'need'
]);

const CROSS_SITE_THEMES = {
  'Business operations': [
    'scheduling', 'booking', 'appointments', 'calendar', 'availability',
    'reservation', 'online booking', 'appointment management', 'capacity'
  ],
  'Client management': [
    'customer', 'client', 'crm', 'communication', 'retention',
    'relationship', 'engagement', 'customer service', 'loyalty'
  ],
  'Billing & payments': [
    'billing', 'payment', 'invoicing', 'subscription', 'pricing',
    'revenue', 'deposits', 'payment processing', 'financial'
  ],
  'Marketing & growth': [
    'marketing', 'seo', 'social media', 'advertising', 'lead generation',
    'referrals', 'promotion', 'growth', 'content marketing'
  ],
  'Staff management': [
    'staff', 'employee', 'instructor', 'team', 'scheduling',
    'payroll', 'training', 'workforce', 'hiring'
  ],
  'Software & technology': [
    'software', 'saas', 'platform', 'integration', 'automation',
    'digital', 'technology', 'app', 'system', 'migration'
  ],
  'Compliance & admin': [
    'compliance', 'insurance', 'licensing', 'records', 'documentation',
    'legal', 'regulation', 'certification', 'liability'
  ],
  'Small business general': [
    'business plan', 'starting', 'startup', 'entrepreneur', 'scaling',
    'profitability', 'operations', 'management', 'business owner'
  ]
};

const EXCLUDED_PAGES = [
  '404.astro', 'terms.astro', 'privacy-policy.astro',
  'about.astro', 'contact.astro', 'pricing.astro'
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function countWords(text) {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractFromHtml(html, regex) {
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

function normalizeUrl(url, site) {
  // Convert relative URLs to absolute
  if (url.startsWith('/')) {
    return `https://${site}${url}`;
  }
  // Ensure trailing slash for consistency
  if (!url.endsWith('/') && !url.includes('#') && !url.includes('?')) {
    return url + '/';
  }
  return url;
}

// ============================================================================
// PHASE 1: CONTENT SCANNING & PARSING
// ============================================================================

function scanSites() {
  const allContent = [];

  for (const site of SITES) {
    const siteRoot = path.join(__dirname, '..', site);

    // Scan pillar pages
    const pagesDir = path.join(siteRoot, 'src/pages');
    if (fs.existsSync(pagesDir)) {
      const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.astro'));

      for (const file of files) {
        if (!EXCLUDED_PAGES.includes(file)) {
          const content = parseAstroFile(path.join(pagesDir, file), site);
          if (content) allContent.push(content);
        }
      }
    }

    // Scan blog posts
    const blogDir = path.join(siteRoot, 'src/content/blog');
    if (fs.existsSync(blogDir)) {
      const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'));

      for (const file of files) {
        const content = parseMdFile(path.join(blogDir, file), site);
        if (content) allContent.push(content);
      }
    }
  }

  return allContent;
}

function parseMdFile(filePath, site) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data: frontmatter, content: markdown } = matter(content);

    const slug = path.basename(filePath, '.md');
    const url = `https://${site}/blog/${slug}/`;

    return {
      id: `${site.split('.')[0]}-blog-${slug}`,
      site,
      type: 'blog',
      filePath,
      url,
      slug,
      title: frontmatter.title || 'Untitled',
      description: frontmatter.description || '',
      date: frontmatter.date || '',
      tags: frontmatter.tags || [],
      author: frontmatter.author || '',
      bodyContent: markdown,
      wordCount: countWords(markdown),
      internalLinks: extractLinksFromMarkdown(markdown, site),
      crossSiteLinks: [],
      topics: extractTopics(markdown),
      themes: []
    };
  } catch (err) {
    console.warn(`⚠️  Failed to parse ${filePath}: ${err.message}`);
    return null;
  }
}

function parseAstroFile(filePath, site) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract frontmatter section
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    const astroContent = frontmatterMatch
      ? content.slice(frontmatterMatch[0].length)
      : content;

    // Extract metadata from HTML
    const title = extractFromHtml(astroContent, /<title>([^<]+)<\/title>/) ||
                  extractFromHtml(astroContent, /<h1[^>]*>([^<]+)<\/h1>/) ||
                  'Untitled';

    const description = extractFromHtml(
      astroContent,
      /<meta\s+name="description"\s+content="([^"]+)"/
    ) || '';

    // Extract body content
    const bodyContent = extractBodyFromAstro(astroContent);

    const slug = path.basename(filePath, '.astro');
    const url = slug === 'index'
      ? `https://${site}/`
      : `https://${site}/${slug}/`;

    return {
      id: `${site.split('.')[0]}-page-${slug}`,
      site,
      type: slug === 'index' ? 'homepage' : 'pillar',
      filePath,
      url,
      slug,
      title,
      description,
      bodyContent,
      wordCount: countWords(bodyContent),
      internalLinks: extractLinksFromHtml(bodyContent, site),
      crossSiteLinks: [],
      topics: extractTopics(bodyContent),
      themes: []
    };
  } catch (err) {
    console.warn(`⚠️  Failed to parse ${filePath}: ${err.message}`);
    return null;
  }
}

function extractBodyFromAstro(astroContent) {
  let body = astroContent;

  // Remove script and style blocks
  body = body.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  body = body.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Remove Astro component tags
  body = body.replace(/<[A-Z][a-zA-Z]*[^>]*\/>/g, '');
  body = body.replace(/<[A-Z][a-zA-Z]*[^>]*>/g, '');
  body = body.replace(/<\/[A-Z][a-zA-Z]*>/g, '');

  // Remove nav and footer sections
  body = body.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
  body = body.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');

  // Strip HTML tags
  return body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractLinksFromMarkdown(markdown, site) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links = [];
  let match;

  while ((match = linkRegex.exec(markdown)) !== null) {
    const url = normalizeUrl(match[2], site);
    if (url.includes(site)) {
      links.push({
        text: match[1],
        url: url,
        isInternal: true
      });
    }
  }

  return links;
}

function extractLinksFromHtml(html, site) {
  const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
  const links = [];
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const url = normalizeUrl(match[1], site);
    if (url.includes(site)) {
      links.push({
        text: match[2],
        url: url,
        isInternal: true
      });
    }
  }

  return links;
}

// ============================================================================
// PHASE 2: TOPIC EXTRACTION & THEME CLASSIFICATION
// ============================================================================

function extractTopics(text, topN = 10) {
  // Tokenize and clean
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOP_WORDS.has(w));

  // Extract bigrams and trigrams
  const phrases = [];
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(`${words[i]} ${words[i+1]}`);
    if (i < words.length - 2) {
      phrases.push(`${words[i]} ${words[i+1]} ${words[i+2]}`);
    }
  }

  // Calculate frequency
  const freq = {};
  phrases.forEach(phrase => {
    freq[phrase] = (freq[phrase] || 0) + 1;
  });

  // Score and rank
  return Object.entries(freq)
    .map(([phrase, count]) => ({
      phrase,
      score: count * Math.log(phrase.split(' ').length + 1)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

function classifyThemes(content) {
  const themes = [];
  const contentLower = content.bodyContent.toLowerCase();
  const topicPhrases = content.topics.map(t => t.phrase);

  for (const [theme, keywords] of Object.entries(CROSS_SITE_THEMES)) {
    let score = 0;

    // Check topic overlap
    topicPhrases.forEach(phrase => {
      keywords.forEach(keyword => {
        if (phrase.includes(keyword)) score += 2;
      });
    });

    // Check keyword frequency in content
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = contentLower.match(regex);
      if (matches) score += matches.length;
    });

    if (score >= 5) themes.push(theme);
  }

  return themes;
}

function enrichWithThemes(contentItems) {
  return contentItems.map(item => ({
    ...item,
    themes: classifyThemes(item)
  }));
}

// ============================================================================
// PHASE 3: INTERNAL LINK ANALYSIS
// ============================================================================

function hasThemeOrTopicOverlap(contentA, contentB) {
  // Check theme overlap
  const sharedThemes = contentA.themes.filter(t => contentB.themes.includes(t));
  if (sharedThemes.length > 0) return true;

  // Check topic overlap
  const topicsA = new Set(contentA.topics.map(t => t.phrase));
  const topicsB = new Set(contentB.topics.map(t => t.phrase));
  const intersection = [...topicsA].filter(t => topicsB.has(t));

  return intersection.length >= 2;
}

function analyzePillarCoverage(contentItems) {
  const results = [];
  const pillars = contentItems.filter(c => c.type === 'pillar');
  const blogs = contentItems.filter(c => c.type === 'blog');

  for (const pillar of pillars) {
    const sameSiteBlogs = blogs.filter(b => b.site === pillar.site);

    // Find blogs linking to this pillar
    const linkingBlogs = sameSiteBlogs.filter(blog =>
      blog.internalLinks.some(link => link.url === pillar.url)
    );

    // Find relevant blogs NOT linking
    const orphanedBlogs = sameSiteBlogs.filter(blog => {
      const isLinking = linkingBlogs.includes(blog);
      const hasOverlap = hasThemeOrTopicOverlap(blog, pillar);
      return !isLinking && hasOverlap;
    });

    results.push({
      pillar,
      linkingBlogs,
      orphanedBlogs,
      coverage: sameSiteBlogs.length > 0
        ? (linkingBlogs.length / sameSiteBlogs.length * 100).toFixed(0)
        : 0
    });
  }

  return results;
}

function findRelatedContentGaps(contentItems) {
  const gaps = [];
  const blogs = contentItems.filter(c => c.type === 'blog');

  // Group by site
  const bySite = {};
  blogs.forEach(blog => {
    if (!bySite[blog.site]) bySite[blog.site] = [];
    bySite[blog.site].push(blog);
  });

  // Find gaps within each site
  for (const [site, siteBlogs] of Object.entries(bySite)) {
    for (let i = 0; i < siteBlogs.length; i++) {
      for (let j = i + 1; j < siteBlogs.length; j++) {
        const blogA = siteBlogs[i];
        const blogB = siteBlogs[j];

        // Check if they share 2+ tags
        const sharedTags = blogA.tags.filter(t => blogB.tags.includes(t));

        if (sharedTags.length >= 2) {
          // Check if they link to each other
          const aLinksToB = blogA.internalLinks.some(l => l.url === blogB.url);
          const bLinksToA = blogB.internalLinks.some(l => l.url === blogA.url);

          if (!aLinksToB && !bLinksToA) {
            gaps.push({
              blogA,
              blogB,
              sharedTags,
              reason: `Share ${sharedTags.length} tags: ${sharedTags.join(', ')}`
            });
          }
        }
      }
    }
  }

  return gaps;
}

function findOrphans(contentItems) {
  return contentItems
    .filter(content => {
      // Count inbound links from same site
      const inboundCount = contentItems.filter(other =>
        other.site === content.site &&
        other.id !== content.id &&
        other.internalLinks.some(link => link.url === content.url)
      ).length;

      return inboundCount === 0;
    })
    .filter(c => c.type !== 'homepage');
}

// ============================================================================
// PHASE 4: CROSS-SITE LINK OPPORTUNITIES
// ============================================================================

function calculateSimilarity(contentA, contentB) {
  let score = 0;
  const reasons = [];
  let primaryTheme = null;

  // 1. Theme overlap (40% weight)
  const sharedThemes = contentA.themes.filter(t => contentB.themes.includes(t));
  if (sharedThemes.length > 0) {
    const themeScore = Math.min(sharedThemes.length * 0.3, 0.4);
    score += themeScore;
    primaryTheme = sharedThemes[0];
    reasons.push(`${sharedThemes.length} shared themes`);
  }

  // 2. Topic overlap (30% weight)
  const topicsA = new Set(contentA.topics.map(t => t.phrase));
  const topicsB = new Set(contentB.topics.map(t => t.phrase));
  const sharedTopics = [...topicsA].filter(t => topicsB.has(t));
  if (sharedTopics.length > 0) {
    const topicScore = Math.min(
      (sharedTopics.length / Math.max(topicsA.size, topicsB.size)) * 0.3,
      0.3
    );
    score += topicScore;
    reasons.push(`${sharedTopics.length} shared topics`);
  }

  // 3. Tag overlap (30% weight, only for blogs)
  if (contentA.tags && contentB.tags) {
    const sharedTags = contentA.tags.filter(t => contentB.tags.includes(t));
    if (sharedTags.length > 0) {
      score += Math.min(sharedTags.length * 0.15, 0.3);
      reasons.push(`${sharedTags.length} shared tags`);
    }
  }

  return {
    score: Math.min(score, 1.0),
    reason: reasons.join(' | '),
    primaryTheme: primaryTheme || (sharedThemes.length > 0 ? sharedThemes[0] : null)
  };
}

function findBestAnchorText(source, target) {
  const contentLower = source.bodyContent.toLowerCase();

  // 1. Check if target title appears in source
  if (contentLower.includes(target.title.toLowerCase())) {
    return target.title;
  }

  // 2. Check for shared topics
  for (const topic of target.topics.slice(0, 5)) {
    const regex = new RegExp(`\\b${escapeRegex(topic.phrase)}\\b`, 'i');
    if (regex.test(source.bodyContent)) {
      return topic.phrase;
    }
  }

  // 3. Use industry-specific generic phrase
  const siteKeywords = {
    'mydojo.software': 'martial arts',
    'petcare.software': 'pet care',
    'mydriveschool.software': 'driving school',
    'mytattoo.software': 'tattoo studio'
  };

  const industry = siteKeywords[target.site] || 'business';
  return `${industry} ${target.topics[0]?.phrase || 'guide'}`;
}

function findContextSnippet(source, target) {
  // Find a sentence in source that contains relevant keywords
  const sentences = source.bodyContent.split(/[.!?]+/);
  const targetKeywords = target.topics.slice(0, 3).map(t => t.phrase);

  for (const sentence of sentences) {
    const sentenceLower = sentence.toLowerCase();
    for (const keyword of targetKeywords) {
      if (sentenceLower.includes(keyword)) {
        return sentence.trim().slice(0, 150) + '...';
      }
    }
  }

  return sentences[0]?.trim().slice(0, 150) + '...' || 'N/A';
}

function filterAndRankOpportunities(opportunities) {
  const reciprocalPairs = new Set();

  return opportunities
    // Remove reciprocal links (keep higher confidence one)
    .filter(opp => {
      const pairKey = [opp.source.id, opp.target.id].sort().join('|');
      const reciprocalKey = [opp.target.id, opp.source.id].sort().join('|');

      if (reciprocalPairs.has(pairKey) || reciprocalPairs.has(reciprocalKey)) {
        return false;
      }

      const reciprocal = opportunities.find(other =>
        other.source.id === opp.target.id && other.target.id === opp.source.id
      );

      if (reciprocal) {
        if (opp.confidence >= reciprocal.confidence) {
          reciprocalPairs.add(pairKey);
          return true;
        }
        return false;
      }

      return true;
    })
    // Limit to 3 outbound cross-site links per page
    .reduce((acc, opp) => {
      const sourceLinks = acc.filter(o => o.source.id === opp.source.id);
      if (sourceLinks.length < 3) {
        acc.push(opp);
      }
      return acc;
    }, [])
    // Sort by confidence
    .sort((a, b) => b.confidence - a.confidence);
}

function findCrossSiteLinkOpportunities(contentItems) {
  const opportunities = [];

  // Only blog posts for natural cross-linking
  const blogs = contentItems.filter(c => c.type === 'blog');

  for (const sourceBlog of blogs) {
    // Find blogs from OTHER sites
    const candidates = blogs.filter(targetBlog =>
      targetBlog.site !== sourceBlog.site
    );

    for (const targetBlog of candidates) {
      const similarity = calculateSimilarity(sourceBlog, targetBlog);

      // Only consider medium-to-high confidence
      if (similarity.score >= 0.6) {
        const anchorText = findBestAnchorText(sourceBlog, targetBlog);
        const contextSnippet = findContextSnippet(sourceBlog, targetBlog);

        opportunities.push({
          type: 'cross-site',
          source: sourceBlog,
          target: targetBlog,
          anchorText,
          contextSnippet,
          reason: similarity.reason,
          confidence: similarity.score,
          theme: similarity.primaryTheme || 'General',
          priority: similarity.score > 0.8 ? 'high' :
                   similarity.score > 0.7 ? 'medium' : 'low'
        });
      }
    }
  }

  return filterAndRankOpportunities(opportunities);
}

// ============================================================================
// PHASE 5: REPORT GENERATION
// ============================================================================

function generateMarkdownReport(contentItems, analysis) {
  let report = `# Cross-Link Audit Report\n\n`;
  report += `Generated: ${new Date().toISOString().split('T')[0]}\n\n`;

  // Executive Summary
  report += `## Executive Summary\n\n`;
  report += `- Total content items analyzed: ${contentItems.length}\n`;
  const totalInternalOpps = analysis.contentGaps.length +
    analysis.pillarCoverage.reduce((sum, p) => sum + p.orphanedBlogs.length, 0);
  report += `- Internal link opportunities: ${totalInternalOpps}\n`;
  report += `- Cross-site link opportunities: ${analysis.crossSiteOpportunities.length}\n`;
  report += `- Orphan pages found: ${analysis.orphans.length}\n\n`;

  // Content inventory by site
  report += `## 1. Content Inventory by Site\n\n`;
  for (const site of SITES) {
    const siteContent = contentItems.filter(c => c.site === site);
    const pages = siteContent.filter(c => c.type === 'pillar' || c.type === 'homepage').length;
    const blogs = siteContent.filter(c => c.type === 'blog').length;
    report += `### ${site}\n`;
    report += `- ${pages} pillar pages\n`;
    report += `- ${blogs} blog posts\n`;
    report += `- Total: ${siteContent.length} items\n\n`;
  }

  // Internal link analysis per site
  report += `## 2. Internal Link Analysis\n\n`;
  for (const site of SITES) {
    report += `### ${site}\n\n`;

    // Pillar coverage
    const sitePillars = analysis.pillarCoverage.filter(p => p.pillar.site === site);
    report += `#### Pillar-to-Blog Coverage\n\n`;
    for (const pillarData of sitePillars) {
      report += `**${pillarData.pillar.title}** (${pillarData.linkingBlogs.length} linking, ${pillarData.orphanedBlogs.length} missing)\n\n`;
      if (pillarData.orphanedBlogs.length > 0) {
        report += `Missing pillar links in:\n`;
        pillarData.orphanedBlogs.slice(0, 5).forEach(blog => {
          report += `- [${blog.title}](${blog.url})\n`;
        });
        if (pillarData.orphanedBlogs.length > 5) {
          report += `- ...and ${pillarData.orphanedBlogs.length - 5} more\n`;
        }
        report += `\n`;
      }
    }

    // Content gaps
    const siteGaps = analysis.contentGaps.filter(g => g.blogA.site === site);
    if (siteGaps.length > 0) {
      report += `#### Related Content Gaps (${siteGaps.length} pairs)\n\n`;
      siteGaps.slice(0, 5).forEach(gap => {
        report += `- [${gap.blogA.title}](${gap.blogA.url}) ↔ [${gap.blogB.title}](${gap.blogB.url})\n`;
        report += `  - ${gap.reason}\n`;
      });
      if (siteGaps.length > 5) {
        report += `- ...and ${siteGaps.length - 5} more pairs\n`;
      }
      report += `\n`;
    }
  }

  // Cross-site opportunities
  report += `## 3. Cross-Site Link Opportunities\n\n`;
  const highPriority = analysis.crossSiteOpportunities.filter(o => o.priority === 'high');
  const mediumPriority = analysis.crossSiteOpportunities.filter(o => o.priority === 'medium');
  const lowPriority = analysis.crossSiteOpportunities.filter(o => o.priority === 'low');

  report += `### High Priority (${highPriority.length} opportunities)\n\n`;
  highPriority.slice(0, 20).forEach((opp, idx) => {
    report += `${idx + 1}. **${opp.source.site}** → **${opp.target.site}**\n`;
    report += `   - Source: [${opp.source.title}](${opp.source.url})\n`;
    report += `   - Target: [${opp.target.title}](${opp.target.url})\n`;
    report += `   - Anchor: "${opp.anchorText}"\n`;
    report += `   - Theme: ${opp.theme}\n`;
    report += `   - Confidence: ${(opp.confidence * 100).toFixed(0)}%\n`;
    report += `   - Context: ${opp.contextSnippet}\n\n`;
  });

  if (mediumPriority.length > 0) {
    report += `### Medium Priority (${mediumPriority.length} opportunities)\n\n`;
    report += `[Showing first 10]\n\n`;
    mediumPriority.slice(0, 10).forEach((opp, idx) => {
      report += `${idx + 1}. ${opp.source.site} → ${opp.target.site}: "${opp.anchorText}" (${opp.theme})\n`;
    });
    report += `\n`;
  }

  if (lowPriority.length > 0) {
    report += `### Low Priority (${lowPriority.length} opportunities)\n\n`;
    report += `See JSON data file for full list.\n\n`;
  }

  // Orphan pages
  if (analysis.orphans.length > 0) {
    report += `## 4. Orphan Pages (${analysis.orphans.length} pages with 0 inbound links)\n\n`;
    analysis.orphans.forEach(orphan => {
      report += `- [${orphan.title}](${orphan.url}) (${orphan.site})\n`;
    });
    report += `\n`;
  }

  // Action items
  report += `## 5. Implementation Recommendations\n\n`;
  report += `### Phase 1: Critical Internal Links (Week 1)\n`;
  const totalOrphaned = analysis.pillarCoverage.reduce((sum, p) => sum + p.orphanedBlogs.length, 0);
  report += `- Add ${totalOrphaned} missing pillar links in blog posts\n`;
  report += `- Connect ${analysis.contentGaps.length} related blog post pairs\n\n`;

  report += `### Phase 2: High-Value Cross-Links (Week 2-3)\n`;
  report += `- Implement top ${Math.min(20, highPriority.length)} cross-site opportunities (confidence > 80%)\n`;
  const themes = [...new Set(highPriority.map(o => o.theme))].filter(t => t !== 'General');
  if (themes.length > 0) {
    report += `- Focus on ${themes.join(', ')} themes\n`;
  }
  report += `\n`;

  report += `### Phase 3: Orphan Resolution (Week 4)\n`;
  report += `- Add inbound links to ${analysis.orphans.length} orphan pages\n\n`;

  return report;
}

function generateJsonData(contentItems, analysis) {
  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalItems: contentItems.length,
      sites: {
        'mydojo.software': contentItems.filter(c => c.site === 'mydojo.software').length,
        'petcare.software': contentItems.filter(c => c.site === 'petcare.software').length,
        'mydriveschool.software': contentItems.filter(c => c.site === 'mydriveschool.software').length,
        'mytattoo.software': contentItems.filter(c => c.site === 'mytattoo.software').length
      }
    },
    inventory: contentItems.map(c => ({
      id: c.id,
      site: c.site,
      type: c.type,
      url: c.url,
      title: c.title,
      wordCount: c.wordCount,
      tags: c.tags || [],
      themes: c.themes,
      internalLinksCount: c.internalLinks.length,
      topics: c.topics.slice(0, 5)
    })),
    internalAnalysis: {
      pillarCoverage: analysis.pillarCoverage.map(p => ({
        pillar: { id: p.pillar.id, title: p.pillar.title, url: p.pillar.url },
        linkingCount: p.linkingBlogs.length,
        orphanedCount: p.orphanedBlogs.length,
        orphanedBlogs: p.orphanedBlogs.map(b => ({
          id: b.id,
          title: b.title,
          url: b.url
        })),
        coverage: p.coverage
      })),
      contentGaps: analysis.contentGaps.map(g => ({
        blogA: { id: g.blogA.id, title: g.blogA.title, url: g.blogA.url },
        blogB: { id: g.blogB.id, title: g.blogB.title, url: g.blogB.url },
        sharedTags: g.sharedTags,
        reason: g.reason
      })),
      orphans: analysis.orphans.map(o => ({
        id: o.id,
        title: o.title,
        url: o.url,
        site: o.site
      }))
    },
    crossSiteOpportunities: analysis.crossSiteOpportunities.map(opp => ({
      source: {
        id: opp.source.id,
        title: opp.source.title,
        url: opp.source.url,
        site: opp.source.site
      },
      target: {
        id: opp.target.id,
        title: opp.target.title,
        url: opp.target.url,
        site: opp.target.site
      },
      anchorText: opp.anchorText,
      contextSnippet: opp.contextSnippet,
      theme: opp.theme,
      confidence: opp.confidence,
      priority: opp.priority,
      reason: opp.reason
    }))
  };
}

// ============================================================================
// PHASE 6: MAIN ORCHESTRATOR
// ============================================================================

function main() {
  console.log('🔍 Starting cross-link audit...\n');

  // Phase 1: Scan content
  console.log('📂 Scanning 4 sites...');
  const contentItems = scanSites();
  console.log(`✓ Found ${contentItems.length} content items\n`);

  // Phase 2: Extract topics and classify themes
  console.log('🏷️  Extracting topics and themes...');
  const enrichedContent = enrichWithThemes(contentItems);
  console.log(`✓ Classified ${enrichedContent.length} items\n`);

  // Phase 3: Internal link analysis
  console.log('🔗 Analyzing internal links...');
  const pillarCoverage = analyzePillarCoverage(enrichedContent);
  const contentGaps = findRelatedContentGaps(enrichedContent);
  const orphans = findOrphans(enrichedContent);
  console.log(`✓ Found ${contentGaps.length} content gaps and ${orphans.length} orphans\n`);

  // Phase 4: Cross-site opportunities
  console.log('🌐 Finding cross-site link opportunities...');
  const crossSiteOpportunities = findCrossSiteLinkOpportunities(enrichedContent);
  console.log(`✓ Found ${crossSiteOpportunities.length} cross-site opportunities\n`);

  // Phase 5: Generate reports
  console.log('📝 Generating reports...');
  const analysis = {
    pillarCoverage,
    contentGaps,
    orphans,
    crossSiteOpportunities
  };

  const markdownReport = generateMarkdownReport(enrichedContent, analysis);
  const jsonData = generateJsonData(enrichedContent, analysis);

  // Write output files
  const outputDir = path.join(__dirname, '..');
  fs.writeFileSync(path.join(outputDir, 'cross-link-audit-report.md'), markdownReport);
  fs.writeFileSync(path.join(outputDir, 'cross-link-audit-data.json'), JSON.stringify(jsonData, null, 2));

  console.log('✓ Reports generated:\n');
  console.log('  - cross-link-audit-report.md');
  console.log('  - cross-link-audit-data.json\n');

  // Summary
  console.log('📊 Summary:');
  console.log(`  - Total content items: ${enrichedContent.length}`);
  const totalInternalOpps = contentGaps.length + pillarCoverage.reduce((sum, p) => sum + p.orphanedBlogs.length, 0);
  console.log(`  - Internal link opportunities: ${totalInternalOpps}`);
  console.log(`  - Cross-site opportunities: ${crossSiteOpportunities.length}`);
  console.log(`  - Orphan pages: ${orphans.length}`);
}

// Error handling wrapper
try {
  main();
} catch (err) {
  console.error('❌ Error:', err.message);
  console.error(err.stack);
  process.exit(1);
}
