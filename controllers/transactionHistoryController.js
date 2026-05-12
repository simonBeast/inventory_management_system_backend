const db = require('../models/index');
const AppExceptions  = require('../util/AppExceptions');
const filter = require('../util/filter');
module.exports.getTransactionHistoryById = async (id) => {
    try {
        const transactionHistory = await db.TransactionHistory.findOne({where:{id}});
        return transactionHistory;
    }
    catch (e) {
        console.log(e);
        return 0;
    }
}
module.exports.createTransactionHistory = async (transactionHistory, transaction = null) => {
    const createOptions = transaction ? { transaction } : undefined;
    return db.TransactionHistory.create(transactionHistory, createOptions);
}
module.exports.getTransactionHistory = async (req, res, next) => {
    const id = req.params.id;
    let transactionHistory;
    try {
        transactionHistory = await this.getTransactionHistoryById(id);
        if (!transactionHistory) {
            next(new AppExceptions('TransactionHistory not found', 404));
        }
        else {
            res.status(200).json({
                status: 'success',
                data: transactionHistory
            });
        }
    } catch (e) {
        console.log(e);
        next(e);
    }
}
module.exports.getTransactionHistories = async (req, res, next) => {
    let transactionHistories;
    const queryString = req.query;
    const includes = [
        {
            model: db.Product,
            attributes: ['id', 'productName', 'productCode'],
            required: false
        }
    ];
    const apiFilters = new filter(db.TransactionHistory,queryString,includes);
    try {
        result = await apiFilters.filter().limitFields().sort().paginate().include().build();
        transactionHistories = result.rows;
        const pagination = {
            totalItems: result.totalItems,
            totalPages: Math.ceil(result.totalItems / result.limit),
            currentPage: result.page,
            itemsPerPage: result.limit
        };
        res.status(200).json({
            status: 'success',
            data: transactionHistories,
            pagination
        });
    } catch (e) {
        console.log(e);
        next(e);
    }
}

module.exports.deleteTransactionHistory = async (req, res, next) => {
    const id = req.params.id;
    const oldTransactionHistory = await this.getTransactionHistoryById(id);
    if (oldTransactionHistory) {
        try {
            await oldTransactionHistory.destroy();
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
        next(new AppExceptions('TransactionHistory not found', 404));
    }
}
