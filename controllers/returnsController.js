const transactionHistoryController = require('./transactionHistoryController');
const db = require('../models/index');
const AppExceptions = require('../util/AppExceptions');
const filter = require('../util/filter');
const productController = require('./productController');
const salesController = require('./salesController');
const reservationService = require('../util/reservationService');
module.exports.getReturnById = async (id) => {
    try {
        const returns = await db.Returns.findOne({ where: { id }, include: ['Sale', 'Product'] });
        return returns;
    }
    catch (e) {
        console.log(e);
        return 0;
    }
}
module.exports.createReturn = async (req, res, next) => {
    const returns = { saleId: "", productId: "", quantityReturned: 0, reason: "", returnDate: "", returnStatus: "", description: "" };
    if (Number(req.body.quantityReturned) < 0) {
        return next(new AppExceptions("quantity returned can't be less than 0", 400))
    }
    returns.saleId = req.body.saleId;
    let sale = await salesController.getSaleById(req.body.saleId);
    if (!sale) {
        return next(new AppExceptions("sale not found", 404));
    }
    if ((Number(req.body.quantityReturned) > sale.quantity) || (Number(req.body.quantityReturned) < 0)) {
        return next(new AppExceptions("quantity returned can't be greater than quantity sold or less than zero", 400))
    }
    sale.quantity = Number(sale.quantity) - Number(req.body.quantityReturned);
    sale.totalCost = Number(sale.totalCost) - (Number(req.body.quantityReturned) * Number(sale.buyPricePerUnit));
    returns.productId = sale.productId;
    returns.quantityReturned = req.body.quantityReturned;
    returns.reason = req.body.reason;
    returns.returnDate = new Date(Date.now());
    returns.returnStatus = req.body.returnStatus;
    returns.description = req.body.description;
    let transaction;
    let productDetail;
    try {
        transaction = await db.sequelize.transaction();
        const newReturn = await db.Returns.create(returns, { transaction });
        productDetail = await productController.getProductDetailByProductId(returns.productId);
        productDetail.availableQuantity = Number(productDetail.availableQuantity) + Number(returns.quantityReturned);
        await reservationService.adjustReservationForReturnChange({
            sale,
            deltaReturned: Number(returns.quantityReturned),
            transaction
        });
        await sale.save({ transaction });
        await productDetail.save({ transaction });
        const historyData = {
            transactionType: "return",
            sellerId: sale.sellerId,
            productId: returns.productId,
            quantity: Number(returns.quantityReturned),
            unitPrice: Number(sale.salePricePerUnit),
            totalCost: Number(sale.buyPricePerUnit) * Number(returns.quantityReturned),
            returnReason: returns.reason
        };
        await transactionHistoryController.createTransactionHistory(historyData, transaction);
        await transaction.commit();
        res.status(201).json({
            status: 'success',
            data: newReturn
        });
    } catch (e) {
        await transaction.rollback();
        next(e);
    }
}
module.exports.getReturn = async (req, res, next) => {
    const id = req.params.id;
    let returns;
    try {
        returns = await this.getReturnById(id);
        if (!returns) {
            next(new AppExceptions('Return not found', 404));
        }
        else {
            res.status(200).json({
                status: 'success',
                data: returns
            });
        }
    } catch (e) {
        console.log(e);
        next(e);
    }
}
module.exports.getReturns = async (req, res, next) => {
    let returns;
    const queryString = req.query;
    const includes = [{ model: db.Sales }, { model: db.Product }];
    const apiFilters = new filter(db.Returns, queryString, includes);
    try {
        let result = await apiFilters.filter().limitFields().sort().paginate().include().build();
        returns = result.rows;
        const pagination = {
            totalItems: result.totalItems,
            totalPages: Math.ceil(result.totalItems / result.limit),
            currentPage: result.page,
            itemsPerPage: result.limit
        };
        res.status(200).json({
            status: 'success',
            data: returns,
            pagination
        });
    } catch (e) {
        console.log(e);
        next(e);
    }
}
module.exports.updateReturn = async (req, res, next) => {
    const id = req.params.id;
    const oldReturn = await this.getReturnById(id);
    let transaction = await db.sequelize.transaction();
    if (oldReturn) {
        try {
            let sale = await salesController.getSaleById(oldReturn.saleId);
            let productDetail = await productController.getProductDetailByProductId(oldReturn.productId);
            let quantityDelta = 0;
            if (!productDetail) {
                return next(new AppExceptions("product not found", 404));
            }
            if (!sale) {
                return next(new AppExceptions("sale not found", 404));
            }
            if (req.body.quantityReturned !== undefined) {
                if ((Number(req.body.quantityReturned) > sale.quantity) || (Number(req.body.quantityReturned) < 0)) {
                    return next(new AppExceptions("quantity returned can't be greater than quantity sold or less than zero", 400))
                }
                const newQuantity = Number(req.body.quantityReturned);
                const oldQuantity = Number(oldReturn.quantityReturned);
                if (oldQuantity > newQuantity) {
                    const diff = oldQuantity - newQuantity;
                    sale.quantity = Number(sale.quantity) + diff;
                    sale.totalCost = Number(sale.totalCost) + (diff * Number(sale.buyPricePerUnit));
                    productDetail.availableQuantity = Number(productDetail.availableQuantity) - diff;
                    quantityDelta = -diff;
                } else if (oldQuantity < newQuantity) {
                    const diff = newQuantity - oldQuantity;
                    sale.quantity = Number(sale.quantity) - diff;
                    sale.totalCost = Number(sale.totalCost) - (diff * Number(sale.buyPricePerUnit));
                    productDetail.availableQuantity = Number(productDetail.availableQuantity) + diff;
                    quantityDelta = diff;
                }
                if (Number(sale.quantity) < 0) {
                    return next(new AppExceptions("sold quantity can't be less than 0", 400))
                }
                if (Number(sale.totalCost) < 0) {
                    return next(new AppExceptions("total cost can't be less than 0", 400))
                }
                if (Number(productDetail.availableQuantity) < 0) {
                    return next(new AppExceptions("product\'s available quantity can't be less than 0", 400))
                }
                oldReturn.quantityReturned = req.body.quantityReturned;
            }
            if (req.body.reason) {
                oldReturn.reason = req.body.reason;
            }
            if (req.body.returnStatus) {
                oldReturn.returnStatus = req.body.returnStatus;
            }
            if (req.body.description) {
                oldReturn.description = req.body.description;
            }
            if (quantityDelta !== 0) {
                await reservationService.adjustReservationForReturnChange({
                    sale,
                    deltaReturned: quantityDelta,
                    transaction
                });
            }
            if (quantityDelta < 0) {
                await reservationService.assertReservedNotExceeded(
                    oldReturn.productId,
                    Number(productDetail.availableQuantity),
                    transaction
                );
            }
            await productDetail.save({ transaction });
            await sale.save({ transaction });
            await oldReturn.save({ transaction });
            if (quantityDelta !== 0) {
                const historyData = {
                    transactionType: "return_update",
                    sellerId: req.user?.id || sale.sellerId,
                    productId: oldReturn.productId,
                    quantity: quantityDelta,
                    unitPrice: Number(sale.salePricePerUnit),
                    totalCost: Math.abs(quantityDelta) * Number(sale.buyPricePerUnit),
                    returnReason: oldReturn.reason
                };
                await transactionHistoryController.createTransactionHistory(historyData, transaction);
            }
            await transaction.commit()
            res.status(200).json({
                status: "Success",
                message: 'Update Successful'
            })
        } catch (e) {
            console.log(e);
            await transaction.rollback();
            next(e);
        }
    }
    else {
        next(new AppExceptions('Return not found', 404));
    }

}
module.exports.deleteReturn = async (req, res, next) => {
    const id = req.params.id;
    const oldReturn = await this.getReturnById(id);
    let sale = await salesController.getSaleById(oldReturn.saleId);
    let productDetail = await productController.getProductDetailByProductId(oldReturn.productId);
    let transaction = await db.sequelize.transaction();
    sale.quantity = Number(sale.quantity) + (Number(oldReturn.quantityReturned));
    sale.totalCost = Number(sale.totalCost) + ((Number(oldReturn.quantityReturned)) * Number(sale.buyPricePerUnit));
    if ((Number(productDetail.availableQuantity) - (Number(oldReturn.quantityReturned))) < 0) {
        return next(new AppExceptions("product\'s available quantity can't be less than 0", 400))
    }
    productDetail.availableQuantity = Number(productDetail.availableQuantity) - (Number(oldReturn.quantityReturned));
    if (oldReturn) {
        try {
            await reservationService.adjustReservationForReturnChange({
                sale,
                deltaReturned: -Number(oldReturn.quantityReturned),
                transaction
            });
            await reservationService.assertReservedNotExceeded(
                oldReturn.productId,
                Number(productDetail.availableQuantity),
                transaction
            );
            await oldReturn.destroy({ transaction });
            await sale.save({ transaction });
            await productDetail.save({ transaction });
            const historyData = {
                transactionType: "return_cancel",
                sellerId: req.user?.id || sale.sellerId,
                productId: oldReturn.productId,
                quantity: -Number(oldReturn.quantityReturned),
                unitPrice: Number(sale.salePricePerUnit),
                totalCost: Number(sale.buyPricePerUnit) * Number(oldReturn.quantityReturned),
                returnReason: oldReturn.reason
            };
            await transactionHistoryController.createTransactionHistory(historyData, transaction);
            await transaction.commit()
            res.status(204).json({
                status: "Success",
                message: 'delete Successful'
            })
        } catch (e) {
            console.log(e);
            next(e);
        }
    }
    else {
        next(new AppExceptions('Return not found', 404));
    }
}
