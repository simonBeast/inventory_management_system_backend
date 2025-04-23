const express = require('express');
const router = express.Router();
const { guard,restrictAccess } = require('../util/authGuard');
const productSubCategoryController = require('../controllers/productSubCategoryController');
const {validate} = require('express-validation');
const {productSubCategoryValidationSchema,productSubCategoryUpdateValidationSchema} = require('../models/validations/validations');

router.route('/').post(guard,restrictAccess("ADMIN"),validate(productSubCategoryValidationSchema),productSubCategoryController.createProductSubCategory).get(guard,restrictAccess("ADMIN","SELLER"),productSubCategoryController.getProductSubCategories);
router.route('/alphaNoLimit').get(guard,productSubCategoryController.getProductSubCategoriesAlphaOrderNoLimit);
router.route('/:id').get(guard,restrictAccess("ADMIN","SELLER"),productSubCategoryController.getProductSubCategory).patch(guard,restrictAccess("ADMIN"),validate(productSubCategoryUpdateValidationSchema),productSubCategoryController.updateProductSubCategory)
    .delete(guard,restrictAccess("ADMIN","SELLER"),productSubCategoryController.deleteProductSubCategory);

module.exports = router;