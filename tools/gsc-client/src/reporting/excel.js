import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import chalk from 'chalk';

/**
 * Generate comprehensive Excel report from GSC data
 * @param {Object} allDomainsData - Data from all domains
 * @param {string} outputPath - Output file path
 * @returns {Promise<string>} Path to generated Excel file
 */
export async function generateExcelReport(allDomainsData, outputPath) {
  try {
    console.log(chalk.gray('\n  Generating Excel report...'));

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'GSC Client';
    workbook.created = new Date();

    // Create worksheets
    createGrowthPotentialAnalysis(workbook, allDomainsData);
    createExecutiveSummary(workbook, allDomainsData);
    createDomainPerformance(workbook, allDomainsData);
    createTopQueries(workbook, allDomainsData);
    createTopPages(workbook, allDomainsData);
    createStrikingDistance(workbook, allDomainsData);
    createOpportunities(workbook, allDomainsData);

    // Save workbook
    await workbook.xlsx.writeFile(outputPath);

    console.log(chalk.green(`✓ Excel report generated: ${outputPath}`));
    return outputPath;
  } catch (error) {
    console.error(chalk.red('✗ Failed to generate Excel report:'), error.message);
    throw error;
  }
}

/**
 * Analyze commercial intent keywords and growth potential
 */
function analyzeCommercialIntent(queries) {
  const commercialKeywords = [
    'software', 'app', 'tool', 'system', 'platform', 'solution',
    'management', 'booking', 'scheduling', 'crm', 'calculator',
    'pricing', 'cost', 'best', 'top', 'vs', 'alternative',
    'review', 'comparison', 'how to', 'guide'
  ];

  const highIntentTerms = ['buy', 'price', 'pricing', 'cost', 'calculator', 'demo', 'trial', 'sign up'];

  return queries.map(query => {
    const queryLower = query.query.toLowerCase();

    // Commercial intent score
    let intentScore = 0;
    commercialKeywords.forEach(keyword => {
      if (queryLower.includes(keyword)) intentScore += 1;
    });

    // High intent bonus
    highIntentTerms.forEach(term => {
      if (queryLower.includes(term)) intentScore += 3;
    });

    // Position bonus (closer to page 1 = higher potential)
    const positionScore = query.position <= 20 ? (20 - query.position) : 0;

    // Impression value (shows demand)
    const impressionScore = Math.log10(query.impressions + 1) * 2;

    // Calculate total growth potential
    const growthPotential = (intentScore * 10) + positionScore + impressionScore;

    return {
      ...query,
      intentScore,
      growthPotential,
      isCommercial: intentScore > 0
    };
  });
}

/**
 * Create Growth Potential Analysis worksheet
 */
