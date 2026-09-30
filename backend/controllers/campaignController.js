const Campaign = require('../models/Campaign');

// Attach derived metrics onto a plain response object
function withMetrics(campaignDoc) {
  const obj = campaignDoc.toJSON();
  obj.metrics = campaignDoc.metrics();
  return obj;
}

// GET /api/campaigns  (supports ?status=&channel=&search=)
async function getCampaigns(req, res) {
  try {
    const { status, channel, search } = req.query;
    const filter = {};

    // Managers only see their own campaigns; admins see everything.
    if (req.user.role !== 'admin') filter.owner = req.user._id;

    if (status) filter.status = status;
    if (channel) filter.channel = channel;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const campaigns = await Campaign.find(filter).sort({ createdAt: -1 });
    res.json(campaigns.map(withMetrics));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch campaigns', error: err.message });
  }
}

// GET /api/campaigns/:id
async function getCampaign(req, res) {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    if (req.user.role !== 'admin' && String(campaign.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(withMetrics(campaign));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch campaign', error: err.message });
  }
}

// POST /api/campaigns
async function createCampaign(req, res) {
  try {
    const campaign = await Campaign.create({ ...req.body, owner: req.user._id });
    res.status(201).json(withMetrics(campaign));
  } catch (err) {
    res.status(400).json({ message: 'Failed to create campaign', error: err.message });
  }
}

// PUT /api/campaigns/:id
async function updateCampaign(req, res) {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    if (req.user.role !== 'admin' && String(campaign.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    Object.assign(campaign, req.body);
    await campaign.save();
    res.json(withMetrics(campaign));
  } catch (err) {
    res.status(400).json({ message: 'Failed to update campaign', error: err.message });
  }
}

// DELETE /api/campaigns/:id
async function deleteCampaign(req, res) {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    if (req.user.role !== 'admin' && String(campaign.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await campaign.deleteOne();
    res.json({ message: 'Campaign deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete campaign', error: err.message });
  }
}

module.exports = { getCampaigns, getCampaign, createCampaign, updateCampaign, deleteCampaign, withMetrics };
