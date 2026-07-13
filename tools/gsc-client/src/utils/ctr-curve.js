/**
 * Expected organic CTR by SERP position.
 *
 * Why this exists: judging a site's CTR against a flat "2-3% is healthy" benchmark is
 * meaningless when the site ranks on page 3. A 0.19% CTR at average position 39 is not a
 * snippet failure — it is exactly what position 39 pays. Treating it as a snippet failure
 * sends you off to rewrite meta descriptions that cannot possibly earn clicks, which is a
 * real cost this repo has already paid several times over.
 *
 * The curve below is the usual industry aggregate (blended desktop/mobile, all intents).
 * It is a benchmark, not ground truth: a brand/navigational query outperforms it and a
 * query dominated by ads or an AI overview underperforms it. Use it to spot *large*
 * divergences, not to chase small ones.
 *
 * All CTR values are FRACTIONS (0.024 = 2.4%), matching the GSC API's own units.
 */

const CTR_BY_POSITION = {
  1: 0.276, 2: 0.158, 3: 0.110, 4: 0.084, 5: 0.063,
  6: 0.049, 7: 0.039, 8: 0.033, 9: 0.028, 10: 0.024,
  11: 0.018, 12: 0.015, 13: 0.013, 14: 0.012, 15: 0.011,
  16: 0.010, 17: 0.0095, 18: 0.0090, 19: 0.0085, 20: 0.0080
};

// Beyond position 20 the table runs out, so decay exponentially from the position-20 value.
// Continuous at 20, and still separates position 25 from position 85 rather than flattening
// everything past page 2 into one "bad" bucket.
//
// Treat these tail values as INDICATIVE ONLY. Published CTR curves barely agree past page 2
// (the samples are small and noisy), so do not use them to manufacture "you are losing N
// clicks" claims — see RELIABLE_MAX_POSITION.
const TAIL_ANCHOR = 20;
const TAIL_CTR = CTR_BY_POSITION[TAIL_ANCHOR];
const TAIL_DECAY = 14;

/**
 * Deepest position where the curve is trustworthy enough to make a claim on.
 *
 * Two separate reasons to stop at 20:
 *
 *  1. Measurement — CTR past page 2 is barely distinguishable from zero and the published
 *     curves disagree wildly. An "expected clicks" figure built on it is fiction.
 *
 *  2. Aggregation — expectedCtr is CONVEX, so applying it to an AVERAGED position (a site's
 *     avg position, or GSC's per-page position averaged over all its queries) is a Jensen's
 *     inequality error. It over-predicts, and it over-predicts hardest in the deep tail, where
 *     a page averaging position 34 gets credited with clicks nobody on page 4 ever makes.
 *
 * Beyond this, the honest statement is not "your snippet is underperforming" — it is "you are
 * too deep to be clicked at all, and ranking is the constraint."
 */
export const RELIABLE_MAX_POSITION = 20;

/**
 * Expected CTR for a (possibly fractional) average position.
 * @param {number} position - 1-based SERP position
 * @returns {number} expected CTR as a fraction
 */
export function expectedCtr(position) {
  if (!Number.isFinite(position) || position < 1) return CTR_BY_POSITION[1];

  if (position > TAIL_ANCHOR) {
    return TAIL_CTR * Math.exp(-(position - TAIL_ANCHOR) / TAIL_DECAY);
  }

  // Linearly interpolate between the two bracketing integer positions.
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return CTR_BY_POSITION[lower];

  const weight = position - lower;
  return CTR_BY_POSITION[lower] * (1 - weight) + CTR_BY_POSITION[upper] * weight;
}

/**
 * Compare actual clicks against what the held positions should have paid.
 *
 * Operates on any rows carrying { position, impressions, clicks } — GSC queries or pages both
 * work. `actualClicks` is the clicks from those same rows (NOT the site total), so the
 * comparison stays apples-to-apples.
 *
 * ONLY counts rows within RELIABLE_MAX_POSITION. Rows deeper than that are excluded rather
 * than predicted, because the curve cannot honestly price them (see RELIABLE_MAX_POSITION).
 * A site with nothing inside the band returns ratio: null — which is the correct answer:
 * "there is no CTR verdict to give, you aren't ranking anywhere clicks exist."
 *
 * @param {Array<{position:number, impressions:number, clicks:number}>} rows
 * @returns {{expectedClicks:number, actualClicks:number, impressions:number, ratio:number|null, rows:number}}
 */
export function ctrPerformance(rows) {
  const usable = (rows || []).filter(
    r => Number.isFinite(r?.position) && Number.isFinite(r?.impressions) && r.impressions > 0 &&
         r.position <= RELIABLE_MAX_POSITION
  );

  const expectedClicks = usable.reduce((sum, r) => sum + r.impressions * expectedCtr(r.position), 0);
  const actualClicks = usable.reduce((sum, r) => sum + (r.clicks || 0), 0);
  const impressions = usable.reduce((sum, r) => sum + r.impressions, 0);

  return {
    expectedClicks,
    actualClicks,
    impressions,
    ratio: expectedClicks > 0 ? actualClicks / expectedClicks : null,
    rows: usable.length
  };
}

/**
 * Clicks gained by lifting a row from its current position to `target`.
 * Zero for rows already at or above the target.
 */
export function clickUpside(row, target = 3) {
  if (!Number.isFinite(row?.position) || row.position <= target) return 0;
  return row.impressions * (expectedCtr(target) - expectedCtr(row.position));
}

/**
 * Rows that rank in the clickable band but are not being clicked.
 *
 * Returns the rows themselves, deliberately — NOT a summed "you are losing N clicks" figure.
 *
 * That summed figure is a trap. On mydojo it came out as "116 expected clicks", of which 97 came
 * from a single page: /blog/adult-karate-classes-guide/, 4,770 impressions at position 10.6 and
 * zero clicks. The number implied "rewrite the meta and collect ~100 clicks". The truth is that
 * the page ranks for people searching for a local karate class to attend, while the product is
 * software for the dojo OWNER. That traffic will never click, and would bounce if it did. No
 * snippet can fix an intent mismatch — but an aggregate upside number confidently says it can.
 *
 * So: surface the pages, state the facts about each, and let a human judge whether the intent
 * matches. `shortfall` is provided for RANKING only, not as a promise.
 *
 * @param {Array<{page?:string, query?:string, position:number, impressions:number, clicks:number}>} rows
 * @param {{minImpressions?:number, maxRatio?:number}} [opts]
 */
export function underperformingRows(rows, opts = {}) {
  const minImpressions = opts.minImpressions ?? 100;
  const maxRatio = opts.maxRatio ?? 0.4;

  return (rows || [])
    .filter(r =>
      Number.isFinite(r?.position) &&
      r.position <= RELIABLE_MAX_POSITION &&
      r.impressions >= minImpressions
    )
    .map(r => {
      const expected = r.impressions * expectedCtr(r.position);
      return { ...r, expected, ratio: expected > 0 ? (r.clicks || 0) / expected : null };
    })
    .filter(r => r.ratio !== null && r.ratio < maxRatio)
    .sort((a, b) => b.impressions - a.impressions);
}
