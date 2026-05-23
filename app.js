const express = require('express');
const app = express();

const userRouter = require('./routes/userRouter');
const categoryRouter = require('./routes/categoryRouter');
const transactionHistoryRouter = require('./routes/transactionHistoryRouter');
const productRouter = require('./routes/productRouter');
const productCategoryRouter = require('./routes/productCategoryRouter');
const productSubCategoryRouter = require('./routes/productSubCategoryRouter');
const salesRouter = require('./routes/salesRouter');
const reportRouter = require('./routes/reportRouter');
const errHandlingMW = require('./util/errorHandlingMW');
const returnsRouter = require('./routes/returnsRouter');
const reservationRouter = require('./routes/reservationRouter');
const expenseRouter = require('./routes/expenseRouter');

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

const limiter = rateLimit({
    windowsMs: 15 * 60 * 1000,
    max:100
})

app.use(limiter)
app.use(helmet());
app.use(cors({
    origin: '*',
}));

app.use(express.json());

app.use('/api/v1/users',userRouter);
app.use('/api/v1/categories',categoryRouter);
app.use('/api/v1/history', transactionHistoryRouter);
app.use('/api/v1/products',productRouter);
app.use('/api/v1/productCategory',productCategoryRouter);
app.use('/api/v1/productSubCategory',productSubCategoryRouter);
app.use('/api/v1/sales',salesRouter);
app.use('/api/v1/reports',reportRouter);
app.use('/api/v1/returns',returnsRouter);
app.use('/api/v1/reservations', reservationRouter);
app.use('/api/v1/expenses', expenseRouter);
app.use(errHandlingMW);

module.exports = app; 


