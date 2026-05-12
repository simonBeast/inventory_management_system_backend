const express = require('express');
const router = express.Router();
const { guard, restrictAccess } = require('../util/authGuard');
const reportController = require('../controllers/reportController');

router.route('/assets').get(guard, restrictAccess('ADMIN'), reportController.getAssetHoldingReport);
router.route('/sales').get(guard, restrictAccess('ADMIN'), reportController.getSalesReport);

module.exports = router;
