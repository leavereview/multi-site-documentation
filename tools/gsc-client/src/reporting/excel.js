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
