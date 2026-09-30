const express = require('express');
const router = express.Router();
const { performance, segmentation, recommendations, adCopy, forecast } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/performance', performance);
router.get('/segmentation', segmentation);
router.get('/recommendations/:campaignId', recommendations);
router.get('/ad-copy/:campaignId', adCopy);
router.get('/forecast/:campaignId', forecast);

module.exports = router;
