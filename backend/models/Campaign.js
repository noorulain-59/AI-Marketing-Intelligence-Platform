const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    name: { type: String, required: true, trim: true },
    channel: {
      type: String,
      enum: ['Facebook', 'Instagram', 'Google Ads', 'TikTok', 'Email', 'LinkedIn', 'Other'],
      default: 'Other',
    },
    objective: {
      type: String,
      enum: ['Awareness', 'Traffic', 'Leads', 'Sales', 'Retention'],
      default: 'Awareness',
    },
    status: { type: String, enum: ['Draft', 'Active', 'Paused', 'Completed'], default: 'Draft' },

    startDate: { type: Date, required: true },
    endDate: { type: Date },

    // Core numbers a marketer enters/imports. Everything else (ROI, CTR, CPC,
    // CPA, conversion rate) is DERIVED from these, never stored redundantly.
    budget: { type: Number, required: true, min: 0 },
    amountSpent: { type: Number, required: true, min: 0, default: 0 },
    revenue: { type: Number, required: true, min: 0, default: 0 },
    impressions: { type: Number, required: true, min: 0, default: 0 },
    clicks: { type: Number, required: true, min: 0, default: 0 },
    conversions: { type: Number, required: true, min: 0, default: 0 },

    targetAudience: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

// Derived KPIs, computed on the fly so they're never stale.
campaignSchema.methods.metrics = function metrics() {
  const spend = this.amountSpent || 0;
  const revenue = this.revenue || 0;
  const impressions = this.impressions || 0;
  const clicks = this.clicks || 0;
  const conversions = this.conversions || 0;

  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const cpc = clicks > 0 ? spend / clicks : 0;
  const cpa = conversions > 0 ? spend / conversions : 0;
  const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
  const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;

  return {
    ctr: round2(ctr),
    cpc: round2(cpc),
    cpa: round2(cpa),
    conversionRate: round2(conversionRate),
    roi: round2(roi),
    profit: round2(revenue - spend),
  };
};

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

campaignSchema.set('toJSON', {
  virtuals: false,
  transform: (_doc, ret, _options) => ret,
});

module.exports = mongoose.model('Campaign', campaignSchema);
