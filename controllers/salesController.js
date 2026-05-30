const db = require("../models/index");
const AppExceptions = require("../util/AppExceptions");
const transactionHistoryController = require("./transactionHistoryController");
const productController = require("./productController");
const filter = require("../util/filter");
const moment = require("moment");
const reservationService = require("../util/reservationService");
module.exports.getSaleById = async (id) => {
  try {
    const sales = await db.Sales.findOne({
      where: { id },
      include: ["User", "Product"],
    });
    return sales;
  } catch (e) {
    console.log(e);
    return 0;
  }
};
module.exports.createSale = async (req, res, next) => {
  const sales = {
    sellerId: "",
    productId: "",
    reservationId: null,
    quantity: 0,
    reservedQuantityUsed: 0,
    salePricePerUnit: 0,
    totalCost: 0,
    saleMonth: 0,
    saleYear: 0,
    buyPricePerUnit: 0,
  };
  if (Number(req.body.quantity) < 0) {
    return next(new AppExceptions("quantity can't be less than 0", 400));
  }
  if (Number(req.body.salePricePerUnit) < 0) {
    return next(
      new AppExceptions("sale price per unit can't be less than 0", 400)
    );
  }
  sales.sellerId = req.user.id;
  sales.productId = req.body.productId;
  sales.reservationId = req.body.reservationId || null;
  sales.quantity = Number(req.body.quantity);
  sales.salePricePerUnit = Number(req.body.salePricePerUnit);
  sales.saleMonth = new Date().getMonth() + 1;
  sales.saleYear = new Date().getFullYear();
  let transaction = await db.sequelize.transaction();
  let product = await productController.getProductById(sales.productId);
  sales.buyPricePerUnit = product.pricePerUnit;
  sales.totalCost = Number(product.pricePerUnit) * Number(req.body.quantity);
  try {
    if (sales.reservationId) {
      const reservationResult = await reservationService.applyReservationForSale({
        reservationId: sales.reservationId,
        productId: sales.productId,
        saleQuantity: sales.quantity,
        transaction
      });
      sales.reservedQuantityUsed = reservationResult.reservedQuantityUsed;
    }
    const nonReservedQuantity = Number(sales.quantity) - Number(sales.reservedQuantityUsed || 0);
    if (nonReservedQuantity > 0) {
      await productController.updateAndCheckAvailableQuantity(
        product,
        nonReservedQuantity,
        1,
        transaction
      );
    }
    const newSale = await db.Sales.create(sales, { transaction });
    const historyData = {
      transactionType: "sale",
      sellerId: sales.sellerId,
      productId: sales.productId,
      quantity: sales.quantity,
      unitPrice: sales.salePricePerUnit,
      totalCost: sales.totalCost
    };
    await transactionHistoryController.createTransactionHistory(
      historyData,
      transaction
    );
    await transaction.commit();
    res.status(201).json({
      status: "success",
      data: newSale,
    });
  } catch (e) {
    await transaction.rollback();
    next(e);
  }
};

module.exports.createSales = async (req, res, next) => {
  for (const data of req.body.products) {
    const sales = {
      sellerId: "",
      productId: "",
      quantity: 0,
      salePricePerUnit: 0,
      totalCost: 0,
      saleMonth: 0,
      saleYear: 0,
      buyPricePerUnit: 0,
    };

    if (Number(data.quantity) < 0) {
      return next(new AppExceptions("quantity can't be less than 0", 400));
    }

    if (Number(data.salePricePerUnit) < 0) {
      return next(
        new AppExceptions("sale price per unit can't be less than 0", 400)
      );
    }

    sales.sellerId = req.body.sellerId;
    sales.productId = data.productId;
    sales.quantity = Number(data.quantity);
    sales.salePricePerUnit = Number(data.salePricePerUnit);
    sales.saleMonth = new Date().getMonth() + 1;
    sales.saleYear = new Date().getFullYear();

    const transaction = await db.sequelize.transaction();
    try {
      const product = await productController.getProductById(sales.productId);
      sales.buyPricePerUnit = product.pricePerUnit;
      sales.totalCost = Number(product.pricePerUnit) * sales.quantity;

      await productController.updateAndCheckAvailableQuantity(
        product,
        sales.quantity,
        1,
        transaction
      );

      await db.Sales.create(sales, { transaction });
      const historyData = {
        transactionType: "sale",
        sellerId: sales.sellerId,
        productId: sales.productId,
        quantity: sales.quantity,
        unitPrice: sales.salePricePerUnit,
        totalCost: sales.totalCost
      };
      await transactionHistoryController.createTransactionHistory(
        historyData,
        transaction
      );
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      return next(err);
    }
  }

  return res.status(201).json({
    status: "success",
    data: {},
  });
};

