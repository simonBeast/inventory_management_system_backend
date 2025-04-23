module.exports = (sequelize, DataTypes) => {
    const product = sequelize.define('Product', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        productCode: {
            type: DataTypes.STRING,
            allowNull: true
        },
        productSubCategoryId: {
            type: DataTypes.UUID,
            allowNull: false,
            index: true
        },
        productName: {
            type: DataTypes.STRING,
            allowNull: false,
            index:true
        },
        measurementUnit: {
            type: DataTypes.ENUM,
            values: ['pieces', 'kilo'],
            allowNull: false,
        },
        pricePerUnit: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        productDescription: {
            type: DataTypes.STRING,
            allowNull: true
        }

    }, { timestamps: true });
    product.associate = (models) => {
        product.hasMany(models.Sales, {
            foreignKey: 'productId',
        });
        product.hasOne(models.ProductDetails, {
            foreignKey: 'productId'
        });
        product.belongsTo(models.ProductSubCategory, {
            foreignKey: "productSubCategoryId", 
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        })
        product.hasMany(models.Returns, {
            foreignKey: 'productId',
        });
    }
    return product;

}