function createGrowthPotentialAnalysis(workbook, allDomainsData) {
  const sheet = workbook.addWorksheet('Growth Potential Analysis', { state: 'visible', tabColor: { argb: 'FFFF6B6B' } });

  // Title
  sheet.mergeCells('A1:G1');
  sheet.getCell('A1').value = '🚀 WHICH APPLICATION TO BUILD FIRST?';
  sheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getCell('A1').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFF6B6B' }
  };
  sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 35;

  // Subtitle
  sheet.mergeCells('A2:G2');
  sheet.getCell('A2').value = 'Analysis of commercial intent keywords and traffic growth potential';
  sheet.getCell('A2').font = { size: 11, italic: true };
  sheet.getCell('A2').alignment = { horizontal: 'center' };
  sheet.getRow(2).height = 20;

  // Analyze each domain
  const domainAnalysis = allDomainsData.map(domainData => {
    const analyzedQueries = analyzeCommercialIntent(domainData.topQueries || []);

    // Commercial keywords only
    const commercialQueries = analyzedQueries.filter(q => q.isCommercial);

    // Top opportunities (high intent + good position)
    const topOpportunities = analyzedQueries
      .filter(q => q.isCommercial && q.position <= 30)
      .sort((a, b) => b.growthPotential - a.growthPotential)
      .slice(0, 10);

    // Calculate scores
    const commercialImpressions = commercialQueries.reduce((sum, q) => sum + q.impressions, 0);
    const commercialClicks = commercialQueries.reduce((sum, q) => sum + q.clicks, 0);
    const avgCommercialPosition = commercialQueries.length > 0
      ? commercialQueries.reduce((sum, q) => sum + q.position, 0) / commercialQueries.length
      : 999;

    const growthScore = topOpportunities.reduce((sum, q) => sum + q.growthPotential, 0);

    return {
      domain: domainData.domain,
      commercialQueryCount: commercialQueries.length,
      commercialImpressions,
      commercialClicks,
      avgCommercialPosition,
      growthScore,
      topOpportunities
    };
  });

  // Sort by growth score
  domainAnalysis.sort((a, b) => b.growthScore - a.growthScore);

  // Recommendation section
  sheet.addRow([]);
  sheet.mergeCells('A4:G4');
  const recCell = sheet.getCell('A4');
  recCell.value = `🏆 RECOMMENDATION: Build ${domainAnalysis[0].domain.toUpperCase()} First`;
  recCell.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  recCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF6BCF7F' }
  };
  recCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(4).height = 30;

  // Domain comparison table
  sheet.addRow([]);
  sheet.addRow([]);
  const headerRow = sheet.addRow(['Rank', 'Domain', 'Commercial Keywords', 'Commercial Impressions', 'Avg Position', 'Growth Score', 'Priority']);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1A1A2E' }
  };
  headerRow.height = 25;

  domainAnalysis.forEach((analysis, index) => {
    const priority = index === 0 ? '⭐ HIGH' : index === 1 ? 'MEDIUM' : 'LOW';

    const row = sheet.addRow([
      index + 1,
      analysis.domain,
      analysis.commercialQueryCount,
      analysis.commercialImpressions,
      analysis.avgCommercialPosition.toFixed(1),
      Math.round(analysis.growthScore),
      priority
    ]);

    if (index === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCFF4D2' }
      };
      row.font = { bold: true };
    }
  });

  // Detailed analysis for top domain
  sheet.addRow([]);
  sheet.addRow([]);
  sheet.mergeCells(`A${sheet.rowCount + 1}:G${sheet.rowCount + 1}`);
  const detailHeader = sheet.getCell(`A${sheet.rowCount}`);
  detailHeader.value = `📊 WHY ${domainAnalysis[0].domain.toUpperCase()}?`;
  detailHeader.font = { size: 12, bold: true };
  detailHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8E8E8' }
  };
  sheet.getRow(sheet.rowCount).height = 25;

  // Top opportunities for #1 domain
  sheet.addRow([]);
  const oppHeaderRow = sheet.addRow(['Query', 'Position', 'Impressions', 'Clicks', 'Intent Score', 'Growth Potential', 'Action']);
  oppHeaderRow.font = { bold: true };
  oppHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFD93D' }
  };

  domainAnalysis[0].topOpportunities.slice(0, 10).forEach(opp => {
    const action = opp.position <= 10 ? 'Optimize to top 3' :
                   opp.position <= 20 ? 'Push to page 1' : 'Build content';

    sheet.addRow([
      opp.query,
      opp.position.toFixed(1),
      opp.impressions,
      opp.clicks,
      opp.intentScore,
      Math.round(opp.growthPotential),
      action
    ]);
  });

  // Reasoning section
  sheet.addRow([]);
  sheet.addRow([]);
  sheet.mergeCells(`A${sheet.rowCount + 1}:G${sheet.rowCount + 1}`);
  const reasonHeader = sheet.getCell(`A${sheet.rowCount}`);
  reasonHeader.value = '💡 KEY INSIGHTS';
  reasonHeader.font = { size: 12, bold: true };
  reasonHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8E8E8' }
  };
  sheet.getRow(sheet.rowCount).height = 25;

  // Add insights
  const insights = [
    ['Metric', 'Finding', 'Impact'],
  ];

  const topDomain = domainAnalysis[0];
  insights.push(
    ['Commercial Intent', `${topDomain.commercialQueryCount} commercial keywords tracked`, 'High buying intent from searchers'],
    ['Market Demand', `${topDomain.commercialImpressions.toLocaleString()} impressions on commercial terms`, 'Proven search demand exists'],
    ['Competition Gap', `Average position ${topDomain.avgCommercialPosition.toFixed(1)}`, topDomain.avgCommercialPosition < 30 ? 'Low competition, easier to rank' : 'Need SEO investment'],
    ['Growth Potential', `Score: ${Math.round(topDomain.growthScore)}`, 'Highest opportunity for quick wins']
  );

  insights.forEach((insight, index) => {
    const row = sheet.addRow(insight);
    if (index === 0) {
      row.font = { bold: true };
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFD93D' }
      };
    }
  });

  // Column widths
  sheet.getColumn(1).width = 8;
  sheet.getColumn(2).width = 35;
  sheet.getColumn(3).width = 20;
  sheet.getColumn(4).width = 20;
  sheet.getColumn(5).width = 15;
  sheet.getColumn(6).width = 15;
  sheet.getColumn(7).width = 25;

  // Number formatting
  sheet.getColumn(4).numFmt = '#,##0';

  // Freeze panes
  sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 7 }];
}

