const db = require('../models/index');
const AppExceptions  = require('../util/AppExceptions');
const filter = require('../util/filter');
module.exports.getProductSubCategoryById = async (id) => {
    try {
        const productSubCategory = await db.ProductSubCategory.findOne({where:{id}, include: ['ProductCategory']});
        return productSubCategory;
    }
    catch (e) {
        console.log(e);
        return 0;
    }
}
module.exports.createProductSubCategory = async (req, res, next) => {
    const productSubCategory = { name: "", productCategoryId: ""};
    productSubCategory.name = req.body.name;
    productSubCategory.productCategoryId = req.body.productCategoryId;
    productSubCategory.description = req.body.description;
    try {
        const newProductSubCategory = await db.ProductSubCategory.create(productSubCategory);
        res.status(201).json({
            status: 'success',
            data: newProductSubCategory
        });
    } catch (e) {
        next(e);
    }
}
module.exports.getProductSubCategory = async (req, res, next) => {
    const id = req.params.id;
    let productSubCategory;
    try {
        productSubCategory = await this.getProductSubCategoryById(id);
        if (!productSubCategory) {
            next(new AppExceptions('ProductSubCategory not found', 404));
        }
        else {
            res.status(200).json({
                status: 'success',
                data: productSubCategory
            });
        }
    } catch (e) {
        console.log(e);
        next(e);
    }
}
module.exports.getProductSubCategoriesAlphaOrderNoLimit = async (req, res, next) => {
    let productSubCategories;
    try {
        productSubCategories = await db.ProductSubCategory.findAll({order:[['name','ASC']]})
            res.status(200).json({
                status: 'success',
                data: productSubCategories
            });
    } catch (e) {
        console.log(e);
        next(e);
    }
}
module.exports.getProductSubCategories = async (req, res, next) => {
    let result;
    const queryString = req.query;
    const includes = [{ model: db.ProductCategory }];
    const apiFilters = new filter(db.ProductSubCategory, queryString , includes)
    try {
        result = await apiFilters.filter().limitFields().sort().paginate().include().build();
        productSubCategories = result.rows;
        const pagination = {
            totalItems: result.totalItems,
            totalPages: Math.ceil(result.totalItems / result.limit),
            currentPage: result.page,
            itemsPerPage: result.limit
        };
        res.status(200).json({
            status: 'success',
            data: productSubCategories,
            pagination
        });
    } catch (e) {
        console.log(e);
        next(e);
    }
}
module.exports.updateProductSubCategory = async (req, res, next) => {
    const id = req.params.id;
    const oldProductSubCategory = await this.getProductSubCategoryById(id);
    if (oldProductSubCategory) {
        if (req.body.name) {
            oldProductSubCategory.name = req.body.name;
        }
        if(req.body.productSubCategoryId){
            oldProductSubCategory.productSubCategoryId = req.body.productSubCategoryId;
        }
        if(req.body.description){
            oldProductSubCategory.description = req.body.description;
        }
        try {
            await oldProductSubCategory.save();
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
        next(new AppExceptions('ProductSubCategory not found', 404));
    }

}
module.exports.deleteProductSubCategory = async (req, res, next) => {
    const id = req.params.id;
    const oldProductSubCategory = await this.getProductSubCategoryById(id);
    if (oldProductSubCategory) {
        try {
            await oldProductSubCategory.destroy();
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
        next(new AppExceptions('ProductSubCategory not found', 404));
    }
}
