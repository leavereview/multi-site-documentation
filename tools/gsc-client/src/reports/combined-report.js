/**
 * Combined GSC + GA4 Report Generator
 *
 * Merges Google Search Console data with Google Analytics 4 data
 * to provide comprehensive SEO + engagement insights.
 */

import chalk from 'chalk';

export class CombinedReportGenerator {
  constructor(gscData, ga4Data) {
    this.gscData = gscData;
    this.ga4Data = ga4Data;
  }

  /**
   * Normalize URL to path for matching between GSC and GA4
   * GSC returns full URLs like "https://mydojo.software/martial-arts-software/"
   * GA4 returns paths like "/martial-arts-software/"
   */
  normalizeToPath(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      // If it's already a path (not a full URL), return as-is
      return url;
    }
  }

  /**
   * Merge GSC pages with GA4 engagement metrics
   */
  mergePageData() {
    const merged = [];

    // Create lookup map from GA4 data (normalize paths)
    const ga4Lookup = new Map();
    if (this.ga4Data?.engagement) {
      this.ga4Data.engagement.forEach(page => {
        const normalizedPath = this.normalizeToPath(page.pagePath);
        ga4Lookup.set(normalizedPath, page);
      });
    }

    // Merge GSC pages with GA4 data
    if (this.gscData?.topPages) {
      this.gscData.topPages.forEach(gscPage => {
        const normalizedPath = this.normalizeToPath(gscPage.page);
        const ga4Page = ga4Lookup.get(normalizedPath) || {};

        merged.push({
          page: gscPage.page,
          // GSC metrics
          clicks: gscPage.clicks,
          impressions: gscPage.impressions,
          ctr: gscPage.ctr,
          position: gscPage.position,
          // GA4 metrics
          sessions: ga4Page.sessions || 0,
          bounceRate: ga4Page.bounceRate || null,
          avgSessionDuration: ga4Page.avgSessionDuration || null,
          pagesPerSession: ga4Page.pagesPerSession || null,
          engagementRate: ga4Page.engagementRate || null,
          // Calculated insights
          hasGA4Data: !!ga4Page.sessions
        });
      });
    }

    return merged;
  }

  /**
   * Identify critical SEO issues by combining GSC + GA4 insights
   */
  identifyCriticalIssues() {
    const merged = this.mergePageData();
    const issues = [];

    merged.forEach(page => {
      // Issue 1: High impressions, low CTR, high bounce rate = Bad meta + bad content
      if (page.impressions > 100 && page.ctr < 1 && page.bounceRate > 70) {
        issues.push({
          type: 'HIGH_IMPR_LOW_CTR_HIGH_BOUNCE',
          severity: 'CRITICAL',
          page: page.page,
          issue: 'Getting visibility but meta description is unappealing AND content disappoints',
          gscMetrics: { impressions: page.impressions, ctr: page.ctr },
          ga4Metrics: { bounceRate: page.bounceRate },
          recommendation: 'Rewrite meta description to be more compelling AND improve content quality/relevance'
        });
      }

      // Issue 2: Good CTR from GSC but high bounce in GA4 = Misleading meta
      if (page.ctr > 3 && page.bounceRate > 75) {
        issues.push({
          type: 'GOOD_CTR_HIGH_BOUNCE',
          severity: 'HIGH',
          page: page.page,
          issue: 'Meta description attracts clicks but content doesn\'t match expectations',
          gscMetrics: { ctr: page.ctr, clicks: page.clicks },
          ga4Metrics: { bounceRate: page.bounceRate },
          recommendation: 'Align content with meta description promise OR adjust meta to be more accurate'
        });
      }

      // Issue 3: High impressions, high CTR, low engagement = Poor UX
      if (page.impressions > 50 && page.ctr > 2 && page.engagementRate < 30) {
        issues.push({
          type: 'HIGH_TRAFFIC_LOW_ENGAGEMENT',
          severity: 'MEDIUM',
          page: page.page,
          issue: 'Getting traffic but users aren\'t engaging with content',
          gscMetrics: { impressions: page.impressions, ctr: page.ctr },
          ga4Metrics: { engagementRate: page.engagementRate },
          recommendation: 'Improve page UX, add internal links, improve readability'
        });
      }

      // Issue 4: High clicks but no GA4 data = Tracking issue
      if (page.clicks > 5 && !page.hasGA4Data) {
        issues.push({
          type: 'MISSING_GA4_DATA',
          severity: 'LOW',
          page: page.page,
          issue: 'GSC shows clicks but no GA4 session data',
          gscMetrics: { clicks: page.clicks },
          ga4Metrics: {},
          recommendation: 'Check GA4 tracking code is properly installed on this page'
        });
      }

      // Issue 5: Good rankings (position < 10) but low engagement = Opportunity
      if (page.position < 10 && page.pagesPerSession < 1.5 && page.hasGA4Data) {
        issues.push({
          type: 'HIGH_RANKING_LOW_ENGAGEMENT',
          severity: 'MEDIUM',
          page: page.page,
          issue: 'Ranking well but not leveraging traffic effectively',
          gscMetrics: { position: page.position },
          ga4Metrics: { pagesPerSession: page.pagesPerSession },
          recommendation: 'Add strong CTAs, improve internal linking to related content'
        });
      }
    });

    // Sort by severity
    const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }

  /**
   * Find quick wins: Pages in striking distance with good engagement
   */
  identifyQuickWins() {
    const merged = this.mergePageData();
    const quickWins = [];

    merged.forEach(page => {
      // Striking distance (position 4-20) with decent engagement
      if (page.position >= 4 && page.position <= 20 &&
          page.engagementRate > 40 &&
          page.impressions > 20) {
        quickWins.push({
          page: page.page,
          position: page.position,
          impressions: page.impressions,
          engagementRate: page.engagementRate,
          potentialClicks: Math.round(page.impressions * 0.15), // Estimate if we move to position 3
          recommendation: 'Add more internal links, optimize title tag, build backlinks'
        });
      }
    });

    return quickWins.sort((a, b) => b.potentialClicks - a.potentialClicks);
  }

  /**
   * Calculate SEO health score (0-100)
   */
  calculateSEOHealthScore() {
    const merged = this.mergePageData();
    if (merged.length === 0) return 0;

    let score = 0;
    let factors = 0;

    // Factor 1: Average CTR (target: 3%)
    const avgCTR = merged.reduce((sum, p) => sum + p.ctr, 0) / merged.length;
    score += Math.min((avgCTR / 3) * 25, 25);
    factors++;

    // Factor 2: Average position (target: < 20)
    const avgPosition = merged.reduce((sum, p) => sum + p.position, 0) / merged.length;
    score += Math.max(25 - (avgPosition / 20) * 25, 0);
    factors++;

    // Factor 3: Engagement rate (target: 50%)
    const pagesWithGA4 = merged.filter(p => p.hasGA4Data && p.engagementRate != null);
    if (pagesWithGA4.length > 0) {
      const avgEngagement = pagesWithGA4.reduce((sum, p) => sum + p.engagementRate, 0) / pagesWithGA4.length;
      score += Math.min((avgEngagement / 50) * 25, 25);
      factors++;
    }

    // Factor 4: Bounce rate (target: < 50%)
    const pagesWithBounce = merged.filter(p => p.hasGA4Data && p.bounceRate != null);
    if (pagesWithBounce.length > 0) {
      const avgBounce = pagesWithBounce.reduce((sum, p) => sum + p.bounceRate, 0) / pagesWithBounce.length;
      score += Math.max(25 - (avgBounce / 50) * 25, 0);
      factors++;
    }

    // Score is already 0-100 (4 factors × 25 points each)
    // If we don't have all 4 factors, scale proportionally
    return Math.round(score * (4 / factors));
  }

  /**
   * Print combined report to console
   */
  printReport(domain) {
    console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.cyan.bold(`📊 COMBINED GSC + GA4 REPORT: ${domain}`));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    // SEO Health Score
    const healthScore = this.calculateSEOHealthScore();
    const scoreColor = healthScore >= 70 ? 'green' : healthScore >= 40 ? 'yellow' : 'red';
    console.log(chalk.bold(`SEO Health Score: `) + chalk[scoreColor].bold(`${healthScore}/100`));
    console.log();

    // Critical Issues
    const issues = this.identifyCriticalIssues();
    if (issues.length > 0) {
      console.log(chalk.red.bold('🚨 CRITICAL ISSUES:\n'));
      issues.slice(0, 5).forEach((issue, i) => {
        const severityColor = issue.severity === 'CRITICAL' ? 'red' : issue.severity === 'HIGH' ? 'yellow' : 'gray';
        console.log(chalk[severityColor](`${i + 1}. [${issue.severity}] ${issue.type}`));
        console.log(chalk.gray(`   Page: ${issue.page}`));
        console.log(chalk.gray(`   Issue: ${issue.issue}`));
        console.log(chalk.green(`   ✓ Fix: ${issue.recommendation}`));
        console.log();
      });
    }

    // Quick Wins
    const quickWins = this.identifyQuickWins();
    if (quickWins.length > 0) {
      console.log(chalk.green.bold('🎯 QUICK WINS (Striking Distance):\n'));
      quickWins.slice(0, 5).forEach((win, i) => {
        console.log(chalk.green(`${i + 1}. ${win.page}`));
        const engagementRate = win.engagementRate != null ? win.engagementRate.toFixed(1) : 'N/A';
        console.log(chalk.gray(`   Position: ${win.position.toFixed(1)} | Engagement: ${engagementRate}%`));
        console.log(chalk.gray(`   Potential: +${win.potentialClicks} clicks/month if optimized`));
        console.log(chalk.gray(`   Action: ${win.recommendation}`));
        console.log();
      });
    }

    // Top Pages Combined View
    const merged = this.mergePageData();
    if (merged.length > 0) {
      console.log(chalk.blue.bold('📄 TOP PAGES (GSC + GA4 Combined):\n'));
      merged.slice(0, 5).forEach((page, i) => {
        console.log(chalk.blue(`${i + 1}. ${page.page}`));
        console.log(chalk.gray(`   GSC: ${page.clicks} clicks, ${page.impressions} impr (${page.ctr.toFixed(2)}% CTR) | Pos: ${page.position.toFixed(1)}`));
        if (page.hasGA4Data) {
          const bounceRate = page.bounceRate != null ? page.bounceRate.toFixed(1) : 'N/A';
          const engagementRate = page.engagementRate != null ? page.engagementRate.toFixed(1) : 'N/A';
          console.log(chalk.gray(`   GA4: ${page.sessions} sessions, ${bounceRate}% bounce | ${engagementRate}% engaged`));
        } else {
          console.log(chalk.yellow(`   GA4: No data available`));
        }
        console.log();
      });
    }
  }

  /**
   * Generate data for Excel export
   */
  getExcelData() {
    return {
      mergedPages: this.mergePageData(),
      issues: this.identifyCriticalIssues(),
      quickWins: this.identifyQuickWins(),
      healthScore: this.calculateSEOHealthScore()
    };
  }
}

export default CombinedReportGenerator;
