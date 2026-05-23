const express = require('express');
const router = express.Router();
const { guard, restrictAccess } = require('../util/authGuard');
const expenseController = require('../controllers/expenseController');
const { validate } = require('express-validation');
const { expenseValidationSchema, expenseUpdateValidationSchema } = require('../models/validations/validations');

router
    .route('/')
    .post(guard, restrictAccess('ADMIN'), validate(expenseValidationSchema), expenseController.createExpense)
    .get(guard, restrictAccess('ADMIN'), expenseController.getExpenses);

router
    .route('/:id')
    .get(guard, restrictAccess('ADMIN'), expenseController.getExpense)
    .patch(guard, restrictAccess('ADMIN'), validate(expenseUpdateValidationSchema), expenseController.updateExpense)
    .delete(guard, restrictAccess('ADMIN'), expenseController.deleteExpense);

module.exports = router;
