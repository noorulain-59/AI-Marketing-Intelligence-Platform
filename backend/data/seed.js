/**
 * Run with: npm run seed
 * Creates one admin user and a handful of sample campaigns so the
 * dashboard and AI module have real data to show immediately.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Campaign = require('../models/Campaign');

const sampleCampaigns = [
  { name: 'Spring Sale Blitz', channel: 'Facebook', objective: 'Sales', status: 'Active', budget: 50000, amountSpent: 32000, revenue: 98000, impressions: 850000, clicks: 21000, conversions: 940, targetAudience: 'Women 25-40, urban, fashion-interested' },
  { name: 'Brand Awareness Push', channel: 'Instagram', objective: 'Awareness', status: 'Active', budget: 30000, amountSpent: 28500, revenue: 15000, impressions: 1200000, clicks: 9800, conversions: 120, targetAudience: 'Gen Z, 18-24' },
  { name: 'Lead Gen - Webinar', channel: 'LinkedIn', objective: 'Leads', status: 'Completed', budget: 20000, amountSpent: 19500, revenue: 61000, impressions: 210000, clicks: 5400, conversions: 410, targetAudience: 'B2B decision makers' },
  { name: 'Retargeting - Cart Abandoners', channel: 'Google Ads', objective: 'Sales', status: 'Active', budget: 15000, amountSpent: 10200, revenue: 41000, impressions: 180000, clicks: 8100, conversions: 560, targetAudience: 'Site visitors, cart abandoners' },
  { name: 'Holiday Teaser', channel: 'TikTok', objective: 'Awareness', status: 'Paused', budget: 25000, amountSpent: 24800, revenue: 9000, impressions: 2100000, clicks: 31000, conversions: 90, targetAudience: 'Gen Z, trend-driven' },
  { name: 'Email Winback Series', channel: 'Email', objective: 'Retention', status: 'Active', budget: 3000, amountSpent: 1200, revenue: 8600, impressions: 45000, clicks: 6200, conversions: 380, targetAudience: 'Lapsed customers, 90+ days inactive' },
];

async function seed() {
  await connectDB();

  let admin = await User.findOne({ email: 'admin@demo.com' });
  if (!admin) {
    admin = await User.create({ name: 'Demo Admin', email: 'admin@demo.com', password: 'admin123', role: 'admin' });
    console.log('Created demo admin -> email: admin@demo.com / password: admin123');
  } else {
    console.log('Demo admin already exists, reusing it.');
  }

  await Campaign.deleteMany({ owner: admin._id });
  const withDates = sampleCampaigns.map((c, i) => {
    const start = new Date();
    start.setDate(start.getDate() - (30 + i * 5));
    const end = new Date();
    end.setDate(end.getDate() + (10 - i * 2));
    return { ...c, owner: admin._id, startDate: start, endDate: end };
  });

  await Campaign.insertMany(withDates);
  console.log(`Seeded ${withDates.length} sample campaigns.`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
