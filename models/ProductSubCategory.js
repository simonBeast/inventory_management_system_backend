module.exports = (sequelize, DataTypes) => {
    const productSubCategory = sequelize.define('ProductSubCategory', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        productCategoryId: {
            type: DataTypes.UUID,
            allowNull: false,
            index: true
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        }

    }, { timestamps: true });
    productSubCategory.associate = (models) => {
        productSubCategory.belongsTo(models.ProductCategory, {
            foreignKey: "productCategoryId",
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        })
        productSubCategory.hasMany(models.Product, {
            foreignKey: "productSubCategoryId",
            
        })
    }
    return productSubCategory;
}


