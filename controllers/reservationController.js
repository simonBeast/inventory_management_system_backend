const db = require('../models/index');
const AppExceptions = require('../util/AppExceptions');
const filter = require('../util/filter');
const { Op } = require('sequelize');

module.exports.getReservationById = async (id, options = {}) => {
    try {
        return await db.Reservation.findOne({
            where: { id },
            include: options.include || [
                {
                    model: db.Product,
                    attributes: ['id', 'productName', 'productCode', 'pricePerUnit'],
                    required: false
                },
                {
                    model: db.ProductSubCategory,
                    attributes: ['id', 'name'],
                    required: false
                }
            ]
        });
    } catch (e) {
        console.log(e);
        return 0;
    }
};

module.exports.createReservation = async (req, res, next) => {
    const reservationData = {
        productId: req.body.productId || null,
        productSubCategoryId: req.body.productSubCategoryId || null,
        quantity: req.body.quantity,
        reservedSalePrice: req.body.reservedSalePrice || null,
        note: req.body.note || null,
        status: 'pending'
    };

    if (!reservationData.productId && !reservationData.productSubCategoryId) {
        return next(new AppExceptions('product or product sub category is required', 400));
    }
    if (Number(reservationData.quantity) <= 0) {
        return next(new AppExceptions('quantity must be greater than 0', 400));
    }
    if (reservationData.reservedSalePrice !== null && Number(reservationData.reservedSalePrice) < 0) {
        return next(new AppExceptions('reserved sale price cannot be less than 0', 400));
    }

    try {
        if (reservationData.productId) {
            const product = await db.Product.findOne({ where: { id: reservationData.productId } });
            if (!product) {
                return next(new AppExceptions('product not found', 404));
            }
            reservationData.productSubCategoryId = null;
        } else if (reservationData.productSubCategoryId) {
            const subCategory = await db.ProductSubCategory.findOne({ where: { id: reservationData.productSubCategoryId } });
            if (!subCategory) {
                return next(new AppExceptions('product sub category not found', 404));
            }
        }

        const reservation = await db.Reservation.create(reservationData);
        res.status(201).json({
            status: 'success',
            data: reservation
        });
    } catch (e) {
        next(e);
    }
};

module.exports.getReservation = async (req, res, next) => {
    const id = req.params.id;
    try {
        const reservation = await this.getReservationById(id);
        if (!reservation) {
            return next(new AppExceptions('Reservation not found', 404));
        }
        res.status(200).json({
            status: 'success',
            data: reservation
        });
    } catch (e) {
        console.log(e);
        next(e);
    }
};

module.exports.getReservations = async (req, res, next) => {
    const queryString = { ...req.query };
    const productNameSearch = queryString.productName?.search || queryString.productName?.like || null;
    if (queryString.productName) {
        delete queryString.productName;
    }

    const includes = [
        {
            model: db.Product,
            attributes: ['id', 'productName', 'productCode', 'pricePerUnit'],
            required: false
        },
        {
            model: db.ProductSubCategory,
            attributes: ['id', 'name'],
            required: false
        }
    ];

    if (productNameSearch) {
        includes[0].where = { productName: { [Op.like]: `%${productNameSearch}%` } };
        includes[0].required = true;
    }

    const apiFilters = new filter(db.Reservation, queryString, includes);

    try {
        const result = await apiFilters.filter().limitFields().sort().paginate().include().build();
        const reservations = result.rows;
        const pagination = {
            totalItems: result.totalItems,
            totalPages: Math.ceil(result.totalItems / result.limit),
            currentPage: result.page,
            itemsPerPage: result.limit
        };
        res.status(200).json({
            status: 'success',
            data: reservations,
            pagination
        });
    } catch (e) {
        console.log(e);
        next(e);
    }
};

module.exports.updateReservation = async (req, res, next) => {
    const id = req.params.id;
    try {
        const reservation = await this.getReservationById(id, { include: [] });
        if (!reservation) {
            return next(new AppExceptions('Reservation not found', 404));
        }

        if (reservation.status !== 'pending' && (req.body.quantity !== undefined || req.body.productId !== undefined || req.body.productSubCategoryId !== undefined)) {
            return next(new AppExceptions('only pending reservations can be updated', 400));
        }

        if (req.body.quantity !== undefined) {
            if (Number(req.body.quantity) <= 0) {
                return next(new AppExceptions('quantity must be greater than 0', 400));
            }
            reservation.quantity = req.body.quantity;
        }
        if (req.body.reservedSalePrice !== undefined) {
            if (req.body.reservedSalePrice !== null && Number(req.body.reservedSalePrice) < 0) {
                return next(new AppExceptions('reserved sale price cannot be less than 0', 400));
            }
            reservation.reservedSalePrice = req.body.reservedSalePrice;
        }
        if (req.body.note !== undefined) {
            reservation.note = req.body.note;
        }
        if (req.body.status) {
            reservation.status = req.body.status;
        }

        if (req.body.productId !== undefined) {
            if (req.body.productId) {
                const product = await db.Product.findOne({ where: { id: req.body.productId } });
                if (!product) {
                    return next(new AppExceptions('product not found', 404));
                }
                reservation.productId = req.body.productId;
                reservation.productSubCategoryId = null;
            } else {
                reservation.productId = null;
            }
        }

        if (req.body.productSubCategoryId !== undefined) {
            if (req.body.productSubCategoryId) {
                const subCategory = await db.ProductSubCategory.findOne({ where: { id: req.body.productSubCategoryId } });
                if (!subCategory) {
                    return next(new AppExceptions('product sub category not found', 404));
                }
                if (!reservation.productId) {
                    reservation.productSubCategoryId = req.body.productSubCategoryId;
                }
            } else {
                reservation.productSubCategoryId = null;
            }
        }

        if (!reservation.productId && !reservation.productSubCategoryId) {
            return next(new AppExceptions('product or product sub category is required', 400));
        }

        await reservation.save();
        res.status(200).json({
            status: 'success',
            data: reservation
        });
    } catch (e) {
        console.log(e);
        next(e);
    }
};

module.exports.getPendingReservationsCount = async (req, res, next) => {
    try {
        const count = await db.Reservation.count({ where: { status: 'pending' } });
        res.status(200).json({
            status: 'success',
            data: { count }
        });
    } catch (e) {
        console.log(e);
        next(e);
    }
};
