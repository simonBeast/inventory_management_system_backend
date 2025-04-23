const Joi = require('joi');
module.exports.registerValidationSchema = {
    body: Joi.object({
        fullName: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().required().min(8)
    },
    ).options({ abortEarly: false })

}
module.exports.signinValidationSchema = {
    body: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required().min(8),
    }).options({ abortEarly: false }),
}
module.exports.updateUserValidationSchema = {
    body: Joi.object({
        fullName: Joi.string().allow(null).optional(),
        email: Joi.string().email().allow(null).optional(),
    }).options({ abortEarly: false }),
}
module.exports.categoryValidationSchema = {
    body: Joi.object({
        name: Joi.string().required()
    }).options({ abortEarly: false })
}
module.exports.categoryUpdateValidationSchema = {
    body: Joi.object({
        name: Joi.string().allow(null).optional()
    }).options({ abortEarly: false })
}
module.exports.productCategoryValidationSchema = {
    body: Joi.object({
        name: Joi.string().required(),
        categoryId: Joi.required(),
        color: Joi.allow(null).optional(),
        code: Joi.allow(null).optional(),
        description: Joi.string().max(35).allow(null).optional()

    }).options({ abortEarly: false })
}
module.exports.productCategoryUpdateValidationSchema = {
    body: Joi.object({
        name: Joi.string().allow(null).optional(),
        categoryId: Joi.string().allow(null).optional(),
        color: Joi.string().allow(null).optional(),
        code: Joi.string().allow(null).optional(),
        description: Joi.string().max(35).allow(null).optional()
    }).options({ abortEarly: false })
}
module.exports.productSubCategoryValidationSchema = {
    body: Joi.object({
        name: Joi.string().required(),
        productCategoryId: Joi.string().required(),
        description: Joi.string().max(35).allow(null).optional()

    }).options({ abortEarly: false })
}
module.exports.productSubCategoryUpdateValidationSchema = {
    body: Joi.object({
        name: Joi.string().required(),
        productCategoryId: Joi.string().required(),
        description: Joi.string().max(35).allow(null).optional()
    }).options({ abortEarly: false })
}
module.exports.productValidationSchema = {
    body: Joi.object({
        productCode: Joi.string().allow(null).optional(),
        productSubCategoryId: Joi.string().required(),
        productName: Joi.string().required(),
        measurementUnit: Joi.string().valid('pieces', 'kilo').required(),
        pricePerUnit: Joi.number().required(),
        productDescription: Joi.string().allow(null).optional(),
        availableQuantity: Joi.number().required(),
        minimumStockLevel: Joi.number().required()
    }).options({ abortEarly: false }),
}
module.exports.productUpdateValidationSchema = {
    body: Joi.object({
        productCode: Joi.string().allow(null).optional(),
        productSubCategoryId: Joi.string().allow(null).optional(),
        productName: Joi.string().allow(null).optional(),
        measurementUnit: Joi.string().valid('pieces', 'kilo').allow(null).optional(),
        pricePerUnit: Joi.number().allow(null).optional(),
        productDescription: Joi.string().allow(null).optional(),
        availableQuantity: Joi.number().allow(null).optional(),
        minimumStockLevel: Joi.number().allow(null).optional()
    }).options({ abortEarly: false })
}
module.exports.returnValidationSchema = {
    body: Joi.object({
        saleId: Joi.string().required(),
        quantityReturned: Joi.number().required(),
        reason: Joi.string().valid('damagedProduct', 'unwantedItem', 'wrongSize').allow(null).optional(),
        returnStatus: Joi.string().valid('received', 'inspected', 'restocked', 'refunded').allow(null).optional(),
        description: Joi.string().allow(null).optional()
    }).options({ abortEarly: false }),
}
module.exports.returnUpdateValidationSchema = {
    body: Joi.object({
        saleId: Joi.string().allow(null).optional(),
        quantityReturned: Joi.number().allow(null).optional(),
        reason: Joi.string().valid('damagedProduct', 'unwantedItem', 'wrongSize').allow(null).optional(),
        returnStatus: Joi.string().valid('received', 'inspected', 'restocked', 'refunded').allow(null).optional(),
        description: Joi.string().allow(null).optional()
    }).options({ abortEarly: false })
}
module.exports.saleValidationSchema = {
    body: Joi.object({
        sellerId: Joi.string().required(),
        productId: Joi.string().required(),
        quantity: Joi.number().required(),
        salePricePerUnit: Joi.number().required(),
    }).options({ abortEarly: false })
}
module.exports.saleUpdateValidationSchema = {
    body: Joi.object({
        sellerId: Joi.string().allow(null).optional(),
        productId: Joi.string().allow(null).optional(),
        quantity: Joi.number().allow(null).optional(),
        salePricePerUnit: Joi.number().allow(null).optional()
    }).options({ abortEarly: false })
}
module.exports.changePasswordValidationSchema = {
    body: Joi.object({
        newPassword: Joi.string().min(8).required(),
        oldPassword: Joi.string().min(8).required(),
        confirmPassword: Joi.string().min(8).required()
    })
}
module.exports.forgotPasswordValidationSchema = {
    body: Joi.object({
        email: Joi.string().email().required()
    })
}
module.exports.resetPasswordValidationSchema = {
    body: Joi.object({
        password: Joi.string().min(8).required(),
        confirmPassword: Joi.string().min(8).required()
    })
}
module.exports.addNewStockValidationSchema ={
    body: Joi.object({
        quantity: Joi.number().required(),
        pricePerUnit: Joi.number().required()
    })
}