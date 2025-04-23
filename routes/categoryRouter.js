const express = require('express');
const router = express.Router();
const {restrictAccess,guard} = require('../util/authGuard');
const categoryController = require('../controllers/categoryController');
const {validate} = require('express-validation');
const {categoryValidationSchema,categoryUpdateValidationSchema} = require('../models/validations/validations')
router.route('/').post(guard,restrictAccess("ADMIN"),validate(categoryValidationSchema),categoryController.createCategory).get(guard,categoryController.getCategories);
router.route('/alphaNoLimit').get(guard,categoryController.getCategoriesAlphaOrderNoLimit);
router.route('/:id').get(guard,restrictAccess("ADMIN","SELLER"),categoryController.getCategory).patch(guard,restrictAccess("ADMIN"),validate(categoryUpdateValidationSchema),categoryController.updateCategory)
    .delete(guard,restrictAccess("ADMIN"),categoryController.deleteCategory);

module.exports = router;