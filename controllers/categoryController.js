const db = require('../models/index');
const AppExceptions = require('../util/AppExceptions');
const filter = require('../util/filter');
module.exports.getCategoryById = async (id) => {
    try {
        const category = await db.Category.findOne({
            where:{id},
            include:[{
                model:db.ProductCategory,
                as:"ProductCategory",
                include:[{
                    model:db.ProductSubCategory
                    
                }]
            }
                
            ]});
        return category;
    }
    catch (e) {
        console.log(e);
        return 0;
    }
}
module.exports.createCategory = async (req, res, next) => {
    const category = { name: "" };
    category.name = req.body.name;
    try {
        const newCategory = await db.Category.create(category);
        res.status(201).json({
            status: 'success',
            data: newCategory
        });
    } catch (e) {
        next(e);
    }
}
module.exports.getCategory = async (req, res, next) => {
    const id = req.params.id;
    let category;
    try {
        category = await this.getCategoryById(id);
        if (!category) {
           next(new AppExceptions('Category not found', 404));
        }
        else {
            res.status(200).json({
                status: 'success',
                data: category
            });
        }
    } catch (e) {
        console.log(e);
        next(e);
    }
}
module.exports.getCategoriesAlphaOrderNoLimit = async (req, res, next) => {
    let categories;
    try {
        categories = await db.Category.findAll({order:[['name','ASC']]})
            res.status(200).json({
                status: 'success',
                data: categories
            });
    } catch (e) {
        console.log(e);
        next(e);
    }
}
module.exports.getCategories = async (req, res, next) => {
    let categories;
    const queryString = req.query;
    const includes = [{ model: db.ProductCategory , as: "ProductCategory" ,separate: true}];
    const apiFilters = new filter( db.Category, queryString, includes);
    try {
        result = await apiFilters.filter().limitFields().sort().paginate().include().build();
        categories = result.rows;
        const pagination = {
            totalItems: result.totalItems,
            totalPages: Math.ceil(result.totalItems / result.limit),
            currentPage: result.page,
            itemsPerPage: result.limit
        };
        res.status(200).json({
            status: 'success',
            data: categories,
            pagination
        });
    } catch (e) {
        console.log(e);
        next(e);
    }
}
module.exports.updateCategory = async (req, res, next) => {
    const id = req.params.id;
    const oldCategory = await this.getCategoryById(id);
    if (oldCategory) {
        if (req.body.name) {
            oldCategory.name = req.body.name;
        }
        try {
            await oldCategory.save();
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
        next(new AppExceptions('Category not found', 404));
    }

}
module.exports.deleteCategory = async (req, res, next) => {
    const id = req.params.id;
    const oldCategory = await this.getCategoryById(id);
    if (oldCategory) {
        try {
            await oldCategory.destroy();
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
       next(new AppExceptions('Category not found', 404));
    }
}
