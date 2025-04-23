const express = require('express');
const router = express.Router();
const {guard,restrictAccess} = require('../util/authGuard')
const returnsController = require('../controllers/returnsController');
const {validate} = require('express-validation');
const {returnValidationSchema,returnUpdateValidationSchema} = require('../models/validations/validations');


router.route('/').post(guard,restrictAccess("ADMIN","SELLER"),validate(returnValidationSchema),returnsController.createReturn).get(guard,restrictAccess("ADMIN","SELLER"),returnsController.getReturns);
router.route('/:id').get(guard,restrictAccess("ADMIN","SELLER"),returnsController.getReturn).patch(guard,restrictAccess("ADMIN"),validate(returnUpdateValidationSchema),returnsController.updateReturn)
.delete(guard,restrictAccess("ADMIN"),returnsController.deleteReturn);

module.exports = router;