/**
 * Create Executive Summary worksheet
 */
function createExecutiveSummary(workbook, allDomainsData) {
  const sheet = workbook.addWorksheet('Executive Summary');

  // Title
  sheet.mergeCells('A1:F1');
  sheet.getCell('A1').value = 'SEO Performance Dashboard';
  sheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF1A1A2E' } };
  sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 30;

  // Date range
  const dateRange = allDomainsData[0]?.dateRange || {};
  sheet.mergeCells('A2:F2');
  sheet.getCell('A2').value = `Period: ${dateRange.start} to ${dateRange.end}`;
  sheet.getCell('A2').font = { size: 11, italic: true };
  sheet.getCell('A2').alignment = { horizontal: 'center' };
  sheet.getRow(2).height = 20;

  // Headers
  sheet.addRow([]);
  const headerRow = sheet.addRow(['Domain', 'Clicks', 'Impressions', 'CTR', 'Avg Position', 'Status']);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1A1A2E' }
  };
  headerRow.height = 25;
  headerRow.alignment = { vertical: 'middle' };

  // Data rows
  let totalClicks = 0;
  let totalImpressions = 0;

  allDomainsData.forEach(domainData => {
    const metrics = domainData.metrics;
    totalClicks += metrics.totalClicks;
    totalImpressions += metrics.totalImpressions;

    const status = metrics.totalClicks > 5 ? '🟢 Good' :
                   metrics.totalClicks > 0 ? '🟡 Fair' : '🔴 Needs Work';

    const row = sheet.addRow([
      domainData.domain,
      metrics.totalClicks,
      metrics.totalImpressions,
      (metrics.avgCtr * 100).toFixed(2) + '%',
      metrics.avgPosition.toFixed(1),
      status
    ]);

    row.height = 20;
  });

  // Total row
  const totalRow = sheet.addRow([
    'TOTAL',
    totalClicks,
    totalImpressions,
    totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) + '%' : '0.0%',
    '',
    ''
  ]);
  totalRow.font = { bold: true };
  totalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8E8E8' }
  };

  // Column widths
  sheet.getColumn(1).width = 25;
  sheet.getColumn(2).width = 12;
  sheet.getColumn(3).width = 15;
  sheet.getColumn(4).width = 10;
  sheet.getColumn(5).width = 15;
  sheet.getColumn(6).width = 15;

  // Number formatting
  sheet.getColumn(2).numFmt = '#,##0';
  sheet.getColumn(3).numFmt = '#,##0';

  // Freeze panes
  sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];
}

/**
 * Create Domain Performance worksheet
 */