module.exports.getSale = async (req, res, next) => {
  const id = req.params.id;
  let sales;
  try {
    sales = await this.getSaleById(id);
    if (!sales) {
      next(new AppExceptions("sale not found", 404));
    } else {
      res.status(200).json({
        status: "success",
        data: sales,
      });
    }
  } catch (e) {
    console.log(e);
    next(e);
  }
};
module.exports.getSales = async (req, res, next) => {
  let sales = [];
  const queryString = req.query;
  const includes = [{ model: db.User }, { model: db.Product }];
  const apiFilters = new filter(db.Sales, queryString, includes);
  try {
    let result = await apiFilters
      .filter()
      .limitFields()
      .sort()
      .paginate()
      .include()
      .build();
    sales = result.rows;
    const pagination = {
      totalItems: result.totalItems,
      totalPages: Math.ceil(result.totalItems / result.limit),
      currentPage: result.page,
      itemsPerPage: result.limit,
    };
    res.status(200).json({
      status: "success",
      data: sales,
      pagination,
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
};
module.exports.updateSale = async (req, res, next) => {
  let calculateFlag = false;
  let quantityDelta = 0;
  const id = req.params.id;
  const oldSale = await this.getSaleById(id);
  let transaction = await db.sequelize.transaction();
  const productDetail = await productController.getProductDetailByProductId(
    oldSale.productId
  );
  if (!productDetail) {
    return next(new AppExceptions("product not found", 404));
  }
  if (oldSale) {
    if (req.body.productId && oldSale.reservationId) {
      return next(new AppExceptions('cannot change product for reservation sale', 400));
    }
    if (req.body.sellerId) {
      oldSale.sellerId = req.body.sellerId;
    }
    if (req.body.productId) {
      oldSale.productId = req.body.productId;
    }
    if (req.body.quantity !== undefined) {
      if (Number(req.body.quantity) < 0) {
        return next(new AppExceptions("quantity can't be less than 0", 400));
      }
      const newQuantity = Number(req.body.quantity);
      const oldQuantity = Number(oldSale.quantity);
      const oldReservedUsed = Number(oldSale.reservedQuantityUsed || 0);
      const oldNonReserved = oldQuantity - oldReservedUsed;
      if (oldSale.reservationId) {
        await reservationService.adjustReservationForSaleUpdate({
          sale: oldSale,
          newQuantity,
          transaction
        });
      }
        const newReservedUsed = Number(oldSale.reservedQuantityUsed || 0);
        const newNonReserved = newQuantity - newReservedUsed;
        const nonReservedDelta = newNonReserved - oldNonReserved;

        if (nonReservedDelta !== 0) {
          productDetail.availableQuantity =
            Number(productDetail.availableQuantity) - nonReservedDelta;
        }

        if (Number(productDetail.availableQuantity) < 0) {
          return next(
            new AppExceptions("available quantity can't be less than 0", 400)
          );
        }

        quantityDelta = oldQuantity - newQuantity;
      oldSale.quantity = newQuantity;
      calculateFlag = true;
    }
    if (req.body.salePricePerUnit !== undefined) {
      if (Number(req.body.salePricePerUnit) < 0) {
        return next(
          new AppExceptions("sale price per unit can't be less than 0", 400)
        );
      }
      oldSale.salePricePerUnit = Number(req.body.salePricePerUnit);
    }
    if (calculateFlag) {
      oldSale.totalCost =
        Number(oldSale.quantity) * Number(oldSale.buyPricePerUnit);
    }
    try {
      await productDetail.save({ transaction });
      await oldSale.save({ transaction });
      if (quantityDelta !== 0) {
        const unitPrice = Number(oldSale.salePricePerUnit);
        const historyData = {
          transactionType: "sale_update",
          sellerId: req.user?.id || oldSale.sellerId,
          productId: oldSale.productId,
          quantity: quantityDelta,
          unitPrice,
          totalCost: Math.abs(quantityDelta) * Number(oldSale.buyPricePerUnit)
        };
        await transactionHistoryController.createTransactionHistory(
          historyData,
          transaction
        );
      }
      await transaction.commit();
      res.status(200).json({
        status: "Success",
        message: "Update Successful",
      });
    } catch (e) {
      console.log(e);
      await transaction.rollback();
      next(e);
    }
  } else {
    next(new AppExceptions("Sale not found", 404));
  }
};
module.exports.deleteSale = async (req, res, next) => {
  const id = req.params.id;
  const oldSale = await this.getSaleById(id);
  const productDetail = await productController.getProductDetailByProductId(
    oldSale.productId
  );
  if (!productDetail) {
    return next(new AppExceptions("sold product not found", 404));
  }
  let transaction = await db.sequelize.transaction();
  const nonReservedQuantity =
    Number(oldSale.quantity) - Number(oldSale.reservedQuantityUsed || 0);
  productDetail.availableQuantity =
    Number(productDetail.availableQuantity) + nonReservedQuantity;
  if (oldSale) {
    try {
      await reservationService.restoreReservationForSaleDelete({
        reservationId: oldSale.reservationId,
        reservedQuantityUsed: oldSale.reservedQuantityUsed,
        transaction
      });
      await productDetail.save({ transaction });
      await oldSale.destroy({ transaction });
      const historyData = {
        transactionType: "sale_cancel",
        sellerId: req.user?.id || oldSale.sellerId,
        productId: oldSale.productId,
        quantity: Number(oldSale.quantity),
        unitPrice: Number(oldSale.salePricePerUnit),
        totalCost: Number(oldSale.buyPricePerUnit) * Number(oldSale.quantity)
      };
      await transactionHistoryController.createTransactionHistory(
        historyData,
        transaction
      );
      await transaction.commit();
      res.status(204).json({
        status: "Success",
        message: "delete Successful",
      });
    } catch (e) {
      console.log(e);
      await transaction.rollback();
      next(e);
    }
  } else {
    next(new AppExceptions("Sale not found", 404));
  }
};
module.exports.saleByProduct = async (req, res, next) => {
  let date = new Date();
  const { productId } = req.params;
  const productType = req.params.type;
  const { saleMonth, saleYear } = req.params;
  let startMonth, startYear, endMonth, endYear;
  startMonth = Number(saleMonth);
  endMonth = Number(saleMonth);
  startYear = Number(saleYear);
  endYear = Number(saleYear);
  if (saleMonth.indexOf(":") !== -1) {
    startMonth = saleMonth.split(":")[0];
    endMonth = saleMonth.split(":")[1];
  }
  if (saleYear.indexOf(":") !== -1) {
    startYear = saleYear.split(":")[0];
    endYear = saleYear.split(":")[1];
  }
  if (!startMonth) {
    startMonth = date.getMonth() + 1;
  }
  if (!endMonth) {
    endMonth = date.getMonth() + 1;
  }
  if (!startYear) {
    startYear = date.getFullYear();
  }
  if (!endYear) {
    endYear = date.getFullYear();
  }

  let filterOptions = {
    saleMonth: { [db.Sequelize.Op.between]: [startMonth, endMonth] },
    saleYear: { [db.Sequelize.Op.between]: [startYear, endYear] },
    productId: productId,
  };
  let includes = [];
  if (productType === "1") {
    includes.push({
      model: db.Product,
    });
    includes.push({
      model: db.User,
    });
  }
  try {
    const filter2 = new filter(db.Sales, req.query, includes);
    filter2.query.where = { ...filter2.query.where, ...filterOptions };
    let result = await filter2
      .filter()
      .sort()
      .limitFields()
      .paginate()
      .include()
      .build();
    sales = result.rows;
    const pagination = {
      totalItems: result.totalItems,
      totalPages: Math.ceil(result.totalItems / result.limit),
      currentPage: result.page,
      itemsPerPage: result.limit,
    };
    res.status(200).json({
      status: "success",
      data: sales,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};
module.exports.salesByDate = async (req, res, next) => {
  const { from, to } = req.params;
  let salesByDate;
  let start = from === "0" ? new Date("1970-01-01") : new Date(from);
  let end = to === "0" ? new Date("2070-12-31") : new Date(to);
  end.setDate(end.getDate() + 1);

  let filterOptions = {
    createdAt: { [db.Sequelize.Op.between]: [start, end] },
  };
  let includes = [];
  includes.push({
    model: db.Product,
  });
  includes.push({
    model: db.User,
  });

  try {
    const filter2 = new filter(db.Sales, req.query, includes);
    filter2.query.where = { ...filter2.query.where, ...filterOptions };
    let result = await filter2
      .filter()
      .sort()
      .limitFields()
      .paginate()
      .include()
      .build();
    salesByDate = result.rows;
    const pagination = {
      totalItems: result.totalItems,
      totalPages: Math.ceil(result.totalItems / result.limit),
      currentPage: result.page,
      itemsPerPage: result.limit,
    };
    res.status(200).json({
      status: "success",
      data: salesByDate,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};
module.exports.salesBySeller = async (req, res, next) => {
  const { sellerId } = req.params;
  let salesBySeller;
  let filterOptions = {
    sellerId: { [db.Sequelize.Op.eq]: sellerId },
  };
  let includes = [];
  includes.push({
    model: db.Product,
  });
  includes.push({
    model: db.User,
  });

  try {
    const filter2 = new filter(db.Sales, req.query, includes);
    filter2.query.where = { ...filter2.query.where, ...filterOptions };
    let result = await filter2
      .filter()
      .sort()
      .limitFields()
      .paginate()
      .include()
      .build();
    salesBySeller = result.rows;
    const pagination = {
      totalItems: result.totalItems,
      totalPages: Math.ceil(result.totalItems / result.limit),
      currentPage: result.page,
      itemsPerPage: result.limit,
    };
    res.status(200).json({
      status: "success",
      data: salesBySeller,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};
async function getTopSellingProducts(startDate, endDate, queryString) {
  try {
    const filter2 = new filter(db.Sales, queryString, [
      {
        model: db.Product,
        as: "Product",
        attributes: ["productName"],
      },
    ]);

    filter2.filter().sort().limitFields().paginate().include();

    filter2.query.where.createdAt = {
      [db.Sequelize.Op.between]: [startDate, endDate],
    };

    filter2.query.attributes = [
      "productId",
      [
        db.sequelize.fn("SUM", db.sequelize.col("quantity")),
        "totalQuantitySold",
      ],
    ];
    filter2.query.group = ["productId"];
    filter2.query.order = [
      [db.sequelize.fn("SUM", db.sequelize.col("quantity")), "DESC"],
    ];
    filter2.query.limit = 10;

    const result = await filter2.build();

    return result;
  } catch (error) {
    console.log(error);
  }
}

module.exports.getTopSellingProductsOfMonth = async (req, res, next) => {
  const startOfMonth = moment().startOf("month").toDate();
  const endOfMonth = moment().endOf("month").toDate();
  try {
    const result = await getTopSellingProducts(
      startOfMonth,
      endOfMonth,
      req.query
    );

    const pagination = {
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      currentPage: result.page,
      itemsPerPage: result.limit,
    };

    res.status(200).json({
      status: "success",
      data: result.rows,
      pagination,
    });
  } catch (e) {
    next(e);
  }
};
module.exports.getTopSellingProductsOfQuarter = async (req, res, next) => {
  const startOfQuarter = moment().startOf("quarter").toDate();
  const endOfQuarter = moment().endOf("quarter").toDate();
  try {
    const result = await getTopSellingProducts(
      startOfQuarter,
      endOfQuarter,
      req.query
    );

    const pagination = {
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      currentPage: result.page,
      itemsPerPage: result.limit,
    };

    res.status(200).json({
      status: "success",
      data: result.rows,
      pagination,
    });
  } catch (e) {
    next(e);
  }
};

module.exports.getTopSellingProductsOfYear = async (req, res, next) => {
  const startOfYear = moment().startOf("year").toDate();
  const endOfYear = moment().endOf("year").toDate();
  try {
    const result = await getTopSellingProducts(
      startOfYear,
      endOfYear,
      req.query
    );

    const pagination = {
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      currentPage: result.page,
      itemsPerPage: result.limit,
    };

    res.status(200).json({
      status: "success",
      data: result.rows,
      pagination,
    });
  } catch (e) {
    next(e);
  }
};
function getDateRange(period) {
  let startDate, endDate;

  switch (period) {
    case "month":
      startDate = moment().startOf("month").toDate();
      endDate = moment().endOf("month").toDate();
      break;
    case "quarter":
      startDate = moment().startOf("quarter").toDate();
      endDate = moment().endOf("quarter").toDate();
      break;
    case "year":
      startDate = moment().startOf("year").toDate();
      endDate = moment().endOf("year").toDate();
      break;
    default:
    //throw new Error('Invalid period specified');
  }

  return { startDate, endDate };
}

module.exports.getTotalSalesAndProfit = async (req, res, next) => {
  const { startDate, endDate } = getDateRange(req.period);

  try {
    const filter2 = new filter(db.Sales, req.query, [
      {
        model: db.Product,
        as: "Product",
        attributes: ["productName", "pricePerUnit"],
      },
    ]);

    filter2.filter().sort().limitFields().paginate().include();

    filter2.query.where.createdAt = {
      [db.Sequelize.Op.between]: [startDate, endDate],
    };

    filter2.query.attributes = [
      "productId",
      [
        db.sequelize.fn("SUM", db.sequelize.col("quantity")),
        "totalQuantitySold",
      ],
      [
        db.sequelize.fn(
          "SUM",
          db.sequelize.literal("quantity * salePricePerUnit")
        ),
        "totalSales",
      ],
      [
        db.Sequelize.fn(
          "SUM",
          db.Sequelize.literal("quantity * buyPricePerUnit")
        ),
        "totalCost",
      ],
      [
        db.Sequelize.fn(
          "SUM",
          db.Sequelize.literal(
            "(quantity * salePricePerUnit) - (quantity * buyPricePerUnit)"
          )
        ),
        "profit",
      ],
    ];
    filter2.query.group = ["productId"];

    const result = await filter2.build();

    const pagination = {
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      currentPage: result.page,
      itemsPerPage: result.limit,
    };

    res.status(200).json({
      status: "success",
      data: result.rows,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};
module.exports.getTotalSalesAndProfitMonth = async (req, res, next) => {
  req.period = "month";
  next();
};
module.exports.getTotalSalesAndProfitQuarter = async (req, res, next) => {
  req.period = "quarter";
  next();
};
module.exports.getTotalSalesAndProfitYear = async (req, res, next) => {
  req.period = "year";
  next();
};
module.exports.getPeakAndDropSalesQuarterProduct = async (req, res, next) => {
  try {
    const results = await db.Sales.findAll({
      attributes: [
        "productId",
        "saleYear",
        [
          db.sequelize.fn("QUARTER", db.sequelize.col("Sales.createdAt")),
          "saleQuarter",
        ],
        [
          db.sequelize.fn(
            "SUM",
            db.sequelize.literal("quantity * salePricePerUnit")
          ),
          "totalSales",
        ],
      ],
      group: ["productId", "saleYear", "saleQuarter"],
      order: [["productId"], ["saleYear"], ["saleQuarter"]],
      include: [
        {
          model: db.Product,
          attributes: ["productName", "pricePerUnit"],
        },
      ],
    });
    res.status(200).json({
      status: "Success",
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

module.exports.getSalesAndProfitForInterval = async (req, res, next) => {
  const { startDate, endDate } = req.params;
  const start = new Date(startDate);
  let end = new Date(endDate);
  end.setDate(end.getDate() + 1);

  try {
    const { productSales, totalAggregatedData } = await this.getSalesAndProfit(
      start,
      end
    );

    res.status(200).json({
      status: "success",
      data: {
        productSales,
        totalAggregatedData,
      },
    });
  } catch (error) {
    next(error);
  }
};
module.exports.getSalesAndProfit = async (startDate, endDate) => {
  try {
    const productSales = await db.Sales.findAll({
      attributes: [
        "productId",
        [
          db.Sequelize.fn("SUM", db.Sequelize.col("quantity")),
          "totalQuantitySold",
        ],
        [
          db.Sequelize.fn(
            "SUM",
            db.Sequelize.literal("quantity * salePricePerUnit")
          ),
          "totalSales",
        ],
        [
          db.Sequelize.fn(
            "SUM",
            db.Sequelize.literal("quantity * buyPricePerUnit")
          ),
          "totalCost",
        ],
        [
          db.Sequelize.fn(
            "SUM",
            db.Sequelize.literal(
              "(quantity * salePricePerUnit) - (quantity * buyPricePerUnit)"
            )
          ),
          "profit",
        ],
      ],
      where: {
        createdAt: {
          [db.Sequelize.Op.between]: [startDate, endDate],
        },
      },
      group: ["productId"],
      include: [
        {
          model: db.Product,
          attributes: ["productName"],
        },
      ],
    });
    const totalAggregatedData = await db.Sales.findOne({
      attributes: [
        [
          db.Sequelize.fn(
            "SUM",
            db.Sequelize.literal("quantity * salePricePerUnit")
          ),
          "totalSales",
        ],
        [
          db.Sequelize.fn(
            "SUM",
            db.Sequelize.literal("quantity * buyPricePerUnit")
          ),
          "totalCost",
        ],
        [
          db.Sequelize.fn(
            "SUM",
            db.Sequelize.literal(
              "(quantity * salePricePerUnit) - (quantity * buyPricePerUnit)"
            )
          ),
          "profit",
        ],
      ],
      where: {
        createdAt: {
          [db.Sequelize.Op.between]: [startDate, endDate],
        },
      },
    });
    return {
      productSales,
      totalAggregatedData,
    };
  } catch (error) {
    console.log(error);
    return new AppExceptions("Server Error SaleController", 500);
  }
};
