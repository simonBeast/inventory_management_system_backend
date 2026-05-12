const db = require('../models/index');
const AppExceptions = require('./AppExceptions');

const normalizeNumber = (value) => Number(value) || 0;

const lockReservation = async (reservationId, transaction) => {
    if (!reservationId) {
        return null;
    }
    const options = {
        where: { id: reservationId }
    };
    if (transaction) {
        options.transaction = transaction;
        options.lock = transaction.LOCK.UPDATE;
    }
    return db.Reservation.findOne(options);
};

const getPendingReservedQuantity = async (productId, transaction) => {
    if (!productId) {
        return 0;
    }
    const options = {
        where: { productId, status: 'pending' }
    };
    if (transaction) {
        options.transaction = transaction;
    }
    const sum = await db.Reservation.sum('quantity', options);
    return normalizeNumber(sum);
};

const assertReservedNotExceeded = async (productId, newAvailableQuantity, transaction) => {
    const pendingReserved = await getPendingReservedQuantity(productId, transaction);
    if (normalizeNumber(newAvailableQuantity) < pendingReserved) {
        throw new AppExceptions("quantity can't be below reserved quantity", 400);
    }
};

const applyReservationForSale = async ({ reservationId, productId, saleQuantity, transaction }) => {
    if (!reservationId) {
        return { reservedQuantityUsed: 0 };
    }

    const reservation = await lockReservation(reservationId, transaction);
    if (!reservation) {
        throw new AppExceptions('reservation not found', 404);
    }
    if (reservation.status !== 'pending') {
        throw new AppExceptions('reservation is not pending', 400);
    }
    if (!reservation.productId || reservation.productId !== productId) {
        throw new AppExceptions('reservation product mismatch', 400);
    }

    const currentQuantity = normalizeNumber(reservation.quantity);
    const requestedQuantity = normalizeNumber(saleQuantity);
    const reservedQuantityUsed = Math.min(requestedQuantity, currentQuantity);
    const remaining = currentQuantity - reservedQuantityUsed;

    reservation.quantity = remaining;
    reservation.status = remaining > 0 ? 'pending' : 'fulfilled';

    await reservation.save({ transaction });

    return { reservedQuantityUsed };
};

const restoreReservationForSaleDelete = async ({ reservationId, reservedQuantityUsed, transaction }) => {
    if (!reservationId || normalizeNumber(reservedQuantityUsed) <= 0) {
        return;
    }
    const reservation = await lockReservation(reservationId, transaction);
    if (!reservation) {
        return;
    }

    reservation.quantity = normalizeNumber(reservation.quantity) + normalizeNumber(reservedQuantityUsed);
    reservation.status = 'pending';
    await reservation.save({ transaction });
};

const adjustReservationForSaleUpdate = async ({ sale, newQuantity, transaction }) => {
    if (!sale?.reservationId) {
        return;
    }
    const reservation = await lockReservation(sale.reservationId, transaction);
    if (!reservation) {
        return;
    }

    const oldQuantity = normalizeNumber(sale.quantity);
    const updatedQuantity = normalizeNumber(newQuantity);
    const delta = updatedQuantity - oldQuantity;
    if (delta === 0) {
        return;
    }

    let reservedUsed = normalizeNumber(sale.reservedQuantityUsed);
    let reservationQuantity = normalizeNumber(reservation.quantity);

    if (delta > 0) {
        const consume = Math.min(delta, reservationQuantity);
        reservationQuantity -= consume;
        reservedUsed += consume;
    } else {
        const restore = Math.min(Math.abs(delta), reservedUsed);
        reservationQuantity += restore;
        reservedUsed -= restore;
    }

    reservation.quantity = reservationQuantity;
    if (reservation.status !== 'cancelled') {
        reservation.status = reservationQuantity > 0 ? 'pending' : reservedUsed > 0 ? 'fulfilled' : reservation.status;
    }
    sale.reservedQuantityUsed = reservedUsed;

    await reservation.save({ transaction });
};

const adjustReservationForReturnChange = async ({ sale, deltaReturned, transaction }) => {
    if (!sale?.reservationId || deltaReturned === 0) {
        return;
    }
    const reservation = await lockReservation(sale.reservationId, transaction);
    if (!reservation) {
        return;
    }

    let reservedUsed = normalizeNumber(sale.reservedQuantityUsed);
    let reservationQuantity = normalizeNumber(reservation.quantity);

    if (deltaReturned > 0) {
        const restore = Math.min(deltaReturned, reservedUsed);
        reservedUsed -= restore;
        reservationQuantity += restore;
    } else {
        const consume = Math.min(Math.abs(deltaReturned), reservationQuantity);
        reservationQuantity -= consume;
        reservedUsed += consume;
    }

    reservation.quantity = reservationQuantity;
    if (reservation.status !== 'cancelled') {
        reservation.status = reservationQuantity > 0 ? 'pending' : reservedUsed > 0 ? 'fulfilled' : reservation.status;
    }
    sale.reservedQuantityUsed = reservedUsed;

    await reservation.save({ transaction });
};

module.exports = {
    getPendingReservedQuantity,
    assertReservedNotExceeded,
    applyReservationForSale,
    restoreReservationForSaleDelete,
    adjustReservationForSaleUpdate,
    adjustReservationForReturnChange
};
