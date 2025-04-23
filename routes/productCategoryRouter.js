const express = require('express');
const router = express.Router();
const {restrictAccess,guard} = require('../util/authGuard');
const productCategoryController = require('../controllers/productCategoryController');
const {validate} = require('express-validation');
const {productCategoryValidationSchema,productCategoryUpdateValidationSchema} = require('../models/validations/validations')

router.route('/').post(guard,restrictAccess("ADMIN"),validate(productCategoryValidationSchema),productCategoryController.createProductCategory).get(guard,restrictAccess("ADMIN","SELLER"),productCategoryController.getProductCategories);
router.route('/alphaNoLimit').get(guard,productCategoryController.getProductCategoriesAlphaOrderNoLimit);
router.route('/:id').get(guard,restrictAccess("ADMIN","SELLER"),productCategoryController.getProductCategory).patch(guard,restrictAccess("ADMIN"),validate(productCategoryUpdateValidationSchema),productCategoryController.updateProductCategory)
    .delete(guard,restrictAccess("ADMIN"),productCategoryController.deleteProductCategory);

module.exports = router;