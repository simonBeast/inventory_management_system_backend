const db = require('../models/index');
const AppExceptions = require('../util/AppExceptions');
const filter = require('../util/filter');

module.exports.getExpenseById = async (id) => {
    try {
        const expense = await db.Expense.findOne({ where: { id } });
        return expense;
    } catch (e) {
        console.log(e);
        return 0;
    }
};

module.exports.createExpense = async (req, res, next) => {
    const expense = {
        category: 'other',
        amount: 0,
        expenseDate: null,
        description: null
    };

    if (Number(req.body.amount) < 0) {
        return next(new AppExceptions("amount can't be less than 0", 400));
    }

    expense.category = req.body.category || 'other';
    expense.amount = Number(req.body.amount);
    expense.expenseDate = req.body.expenseDate ? new Date(req.body.expenseDate) : new Date(Date.now());
    expense.description = req.body.description ?? null;

    try {
        const newExpense = await db.Expense.create(expense);
        res.status(201).json({
            status: 'success',
            data: newExpense
        });
    } catch (e) {
        console.log(e);
        next(e);
    }
};

module.exports.getExpense = async (req, res, next) => {
    const id = req.params.id;
    try {
        const expense = await this.getExpenseById(id);
        if (!expense) {
            return next(new AppExceptions('Expense not found', 404));
        }
        res.status(200).json({
            status: 'success',
            data: expense
        });
    } catch (e) {
        console.log(e);
        next(e);
    }
};

module.exports.getExpenses = async (req, res, next) => {
    const queryString = req.query;
    const apiFilters = new filter(db.Expense, queryString, []);

    try {
        const result = await apiFilters.filter().limitFields().sort().paginate().build();
        const expenses = result.rows;
        const totalAmount = await db.Expense.sum('amount', { where: apiFilters.query.where });

        const pagination = {
            totalItems: result.totalItems,
            totalPages: Math.ceil(result.totalItems / result.limit),
            currentPage: result.page,
            itemsPerPage: result.limit
        };

        res.status(200).json({
            status: 'success',
            data: expenses,
            totalAmount: totalAmount || 0,
            pagination
        });
    } catch (e) {
        console.log(e);
        next(e);
    }
};

module.exports.updateExpense = async (req, res, next) => {
    const id = req.params.id;
    const expense = await this.getExpenseById(id);
    if (!expense) {
        return next(new AppExceptions('Expense not found', 404));
    }

    try {
        if (req.body.amount !== undefined) {
            if (Number(req.body.amount) < 0) {
                return next(new AppExceptions("amount can't be less than 0", 400));
            }
            expense.amount = Number(req.body.amount);
        }
        if (req.body.category !== undefined) {
            expense.category = req.body.category || 'other';
        }
        if (req.body.expenseDate !== undefined) {
            expense.expenseDate = req.body.expenseDate ? new Date(req.body.expenseDate) : null;
        }
        if (req.body.description !== undefined) {
            expense.description = req.body.description;
        }

        await expense.save();
        res.status(200).json({
            status: 'success',
            message: 'Update Successful',
            data: expense
        });
    } catch (e) {
        console.log(e);
        next(e);
    }
};

module.exports.deleteExpense = async (req, res, next) => {
    const id = req.params.id;
    const expense = await this.getExpenseById(id);
    if (!expense) {
        return next(new AppExceptions('Expense not found', 404));
    }

    try {
        await expense.destroy();
        res.status(204).json({
            status: 'success',
            message: 'delete Successful'
        });
    } catch (e) {
        console.log(e);
        next(e);
    }
};