function createDomainPerformance(workbook, allDomainsData) {
  const sheet = workbook.addWorksheet('Domain Performance');

  // Title
  sheet.mergeCells('A1:E1');
  sheet.getCell('A1').value = 'Detailed Performance by Domain';
  sheet.getCell('A1').font = { size: 14, bold: true };
  sheet.getCell('A1').alignment = { horizontal: 'center' };
  sheet.getRow(1).height = 25;

  allDomainsData.forEach((domainData, index) => {
    const startRow = sheet.rowCount + 2;

    // Domain header
    sheet.mergeCells(`A${startRow}:E${startRow}`);
    const headerCell = sheet.getCell(`A${startRow}`);
    headerCell.value = domainData.domain;
    headerCell.font = { size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    headerCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE94560' }
    };
    headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(startRow).height = 25;

    // Metrics
    const metricsStart = startRow + 1;
    sheet.addRow(['Metric', 'Value', '', '', '']);
    sheet.addRow(['Total Clicks', domainData.metrics.totalClicks]);
    sheet.addRow(['Total Impressions', domainData.metrics.totalImpressions]);
    sheet.addRow(['Average CTR', (domainData.metrics.avgCtr * 100).toFixed(2) + '%']);
    sheet.addRow(['Average Position', domainData.metrics.avgPosition.toFixed(1)]);
    sheet.addRow(['Queries Tracked', domainData.topQueries?.length || 0]);
    sheet.addRow(['Pages with Data', domainData.topPages?.length || 0]);

    // Style metrics rows
    for (let i = metricsStart; i < sheet.rowCount + 1; i++) {
      sheet.getRow(i).getCell(1).font = { bold: true };
    }
  });

  // Column widths
  sheet.getColumn(1).width = 20;
  sheet.getColumn(2).width = 20;
}

/**
 * Create Top Queries worksheet
 */
function createTopQueries(workbook, allDomainsData) {
  const sheet = workbook.addWorksheet('Top Queries');

  // Title
  sheet.mergeCells('A1:F1');
  sheet.getCell('A1').value = 'Top Queries Across All Domains';
  sheet.getCell('A1').font = { size: 14, bold: true };
  sheet.getCell('A1').alignment = { horizontal: 'center' };
  sheet.getRow(1).height = 25;

  // Headers
  sheet.addRow([]);
  const headerRow = sheet.addRow(['Domain', 'Query', 'Clicks', 'Impressions', 'CTR', 'Position']);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1A1A2E' }
  };
  headerRow.height = 25;

  // Combine all queries from all domains
  const allQueries = [];
  allDomainsData.forEach(domainData => {
    (domainData.topQueries || []).forEach(query => {
      allQueries.push({
        domain: domainData.domain,
        ...query
      });
    });
  });

  // Sort by clicks descending
  allQueries.sort((a, b) => b.clicks - a.clicks);

  // Add data rows (limit to top 200)
  allQueries.slice(0, 200).forEach(query => {
    const row = sheet.addRow([
      query.domain,
      query.query,
      query.clicks,
      query.impressions,
      (query.ctr * 100).toFixed(2) + '%',
      query.position.toFixed(1)
    ]);

    // Conditional formatting for position
    const posCell = row.getCell(6);
    if (query.position <= 10) {
      posCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } };
    } else if (query.position <= 20) {
      posCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
    }
  });

  // Column widths
  sheet.getColumn(1).width = 25;
  sheet.getColumn(2).width = 50;
  sheet.getColumn(3).width = 12;
  sheet.getColumn(4).width = 15;
  sheet.getColumn(5).width = 10;
  sheet.getColumn(6).width = 12;

  // Number formatting
  sheet.getColumn(3).numFmt = '#,##0';
  sheet.getColumn(4).numFmt = '#,##0';

  // Auto-filter
  sheet.autoFilter = {
    from: 'A3',
    to: 'F3'
  };

  // Freeze panes
  sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 3 }];
}

/**
 * Create Top Pages worksheet
 */
