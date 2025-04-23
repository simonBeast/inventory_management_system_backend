
module.exports = (sequelize, DataTypes) => {
    const productDetail =  sequelize.define('ProductDetails', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        productId:{
            type:DataTypes.UUID,
            allowNull:false,
            index:true
        },
        availableQuantity:{
            type:DataTypes.DOUBLE,
            allowNull:false,
            validate:{
                custom:validateQuantity
            }
        },
        minimumStockLevel:{
            type:DataTypes.DOUBLE,
            allowNull:false
        }

    }, {  timestamps: true });
    productDetail.associate = (models) => {
        productDetail.belongsTo(models.Product, {
            foreignKey: "productId",
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        })
    }
    return productDetail;
}
const { ValidationError } = require('sequelize');

const validateQuantity = (value) => {
    if (value < 0) {
        throw new ValidationError('Available quantity cannot be less than 0.');
    }
}
