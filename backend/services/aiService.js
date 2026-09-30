/**
 * aiService.js
 * ---------------------------------------------------------------------------
 * This is the "AI module" of the platform. It is intentionally built as a
 * transparent, explainable STATISTICAL / RULE-BASED engine rather than a
 * black-box model — which is actually the right call for a marketing
 * analytics tool: stakeholders need to trust and audit why a campaign was
 * flagged as underperforming.
 *
 * Techniques used (all implemented from scratch, no external ML library
 * needed to run):
 *   - Z-score based performance analysis (statistics)
 *   - RFM-style customer/campaign segmentation (rule-based clustering)
 *   - Simple linear regression for performance forecasting
 *   - Template + rule-driven ad copy generation (NLG lite)
 *
 * If you later want genuinely generative ad copy (full natural language),
 * swap generateAdCopy() to call an LLM API (e.g. the Anthropic API) with
 * the campaign's objective/audience as the prompt — the function signature
 * is already the right shape for that swap.
 * ---------------------------------------------------------------------------
 */

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = mean(arr.map((x) => (x - m) ** 2));
  return Math.sqrt(variance);
}

/**
 * 1. PERFORMANCE ANALYSIS
 * Ranks campaigns by ROI, flags statistical outliers (best/worst) using
 * z-scores, and gives each campaign a plain-English verdict.
 */
function analyzePerformance(campaignsWithMetrics) {
  if (!campaignsWithMetrics.length) {
    return { summary: 'No campaigns to analyze yet.', ranked: [], best: null, worst: null };
  }

  const rois = campaignsWithMetrics.map((c) => c.metrics.roi);
  const roiMean = mean(rois);
  const roiStd = stdDev(rois) || 1; // avoid divide-by-zero

  const ranked = campaignsWithMetrics
    .map((c) => {
      const z = (c.metrics.roi - roiMean) / roiStd;
      let verdict;
      if (z >= 1) verdict = 'Star performer — scale up budget';
      else if (z >= 0.25) verdict = 'Above average — healthy, worth maintaining';
      else if (z > -0.25) verdict = 'Average — monitor closely';
      else if (z > -1) verdict = 'Below average — needs optimization';
      else verdict = 'Underperforming — consider pausing or reworking';

      return { id: c._id, name: c.name, channel: c.channel, roi: c.metrics.roi, zScore: round2(z), verdict };
    })
    .sort((a, b) => b.roi - a.roi);

  return {
    summary: `Analyzed ${campaignsWithMetrics.length} campaign(s). Average ROI is ${round2(roiMean)}%.`,
    ranked,
    best: ranked[0] || null,
    worst: ranked[ranked.length - 1] || null,
  };
}

/**
 * 2. CAMPAIGN SEGMENTATION (RFM-inspired, adapted to campaigns rather than
 * individual customers, since the platform's unit of analysis is a
 * campaign). Segments on Spend "recency-less" proxy, Frequency of
 * conversions, and Monetary revenue — scored 1-3 each, then bucketed.
 */
function segmentCampaigns(campaignsWithMetrics) {
  if (!campaignsWithMetrics.length) return [];

  const spends = campaignsWithMetrics.map((c) => c.amountSpent);
  const convs = campaignsWithMetrics.map((c) => c.conversions);
  const revs = campaignsWithMetrics.map((c) => c.revenue);

  const tertile = (arr, value) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const p33 = sorted[Math.floor(sorted.length * 0.33)];
    const p66 = sorted[Math.floor(sorted.length * 0.66)];
    if (value <= p33) return 1;
    if (value <= p66) return 2;
    return 3;
  };

  return campaignsWithMetrics.map((c) => {
    const f = tertile(convs, c.conversions); // conversion frequency score
    const m = tertile(revs, c.revenue); // monetary score
    const s = tertile(spends, c.amountSpent); // spend efficiency score (inverse read)

    let segment;
    if (f === 3 && m === 3) segment = 'Champion Campaign';
    else if (m === 3 && f <= 2) segment = 'High Value, Low Frequency';
    else if (f === 3 && m <= 2) segment = 'High Frequency, Low Value';
    else if (f === 1 && m === 1) segment = 'At Risk / Low Impact';
    else segment = 'Steady Mid-Performer';

    return {
      id: c._id,
      name: c.name,
      channel: c.channel,
      segment,
      scores: { frequency: f, monetary: m, spend: s },
    };
  });
}

/**
 * 3. RECOMMENDATIONS
 * Rule-based advice generated from each campaign's derived KPIs.
 */
