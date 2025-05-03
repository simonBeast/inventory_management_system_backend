const db = require('../models/index');
const AppExceptions = require('../util/AppExceptions');
const filter = require('../util/filter');
const { sendLowStockMail } = require('../util/email');
const { Op, col } = require('sequelize');
module.exports.getProductById = async (id) => {
    try {
        const product = await db.Product.findOne({ where: { id }, include: ['ProductDetail', 'ProductSubCategory'] });
        return product;
    }
    catch (e) {
        console.log(e);
        return 0;
    }
}
module.exports.getProductDetailById = async (id) => {
    try {
        const productD = await db.ProductDetails.findOne({ where: { id } });
        return productD;
    }
    catch (e) {
        console.log(e);
        return 0;
    }
}
module.exports.getProductDetailByProductId = async (id) => {
    try {
        const productD = await db.ProductDetails.findOne({ where: { productId: id } });
        return productD;
    }
    catch (e) {
        console.log(e);
        return 0;
    }
}
module.exports.createProduct = async (req, res, next) => {
    let transaction;
    const product = {
        productCode: null, productSubCategoryId: null,
        productName: null, measurementUnit: null, pricePerUnit: null,
        productDescription: null
    };
    const productDetails = {
        productId: null,
        availableQuantity: null,
        minimumStockLevel: null
    }
    if (Number(req.body.pricePerUnit) < 0) {
        return next(new AppExceptions("price per unit can't be less than 0", 400))
    }
    if (Number(req.body.availableQuantity) < 0) {
        return next(new AppExceptions("available quantity unit can't be less than 0", 400))
    }
    if (Number(req.body.minimumStockLevel) < 0) {
        return next(new AppExceptions("minimum stock level can't be less than 0", 400))
    }
    product.productCode = req.body.productCode;
    product.productSubCategoryId = req.body.productSubCategoryId;
    product.productName = req.body.productName;
    product.measurementUnit = req.body.measurementUnit;
    product.pricePerUnit = req.body.pricePerUnit;
    product.productDescription = req.body.productDescription;
    productDetails.availableQuantity = req.body.availableQuantity;
    productDetails.minimumStockLevel = req.body.minimumStockLevel;


    try {
        transaction = await db.sequelize.transaction();
        const newProduct = await db.Product.create(product, { transaction });
        productDetails.productId = newProduct.id;
        await db.ProductDetails.create(productDetails, { transaction });
        await transaction.commit();
        res.status(201).json({
            status: 'success',
            data: newProduct
        });
    } catch (e) {
        console.log(e);
        await transaction.rollback();
        next(e);
    }
}
module.exports.getProduct = async (req, res, next) => {
    const id = req.params.id;
    let product;
    try {
        product = await this.getProductById(id);
        if (!product) {
            next(new AppExceptions('Product not found', 404));
        }
        else {
            res.status(200).json({
                status: 'success',
                data: product
            });
        }
    } catch (e) {
        console.log(e);
        next(e);
    }
}
module.exports.getProductsAlphaOrderNoLimit = async (req, res, next) => {
    let products;
    try {
        products = await db.Product.findAll({order:[['productName','ASC']]})
       
        let emailText ;
            res.status(200).json({
                status: 'success',
                data: products
            });
    } catch (e) {
        console.log(e);
        next(e);
    }
}
module.exports.getProducts = async (req, res, next) => {
    let products;
    const queryString = req.query;
    const includes = [{ model: db.ProductSubCategory }, { model: db.ProductDetails }];
    const apiFilters = new filter(db.Product, queryString, includes);
    try {
        let result = await apiFilters.filter().limitFields().sort().paginate().include().build();
        products = result.rows;
        const pagination = {
            totalItems: result.totalItems,
            totalPages: Math.ceil(result.totalItems / result.limit),
            currentPage: result.page,
            itemsPerPage: result.limit
        };
        res.status(200).json({
            status: 'success',
            data: products,
            pagination
        });
    } catch (e) {
        console.log(e);
        next(e);
    }
}
module.exports.updateProduct = async (req, res, next) => {
    const id = req.params.id;
    const oldProduct = await this.getProductById(id);
    const oldProductDetail = await this.getProductDetailById(oldProduct.ProductDetail.id);
    if (oldProduct) {
        if (req.body.productCode) {
            oldProduct.productCode = req.body.productCode;
        }
        if (req.body.productSubCategoryId) {
            oldProduct.productSubCategoryId = req.body.productSubCategoryId;
        }
        if (req.body.productName) {
            oldProduct.productName = req.body.productName;
        }
        if (req.body.measurementUnit) {
            oldProduct.measurementUnit = req.body.measurementUnit;
        }
        if (req.body.pricePerUnit) {
            if (Number(req.body.pricePerUnit) < 0) {
                return next(new AppExceptions("price per unit can't be less than 0", 400))
            }
            oldProduct.pricePerUnit = req.body.pricePerUnit;
        }
        if (req.body.productDescription) {
            oldProduct.productDescription = req.body.productDescription;
        }
        if (req.body.minimumStockLevel) {
            if (Number(req.body.availableQuantity) < 0) {
                return next(new AppExceptions("available quantity unit can't be less than 0", 400))
            }
            oldProductDetail.minimumStockLevel = req.body.minimumStockLevel;
        }
        if (req.body.availableQuantity) {
            if (Number(req.body.minimumStockLevel) < 0) {
                return next(new AppExceptions("minimum stock level can't be less than 0", 400))
            }
            oldProductDetail.availableQuantity = req.body.availableQuantity;
        }



        let transaction = await db.sequelize.transaction();
        try {
            await oldProduct.save({ transaction });
            await oldProductDetail.save({ transaction });
            await transaction.commit();
            res.status(200).json({
                status: "Success",
                message: 'Update Successful'
            })
        } catch (e) {
            (await transaction).rollback();
            next(e);
        }
    }
    else {
        next(new AppExceptions('Product not found', 404));
    }

}
module.exports.addNewStock = async (req, res, next) => {
    const id = req.params.id;
    const oldProduct = await this.getProductById(id);
    const oldProductDetail = await this.getProductDetailById(oldProduct.ProductDetail.id);
    console.log(oldProductDetail.availableQuantity)
    if (oldProduct) {
        if (req.body.pricePerUnit && req.body.quantity) {
            if (Number(req.body.pricePerUnit) < 0) {
                return next(new AppExceptions("price per unit can't be less than 0", 400))
            } 
            if (Number(req.body.quantity) < 0) {
                return next(new AppExceptions("quantity can't be less than 0", 400))
            }
            console.log(oldProduct.pricePerUnit, "   ",oldProductDetail.availableQuantity,"   ",req.body)
            oldProduct.pricePerUnit = (((Number(oldProduct.pricePerUnit)  *  Number(oldProductDetail.availableQuantity)) 
            + (Number(req.body.pricePerUnit)  * Number(req.body.quantity)) ) / (Number(oldProductDetail.availableQuantity) + Number(req.body.quantity))).toFixed(3);
            
            oldProductDetail.availableQuantity = Number(oldProductDetail.availableQuantity) + Number(req.body.quantity);
        
        let transaction = await db.sequelize.transaction();
        try {
            await oldProduct.save({ transaction });
            await oldProductDetail.save({ transaction });
            await transaction.commit();
            res.status(200).json({
                status: "Success",
                message: 'New Stock successfuly added'
            })
        } catch (e) {
            (await transaction).rollback();
            next(e);
        }
    }
    }
    else {
        next(new AppExceptions('Product not found', 404));
    }

}
module.exports.deleteProduct = async (req, res, next) => {
    const id = req.params.id;
    const oldProduct = await this.getProductById(id);
    console.log(id,oldProduct);
    const oldProductDetail = await this.getProductDetailById(oldProduct.ProductDetail.id);
    if (oldProduct) {
        try {
            let transaction = await db.sequelize.transaction();
            await oldProduct.destroy({ transaction });
            await oldProductDetail.destroy({ transaction });
            await transaction.commit();
            res.status(204).json({
                status: "Success",
                message: 'delete Successful'
            })
        } catch (e) {
            await transaction.rollback();
            console.log(e);
            next(e);
        }
    }
    else {
        next(new AppExceptions('Product not found', 404));
    }
}
module.exports.updateAndCheckAvailableQuantity = async (product, quantity, flag, transaction) => {
    console.log("product",product);
    try {
        let productDetails = await this.getProductDetailById(product.ProductDetail.id);
        if (flag == 1) {
            if (((Number(productDetails.availableQuantity) - Number(quantity)) < 0)) {
                return false;
            }
            if ((Number(productDetails.availableQuantity) - Number(quantity)) < Number(productDetails.minimumStockLevel)) {
                product.ProductDetail.availableQuantity = Number(productDetails.availableQuantity) - Number(quantity)
                //await sendLowStockMail([product]);
            }
            productDetails.availableQuantity = Number(productDetails.availableQuantity) - Number(quantity);
        }
        await productDetails.save({ transaction });
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
}
module.exports.checkForLowStock = async (req, res, next) => {
    try {
        const lowStockProducts = await db.Product.findAll({
            include: [{
                model: db.ProductDetails,
                where: db.Sequelize.where(db.Sequelize.col('ProductDetail.availableQuantity'), '<=', db.Sequelize.col('ProductDetail.minimumStockLevel'))
            }]
        });
        res.status(200).json({
            data: lowStockProducts
        })

        await sendLowStockMail(lowStockProducts);

    } catch (error) {
        console.error('Error checking stock levels:', error);
    }
}
module.exports.getProductData = async (req, res, next) => {
    try {
        const products = await db.Product.findAll({
            attributes: ['productName', 'measurementUnit'],
            include: [
                {
                    model: db.ProductDetails,
                    attributes: ['availableQuantity', 'minimumStockLevel'],
                    required: true,
                },
                {
                    model: db.ProductSubCategory,
                    attributes: ['name'],
                    order: [['name', 'ASC']],
                    required: true,
                    include: [
                        {
                            model: db.ProductCategory,
                            attributes: ['name'],
                            order: [['name', 'ASC']],
                            required: true,
                            include:
                                [
                                    {
                                        model: db.Category,
                                        attributes: ['name'],
                                        order: [['name', 'ASC']],
                                        required: true,
                                    }
                                ]
                        }
                    ]
                }

            ],
            order: [
                [db.ProductSubCategory, db.ProductCategory, db.Category, 'name', 'ASC'],
                [db.ProductSubCategory, db.ProductCategory, 'name', 'ASC'],
                [db.ProductSubCategory, 'name', 'ASC'],
                ['productName', 'ASC']
            ]
        })

        let productDetails = await db.ProductDetails.findAll({where: {availableQuantity: {[Op.lte]: col('minimumStockLevel')}},include:["Product"]});
        sendLowStockMail(productDetails);

        res.status(200).json({
            status: 'success',
            data: products
        });
    } catch (error) {
        next(error)
    }
}

