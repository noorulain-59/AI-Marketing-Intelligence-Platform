const Campaign = require('../models/Campaign');

// GET /api/dashboard
async function getDashboard(req, res) {
  try {
    const filter = req.user.role === 'admin' ? {} : { owner: req.user._id };
    const campaigns = await Campaign.find(filter);

    if (campaigns.length === 0) {
      return res.json({
        totals: { spend: 0, revenue: 0, impressions: 0, clicks: 0, conversions: 0 },
        kpis: { roi: 0, ctr: 0, cpc: 0, cpa: 0, conversionRate: 0 },
        bestCampaign: null,
        worstCampaign: null,
        campaignCount: 0,
        byChannel: [],
      });
    }

    const totals = campaigns.reduce(
      (acc, c) => {
        acc.spend += c.amountSpent || 0;
        acc.revenue += c.revenue || 0;
        acc.impressions += c.impressions || 0;
        acc.clicks += c.clicks || 0;
        acc.conversions += c.conversions || 0;
        return acc;
      },
      { spend: 0, revenue: 0, impressions: 0, clicks: 0, conversions: 0 }
    );

    const kpis = {
      roi: totals.spend > 0 ? round2(((totals.revenue - totals.spend) / totals.spend) * 100) : 0,
      ctr: totals.impressions > 0 ? round2((totals.clicks / totals.impressions) * 100) : 0,
      cpc: totals.clicks > 0 ? round2(totals.spend / totals.clicks) : 0,
      cpa: totals.conversions > 0 ? round2(totals.spend / totals.conversions) : 0,
      conversionRate: totals.clicks > 0 ? round2((totals.conversions / totals.clicks) * 100) : 0,
    };

    const withRoi = campaigns.map((c) => {
      const m = c.metrics();
      return { id: c._id, name: c.name, channel: c.channel, roi: m.roi };
    });
    withRoi.sort((a, b) => b.roi - a.roi);

    const byChannelMap = {};
    campaigns.forEach((c) => {
      if (!byChannelMap[c.channel]) byChannelMap[c.channel] = { channel: c.channel, spend: 0, revenue: 0, count: 0 };
      byChannelMap[c.channel].spend += c.amountSpent || 0;
      byChannelMap[c.channel].revenue += c.revenue || 0;
      byChannelMap[c.channel].count += 1;
    });

    res.json({
      totals: {
        spend: round2(totals.spend),
        revenue: round2(totals.revenue),
        impressions: totals.impressions,
        clicks: totals.clicks,
        conversions: totals.conversions,
      },
      kpis,
      bestCampaign: withRoi[0] || null,
      worstCampaign: withRoi[withRoi.length - 1] || null,
      campaignCount: campaigns.length,
      byChannel: Object.values(byChannelMap).map((c) => ({ ...c, spend: round2(c.spend), revenue: round2(c.revenue) })),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to build dashboard', error: err.message });
  }
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

module.exports = { getDashboard };