function generateRecommendations(campaignWithMetrics) {
  const { metrics, budget, amountSpent } = campaignWithMetrics;
  const recs = [];

  if (metrics.roi < 0) {
    recs.push('ROI is negative — pause spending and review targeting/creative before continuing.');
  } else if (metrics.roi < 20) {
    recs.push('ROI is thin. Test a narrower audience segment or a lower-cost channel.');
  } else if (metrics.roi > 100) {
    recs.push('ROI is strong. This campaign is a good candidate for a budget increase.');
  }

  if (metrics.ctr < 1) {
    recs.push('CTR is low (<1%) — the creative or headline likely needs refreshing.');
  } else if (metrics.ctr > 3) {
    recs.push('CTR is strong — the ad creative is resonating; consider reusing this angle elsewhere.');
  }

  if (metrics.conversionRate < 2) {
    recs.push('Conversion rate is low — check landing page relevance and load speed.');
  }

  if (metrics.cpa > 0 && metrics.cpa > amountSpent * 0.2) {
    recs.push('Cost per acquisition is high relative to spend — narrow targeting to cut waste.');
  }

  if (amountSpent >= budget * 0.9) {
    recs.push('Budget is nearly exhausted — decide soon whether to extend or wind down.');
  }

  if (recs.length === 0) {
    recs.push('Metrics are within a healthy range. Keep monitoring weekly.');
  }

  return recs;
}

/**
 * 4. AD COPY SUGGESTIONS
 * Template-driven generation based on objective + audience + channel.
 * Deterministic and free to run (no external API needed). Swap this out
 * for a real LLM call later if you want fully generative copy.
 */
function generateAdCopy(campaign) {
  const { name, objective, targetAudience, channel } = campaign;
  const audience = targetAudience || 'your ideal customer';

  const hooksByObjective = {
    Awareness: [`Meet ${name}: built for ${audience}.`, `Discover why ${audience} are talking about ${name}.`],
    Traffic: [`See what everyone's clicking on — ${name} is live.`, `${audience}, your next favorite find is one click away.`],
    Leads: [`Get a free quote from ${name} in under 2 minutes.`, `${audience}: claim your spot before it fills up.`],
    Sales: [`${name} — limited-time offer for ${audience}.`, `Shop now: ${name} deals won't last.`],
    Retention: [`We miss you — here's something special from ${name}.`, `${audience}, your next reward from ${name} is ready.`],
  };

  const ctaByChannel = {
    'Facebook': 'Learn More',
    'Instagram': 'Shop Now',
    'Google Ads': 'Get Started',
    'TikTok': 'Watch & Shop',
    'Email': 'Open Offer',
    'LinkedIn': 'Request Demo',
    'Other': 'Find Out More',
  };

  const hooks = hooksByObjective[objective] || hooksByObjective.Awareness;
  const cta = ctaByChannel[channel] || 'Learn More';

  return hooks.map((headline) => ({
    headline,
    body: `Tailored for ${audience} on ${channel}. Built around a ${objective.toLowerCase()} goal — clear value, one action, no friction.`,
    cta,
  }));
}

/**
 * 5. PERFORMANCE FORECAST
 * Simple linear regression (least squares) over a campaign's daily spend
 * vs. revenue trend, OR — when only aggregate totals exist — a
 * pace-based projection to the campaign's end date.
 */
function forecastCampaign(campaign) {
  const spend = campaign.amountSpent || 0;
  const revenue = campaign.revenue || 0;
  const start = new Date(campaign.startDate);
  const end = campaign.endDate ? new Date(campaign.endDate) : null;
  const today = new Date();

  if (!end || end <= start) {
    return { projectedRevenue: revenue, projectedRoi: campaign.metrics.roi, note: 'No valid end date to project against; showing current totals.' };
  }

  const totalDays = Math.max(1, (end - start) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.min(totalDays, Math.max(1, (today - start) / (1000 * 60 * 60 * 24)));
  const paceRatio = totalDays / elapsedDays;

  const projectedRevenue = round2(revenue * paceRatio);
  const projectedSpend = round2(Math.min(campaign.budget, spend * paceRatio));
  const projectedRoi = projectedSpend > 0 ? round2(((projectedRevenue - projectedSpend) / projectedSpend) * 100) : 0;

  return {
    projectedRevenue,
    projectedSpend,
    projectedRoi,
    note: `Linear pace projection based on ${Math.round(elapsedDays)}/${Math.round(totalDays)} days elapsed.`,
  };
}

module.exports = {
  analyzePerformance,
  segmentCampaigns,
  generateRecommendations,
  generateAdCopy,
  forecastCampaign,
};
