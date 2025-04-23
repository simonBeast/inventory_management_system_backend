const db = require('../models/index');
const AppExceptions = require('../util/AppExceptions');
const filter = require('../util/filter');
module.exports.getProductCategoryById = async (id) => {
    try {
        const productCategory = await db.ProductCategory.findOne({ where: { id }, include: ['Category'] });
        return productCategory;
    }
    catch (e) {
        console.log(e);
        return 0;
    }
}
module.exports.createProductCategory = async (req, res, next) => {
    const productCategory = { name: "", categoryId: "", color: "", code: "", description: "" };
    productCategory.name = req.body.name;
    productCategory.categoryId = req.body.categoryId;
    productCategory.color = req.body.color;
    productCategory.code = req.body.code;
    productCategory.description = req.body.description;
    try {
        const newProductCategory = await db.ProductCategory.create(productCategory);
        res.status(201).json({
            status: 'success',
            data: newProductCategory
        });
    } catch (e) {
        next(e);
    }
}
module.exports.getProductCategory = async (req, res, next) => {
    const id = req.params.id;
    let productCategory;
    try {
        productCategory = await this.getProductCategoryById(id);
        if (!productCategory) {
            next(new AppExceptions('ProductCategory not found', 404));
        }
        else {
            res.status(200).json({
                status: 'success',
                data: productCategory
            });
        }
    } catch (e) {
        console.log(e);
        next(e);
    }
}
module.exports.getProductCategoriesAlphaOrderNoLimit = async (req, res, next) => {
    let productCategories;
    try {
        productCategories = await db.ProductCategory.findAll({order:[['name','ASC']]})
            res.status(200).json({
                status: 'success',
                data: productCategories
            });
    } catch (e) {
        console.log(e);
        next(e);
    }
}
module.exports.getProductCategories = async (req, res, next) => {
    let productCategories;
    const queryString = req.query;
    const includes = [{ model: db.Category }];
    const apiFilters = new filter(db.ProductCategory, queryString , includes);
    try {
        result = await apiFilters.filter().limitFields().sort().paginate().include().build();
        productCategories = result.rows;
        const pagination = {
            totalItems: result.totalItems,
            totalPages: Math.ceil(result.totalItems / result.limit),
            currentPage: result.page,
            itemsPerPage: result.limit
        };
        res.status(200).json({
            status: 'success',
            data: productCategories,
            pagination
        });
    } catch (e) {
        console.log(e);
        next(e);
    }
}
module.exports.updateProductCategory = async (req, res, next) => {
    const id = req.params.id;
    const oldProductCategory = await this.getProductCategoryById(id);
    if (oldProductCategory) {
        if (req.body.name) {
            oldProductCategory.name = req.body.name;
        }
        if (req.body.categoryId) {
            oldProductCategory.categoryId = req.body.categoryId;
        }
        if (req.body.color) {
            oldProductCategory.color = req.body.color;
        }
        if (req.body.code) {
            oldProductCategory.code = req.body.code;
        }
        if (req.body.description) {
            oldProductCategory.description = req.body.description;
        }
        try {
            await oldProductCategory.save();
            res.status(200).json({
                status: "Success",
                message: 'Update Successful'
            })
        } catch (e) {
            console.log(e);
            next(e);
        }
    }
    else {
        next(new AppExceptions('ProductCategory not found', 404));
    }

}
module.exports.deleteProductCategory = async (req, res, next) => {
    const id = req.params.id;
    const oldProductCategory = await this.getProductCategoryById(id);
    if (oldProductCategory) {
        try {
            await oldProductCategory.destroy();
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
        next(new AppExceptions('ProductCategory not found', 404));
    }
}
