const express = require('express');
const router = express.Router();
const {restrictAccess,guard} = require('../util/authGuard');
const productController = require('../controllers/productController');
const {validate} = require('express-validation');
const {productValidationSchema,productUpdateValidationSchema,addNewStockValidationSchema} = require('../models/validations/validations');

router.route('/').post(guard,restrictAccess("ADMIN","SELLER"),validate(productValidationSchema),productController.createProduct).get(guard,restrictAccess("ADMIN","SELLER"),productController.getProducts);
router.route('/productData').get(guard,restrictAccess("ADMIN","SELLER"),productController.getProductData);
router.route('/alphaNoLimit').get(guard,productController.getProductsAlphaOrderNoLimit);
router.route('/addNewStock/:id').post(guard,restrictAccess("ADMIN","SELLER"),validate(addNewStockValidationSchema),productController.addNewStock);
router.route('/:id').get(guard,restrictAccess("ADMIN","SELLER"),productController.getProduct).patch(guard,restrictAccess("ADMIN"),validate(productUpdateValidationSchema),productController.updateProduct)
    .delete(guard,restrictAccess("ADMIN"),productController.deleteProduct);

module.exports = router;