function createTopPages(workbook, allDomainsData) {
  const sheet = workbook.addWorksheet('Top Pages');

  // Title
  sheet.mergeCells('A1:F1');
  sheet.getCell('A1').value = 'Top Pages Across All Domains';
  sheet.getCell('A1').font = { size: 14, bold: true };
  sheet.getCell('A1').alignment = { horizontal: 'center' };
  sheet.getRow(1).height = 25;

  // Headers
  sheet.addRow([]);
  const headerRow = sheet.addRow(['Domain', 'Page', 'Clicks', 'Impressions', 'CTR', 'Position']);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1A1A2E' }
  };
  headerRow.height = 25;

  // Combine all pages from all domains
  const allPages = [];
  allDomainsData.forEach(domainData => {
    (domainData.topPages || []).forEach(page => {
      allPages.push({
        domain: domainData.domain,
        ...page
      });
    });
  });

  // Sort by clicks descending
  allPages.sort((a, b) => b.clicks - a.clicks);

  // Add data rows (limit to top 100)
  allPages.slice(0, 100).forEach(page => {
    const row = sheet.addRow([
      page.domain,
      page.page,
      page.clicks,
      page.impressions,
      (page.ctr * 100).toFixed(2) + '%',
      page.position.toFixed(1)
    ]);
  });

  // Column widths
  sheet.getColumn(1).width = 25;
  sheet.getColumn(2).width = 60;
  sheet.getColumn(3).width = 12;
  sheet.getColumn(4).width = 15;
  sheet.getColumn(5).width = 10;
  sheet.getColumn(6).width = 12;

  // Number formatting
  sheet.getColumn(3).numFmt = '#,##0';
  sheet.getColumn(4).numFmt = '#,##0';

  // Auto-filter
  sheet.autoFilter = {
    from: 'A3',
    to: 'F3'
  };

  // Freeze panes
  sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 3 }];
}

/**
 * Create Striking Distance worksheet (positions 4-20)
 */
function createStrikingDistance(workbook, allDomainsData) {
  const sheet = workbook.addWorksheet('Striking Distance');

  // Title
  sheet.mergeCells('A1:G1');
  sheet.getCell('A1').value = 'Striking Distance Keywords (Positions 4-20)';
  sheet.getCell('A1').font = { size: 14, bold: true };
  sheet.getCell('A1').alignment = { horizontal: 'center' };
  sheet.getRow(1).height = 25;

  // Description
  sheet.mergeCells('A2:G2');
  sheet.getCell('A2').value = 'These keywords are close to page 1 - optimize them for quick wins!';
  sheet.getCell('A2').font = { italic: true, size: 10 };
  sheet.getCell('A2').alignment = { horizontal: 'center' };

  // Headers
  sheet.addRow([]);
  const headerRow = sheet.addRow(['Domain', 'Query', 'Clicks', 'Impressions', 'CTR', 'Position', 'Priority']);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFF8C00' }
  };
  headerRow.height = 25;

  // Find striking distance keywords
  const strikingDistance = [];
  allDomainsData.forEach(domainData => {
    (domainData.topQueries || []).forEach(query => {
      if (query.position >= 4 && query.position <= 20) {
        // Calculate priority score (higher impressions + lower position = higher priority)
        const priorityScore = query.impressions / query.position;
        const priority = priorityScore > 50 ? 'HIGH' :
                        priorityScore > 10 ? 'MEDIUM' : 'LOW';

        strikingDistance.push({
          domain: domainData.domain,
          query: query.query,
          clicks: query.clicks,
          impressions: query.impressions,
          ctr: query.ctr,
          position: query.position,
          priority
        });
      }
    });
  });

  // Sort by position ascending (best positions first)
  strikingDistance.sort((a, b) => a.position - b.position);

  // Add data rows
  strikingDistance.forEach(item => {
    const row = sheet.addRow([
      item.domain,
      item.query,
      item.clicks,
      item.impressions,
      (item.ctr * 100).toFixed(2) + '%',
      item.position.toFixed(1),
      item.priority
    ]);

    // Highlight priority
    const priorityCell = row.getCell(7);
    if (item.priority === 'HIGH') {
      priorityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6B6B' } };
      priorityCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    } else if (item.priority === 'MEDIUM') {
      priorityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD93D' } };
    }
  });

  // Column widths
  sheet.getColumn(1).width = 25;
  sheet.getColumn(2).width = 50;
  sheet.getColumn(3).width = 12;
  sheet.getColumn(4).width = 15;
  sheet.getColumn(5).width = 10;
  sheet.getColumn(6).width = 12;
  sheet.getColumn(7).width = 12;

  // Number formatting
  sheet.getColumn(3).numFmt = '#,##0';
  sheet.getColumn(4).numFmt = '#,##0';

  // Auto-filter
  sheet.autoFilter = {
    from: 'A4',
    to: 'G4'
  };

  // Freeze panes
  sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];
}

