const express = require('express');
const router = express.Router();
const { guard, restrictAccess } = require('../util/authGuard');
const reservationController = require('../controllers/reservationController');
const { validate } = require('express-validation');
const { reservationValidationSchema, reservationUpdateValidationSchema } = require('../models/validations/validations');

router.route('/pending-count').get(guard, restrictAccess('ADMIN', 'SELLER'), reservationController.getPendingReservationsCount);

router
    .route('/')
    .post(guard, restrictAccess('ADMIN', 'SELLER'), validate(reservationValidationSchema), reservationController.createReservation)
    .get(guard, restrictAccess('ADMIN', 'SELLER'), reservationController.getReservations);

router
    .route('/:id')
    .get(guard, restrictAccess('ADMIN', 'SELLER'), reservationController.getReservation)
    .patch(guard, restrictAccess('ADMIN', 'SELLER'), validate(reservationUpdateValidationSchema), reservationController.updateReservation);

module.exports = router;
