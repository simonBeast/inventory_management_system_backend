const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const {guard,restrictAccess} = require('../util/authGuard');
const {validate} = require('express-validation');
const {signinValidationSchema,updateUserValidationSchema,
    changePasswordValidationSchema,registerValidationSchema,
    resetPasswordValidationSchema,forgotPasswordValidationSchema} = require('../models/validations/validations');


router.route('/').get(guard,restrictAccess("ADMIN"),userController.getUsers);
router.route('/checkTokenValidity').post(authController.checkTokenValidityAndUser);
router.route('/forgotPassword').post(validate(forgotPasswordValidationSchema),userController.forgotPassword);
router.route('/resetPassword/:resetToken').post(validate(resetPasswordValidationSchema),userController.resetPassword);
router.route('/changePassword/:userId').post(guard,validate(changePasswordValidationSchema),userController.changePassword);
router.route('/signup').post(validate(registerValidationSchema),authController.signup);
router.route('/signin').post(validate(signinValidationSchema),authController.signin);
router.route('/:id').get(guard,restrictAccess("ADMIN"),userController.getUser).patch(validate(updateUserValidationSchema),userController.updateUser)
    .delete(guard,restrictAccess("ADMIN"),userController.deleteUser);

module.exports = router;