/**
 * Create Opportunities worksheet (high impressions, low CTR)
 */
function createOpportunities(workbook, allDomainsData) {
  const sheet = workbook.addWorksheet('Opportunities');

  // Title
  sheet.mergeCells('A1:H1');
  sheet.getCell('A1').value = 'Content Optimization Opportunities';
  sheet.getCell('A1').font = { size: 14, bold: true };
  sheet.getCell('A1').alignment = { horizontal: 'center' };
  sheet.getRow(1).height = 25;

  // Description
  sheet.mergeCells('A2:H2');
  sheet.getCell('A2').value = 'High impressions but low CTR - improve titles and meta descriptions!';
  sheet.getCell('A2').font = { italic: true, size: 10 };
  sheet.getCell('A2').alignment = { horizontal: 'center' };

  // Headers
  sheet.addRow([]);
  const headerRow = sheet.addRow(['Domain', 'Query', 'Clicks', 'Impressions', 'CTR', 'Position', 'Expected CTR', 'Opportunity']);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF6BCF7F' }
  };
  headerRow.height = 25;

  // Find opportunity keywords
  const opportunities = [];
  allDomainsData.forEach(domainData => {
    (domainData.topQueries || []).forEach(query => {
      // Expected CTR based on position (rough estimates)
      const expectedCTR = query.position <= 3 ? 0.25 :
                         query.position <= 10 ? 0.10 :
                         query.position <= 20 ? 0.03 : 0.01;

      // If actual CTR is significantly below expected and has decent impressions
      if (query.ctr < expectedCTR * 0.5 && query.impressions >= 10) {
        const opportunityScore = (expectedCTR - query.ctr) * query.impressions;

        opportunities.push({
          domain: domainData.domain,
          query: query.query,
          clicks: query.clicks,
          impressions: query.impressions,
          ctr: query.ctr,
          position: query.position,
          expectedCTR,
          opportunityScore
        });
      }
    });
  });

  // Sort by opportunity score descending
  opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);

  // Add data rows
  opportunities.slice(0, 50).forEach(item => {
    const row = sheet.addRow([
      item.domain,
      item.query,
      item.clicks,
      item.impressions,
      (item.ctr * 100).toFixed(2) + '%',
      item.position.toFixed(1),
      (item.expectedCTR * 100).toFixed(1) + '%',
      item.opportunityScore.toFixed(0)
    ]);
  });

  // Column widths
  sheet.getColumn(1).width = 25;
  sheet.getColumn(2).width = 50;
  sheet.getColumn(3).width = 12;
  sheet.getColumn(4).width = 15;
  sheet.getColumn(5).width = 10;
  sheet.getColumn(6).width = 12;
  sheet.getColumn(7).width = 15;
  sheet.getColumn(8).width = 15;

  // Number formatting
  sheet.getColumn(3).numFmt = '#,##0';
  sheet.getColumn(4).numFmt = '#,##0';

  // Auto-filter
  sheet.autoFilter = {
    from: 'A4',
    to: 'H4'
  };

  // Freeze panes
  sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];
}
