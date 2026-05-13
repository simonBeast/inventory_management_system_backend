const db = require('../models/index');
const AppExceptions = require('../util/AppExceptions');
const { Op } = require('sequelize');

const assetInclude = [
  {
    model: db.ProductDetails,
    as: 'ProductDetail',
    attributes: [],
    required: true
  },
  {
    model: db.ProductSubCategory,
    as: 'ProductSubCategory',
    attributes: [],
    required: true,
    include: [
      {
        model: db.ProductCategory,
        as: 'ProductCategory',
        attributes: [],
        required: true,
        include: [
          {
            model: db.Category,
            as: 'Category',
            attributes: [],
            required: true
          }
        ]
      }
    ]
  }
];

const salesInclude = [
  {
    model: db.Product,
    as: 'Product',
    attributes: [],
    required: true,
    include: [
      {
        model: db.ProductSubCategory,
        as: 'ProductSubCategory',
        attributes: [],
        required: true,
        include: [
          {
            model: db.ProductCategory,
            as: 'ProductCategory',
            attributes: [],
            required: true,
            include: [
              {
                model: db.Category,
                as: 'Category',
                attributes: [],
                required: true
              }
            ]
          }
        ]
      }
    ]
  }
];

const buildAssetSummary = (rows) => rows.reduce(
  (acc, row) => {
    acc.totalQty += Number(row.totalQty || 0);
    acc.totalValue += Number(row.totalValue || 0);
    return acc;
  },
  { totalQty: 0, totalValue: 0 }
);

const buildSalesSummary = (rows) => rows.reduce(
  (acc, row) => {
    acc.totalQty += Number(row.totalQty || 0);
    acc.totalRevenue += Number(row.totalRevenue || 0);
    acc.totalCost += Number(row.totalCost || 0);
    acc.totalProfit += Number(row.totalProfit || 0);
    return acc;
  },
  { totalQty: 0, totalRevenue: 0, totalCost: 0, totalProfit: 0 }
);

const buildAssetReport = async (groupIdPath, groupNamePath) => {
  const assetValueExpr = db.sequelize.literal('`ProductDetail`.`availableQuantity` * `Product`.`pricePerUnit`');
  return db.Product.findAll({
    attributes: [
      [db.sequelize.col(groupIdPath), 'id'],
      [db.sequelize.col(groupNamePath), 'name'],
      [db.sequelize.fn('SUM', db.sequelize.col('ProductDetail.availableQuantity')), 'totalQty'],
      [db.sequelize.fn('SUM', assetValueExpr), 'totalValue']
    ],
    include: assetInclude,
    group: [groupIdPath, groupNamePath],
    order: [[db.sequelize.col(groupNamePath), 'ASC']],
    raw: true
  });
};

const buildSalesReport = async (groupIdPath, groupNamePath, dateRange) => {
  const revenueExpr = db.sequelize.literal('`Sales`.`quantity` * `Sales`.`salePricePerUnit`');
  const costExpr = db.sequelize.literal('`Sales`.`quantity` * `Sales`.`buyPricePerUnit`');
  const profitExpr = db.sequelize.literal(
    '(`Sales`.`quantity` * `Sales`.`salePricePerUnit`) - (`Sales`.`quantity` * `Sales`.`buyPricePerUnit`)'
  );

  return db.Sales.findAll({
    attributes: [
      [db.sequelize.col(groupIdPath), 'id'],
      [db.sequelize.col(groupNamePath), 'name'],
      [db.sequelize.fn('SUM', db.sequelize.col('Sales.quantity')), 'totalQty'],
      [db.sequelize.fn('SUM', revenueExpr), 'totalRevenue'],
      [db.sequelize.fn('SUM', costExpr), 'totalCost'],
      [db.sequelize.fn('SUM', profitExpr), 'totalProfit']
    ],
    where: {
      createdAt: { [Op.between]: [dateRange.start, dateRange.end] }
    },
    include: salesInclude,
    group: [groupIdPath, groupNamePath],
    order: [[db.sequelize.col(groupNamePath), 'ASC']],
    raw: true
  });
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildDateRange = (startDate, endDate) => {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end) return null;

  if (!startDate.includes('T')) {
    start.setHours(0, 0, 0, 0);
  }
  if (!endDate.includes('T')) {
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
};

module.exports.getAssetHoldingReport = async (req, res, next) => {
  try {
    const [
      categories,
      productCategories,
      productSubCategories
    ] = await Promise.all([
      buildAssetReport('ProductSubCategory.ProductCategory.Category.id', 'ProductSubCategory.ProductCategory.Category.name'),
      buildAssetReport('ProductSubCategory.ProductCategory.id', 'ProductSubCategory.ProductCategory.name'),
      buildAssetReport('ProductSubCategory.id', 'ProductSubCategory.name')
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        summary: buildAssetSummary(categories),
        categories,
        productCategories,
        productSubCategories
      }
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports.getSalesReport = async (req, res, next) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    return next(new AppExceptions('startDate and endDate are required', 400));
  }

  const dateRange = buildDateRange(startDate, endDate);
  if (!dateRange) {
    return next(new AppExceptions('Invalid startDate or endDate', 400));
  }

  try {
    const [
      categories,
      productCategories,
      productSubCategories
    ] = await Promise.all([
      buildSalesReport(
        'Product.ProductSubCategory.ProductCategory.Category.id',
        'Product.ProductSubCategory.ProductCategory.Category.name',
        dateRange
      ),
      buildSalesReport(
        'Product.ProductSubCategory.ProductCategory.id',
        'Product.ProductSubCategory.ProductCategory.name',
        dateRange
      ),
      buildSalesReport(
        'Product.ProductSubCategory.id',
        'Product.ProductSubCategory.name',
        dateRange
      )
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        summary: buildSalesSummary(categories),
        categories,
        productCategories,
        productSubCategories
      }
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
