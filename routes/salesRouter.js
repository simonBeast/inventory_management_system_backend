const express = require('express');
const router = express.Router();
const { guard, restrictAccess } = require('../util/authGuard');
const salesController = require('../controllers/salesController');
const { validate} = require('express-validation');
const {saleValidationSchema,saleUpdateValidationSchema} = require('../models/validations/validations');


router.route('/').post(guard, restrictAccess("ADMIN","SELLER"),validate(saleValidationSchema),salesController.createSale).get(guard, restrictAccess("ADMIN"), salesController.getSales);
router.route('/many').post(guard, restrictAccess("ADMIN","SELLER"),salesController.createSales)
router.route('/peakAndDropSalesQuarter').get(guard, restrictAccess("ADMIN"),salesController.getPeakAndDropSalesQuarterProduct);
router.route('/topSellingProducts/month').get(guard, restrictAccess("ADMIN"), salesController.getTopSellingProductsOfMonth);
router.route('/topSellingProducts/quarter').get(guard, restrictAccess("ADMIN"), salesController.getTopSellingProductsOfQuarter);
router.route('/topSellingProducts/year').get(guard, restrictAccess("ADMIN"), salesController.getTopSellingProductsOfYear);
router.route('/profits/:startDate/:endDate').get(guard, restrictAccess("ADMIN"), salesController.getSalesAndProfitForInterval);
router.route('/reports/sales-by-category/:type/:productId/:saleMonth/:saleYear').get(guard, restrictAccess("ADMIN"), salesController.saleByProduct);
router.route('/reports/sales-by-date/:from/:to').get(guard, restrictAccess("ADMIN"), salesController.salesByDate);
router.route('/reports/sales-by-seller/:sellerId').get(guard, restrictAccess("ADMIN"), salesController.salesBySeller);
router.route('/:id').get(guard, restrictAccess("ADMIN"), salesController.getSale).patch(guard, restrictAccess("ADMIN"),validate(saleUpdateValidationSchema), salesController.updateSale).delete(guard, restrictAccess("ADMIN"), salesController.deleteSale);

module.exports = router;