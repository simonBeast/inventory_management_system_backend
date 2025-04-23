const transactionHistoryController = require('./transactionHistoryController');
const db = require('../models/index');
const AppExceptions = require('../util/AppExceptions');
const filter = require('../util/filter');
const productController = require('./productController');
const salesController = require('./salesController');
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
    //productId is used for a product's name here
    req.body.productId = sale.Product.productName;
    req.body.quantity = returns.quantityReturned;
    req.body.returnReason = returns.reason;
    req.body.transactionType = "return";
    let transaction;
    let productDetail;
    try {
        transaction = await db.sequelize.transaction();
        const newReturn = await db.Returns.create(returns, { transaction });
        productDetail = await productController.getProductDetailByProductId(returns.productId);
        productDetail.availableQuantity = Number(productDetail.availableQuantity) + Number(returns.quantityReturned);
        await sale.save({ transaction });
        await productDetail.save({ transaction });
        await transactionHistoryController.createTransactionHistory(req, res, next);
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
            if (!productDetail) {
                return next(new AppExceptions("product not found", 404));
            }
            if (!sale) {
                return next(new AppExceptions("sale not found", 404));
            }
            if (req.body.quantityReturned) {
                if ((Number(req.body.quantityReturned) > sale.quantity) || (Number(req.body.quantityReturned) < 0)) {
                    return next(new AppExceptions("quantity returned can't be greater than quantity sold or less than zero", 400))
                }
                if (oldReturn.quantityReturned > req.body.quantityReturned) {
                    sale.quantity = Number(sale.quantity) + (Number(oldReturn.quantityReturned) - Number(req.body.quantityReturned));
                    sale.totalCost = Number(sale.totalCost) + ((Number(oldReturn.quantityReturned) - Number(req.body.quantityReturned)) * Number(sale.buyPricePerUnit));
                    productDetail.availableQuantity = Number(productDetail.availableQuantity) - (Number(oldReturn.quantityReturned) - Number(req.body.quantityReturned));
                } else if (oldReturn.quantityReturned < req.body.quantityReturned) {
                    sale.quantity = Number(sale.quantity) - (Number(req.body.quantityReturned) - Number(oldReturn.quantityReturned));
                    sale.totalCost = Number(sale.totalCost) - ((Number(req.body.quantityReturned) - Number(oldReturn.quantityReturned)) * Number(sale.buyPricePerUnit));
                    productDetail.availableQuantity = Number(productDetail.availableQuantity) + (Number(req.body.quantityReturned) - Number(oldReturn.quantityReturned));
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
            await productDetail.save({ transaction });
            await sale.save({ transaction });
            await oldReturn.save({ transaction });
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
    if((Number(productDetail.availableQuantity) - (Number(oldReturn.quantityReturned))) < 0){
        return next(new AppExceptions("product\'s available quantity can't be less than 0", 400))
    }
    productDetail.availableQuantity = Number(productDetail.availableQuantity) - (Number(oldReturn.quantityReturned));
    if (oldReturn) {
        try {
            await oldReturn.destroy({transaction});
            await sale.save({transaction});
            await productDetail.save({transaction});
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
