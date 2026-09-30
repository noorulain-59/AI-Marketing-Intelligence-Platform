const Campaign = require('../models/Campaign');
const aiService = require('../services/aiService');

async function getOwnedCampaigns(req) {
  const filter = req.user.role === 'admin' ? {} : { owner: req.user._id };
  const docs = await Campaign.find(filter);
  return docs.map((c) => ({ ...c.toJSON(), metrics: c.metrics() }));
}

// GET /api/ai/performance
async function performance(req, res) {
  try {
    const campaigns = await getOwnedCampaigns(req);
    res.json(aiService.analyzePerformance(campaigns));
  } catch (err) {
    res.status(500).json({ message: 'Performance analysis failed', error: err.message });
  }
}

// GET /api/ai/segmentation
async function segmentation(req, res) {
  try {
    const campaigns = await getOwnedCampaigns(req);
    res.json({ segments: aiService.segmentCampaigns(campaigns) });
  } catch (err) {
    res.status(500).json({ message: 'Segmentation failed', error: err.message });
  }
}

// GET /api/ai/recommendations/:campaignId
async function recommendations(req, res) {
  try {
    const doc = await Campaign.findById(req.params.campaignId);
    if (!doc) return res.status(404).json({ message: 'Campaign not found' });
    const campaign = { ...doc.toJSON(), metrics: doc.metrics() };
    res.json({ campaign: campaign.name, recommendations: aiService.generateRecommendations(campaign) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate recommendations', error: err.message });
  }
}

// GET /api/ai/ad-copy/:campaignId
async function adCopy(req, res) {
  try {
    const doc = await Campaign.findById(req.params.campaignId);
    if (!doc) return res.status(404).json({ message: 'Campaign not found' });
    res.json({ campaign: doc.name, suggestions: aiService.generateAdCopy(doc) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate ad copy', error: err.message });
  }
}

// GET /api/ai/forecast/:campaignId
async function forecast(req, res) {
  try {
    const doc = await Campaign.findById(req.params.campaignId);
    if (!doc) return res.status(404).json({ message: 'Campaign not found' });
    const campaign = { ...doc.toJSON(), metrics: doc.metrics() };
    res.json(aiService.forecastCampaign(campaign));
  } catch (err) {
    res.status(500).json({ message: 'Forecast failed', error: err.message });
  }
}

module.exports = { performance, segmentation, recommendations, adCopy, forecast };
