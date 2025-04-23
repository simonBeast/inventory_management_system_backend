const express = require('express');
const router = express.Router();
const {guard,restrictAccess} = require('../util/authGuard');
const transactionHistoryController = require('../controllers/transactionHistoryController');

router.route('/').get(guard,restrictAccess("ADMIN"),transactionHistoryController.getTransactionHistories);
router.route('/:id').get(guard,restrictAccess("ADMIN"),transactionHistoryController.getTransactionHistory).delete(guard,restrictAccess("ADMIN"),transactionHistoryController.deleteTransactionHistory);

module.exports = router;