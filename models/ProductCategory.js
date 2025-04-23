module.exports = (sequelize, DataTypes) => {
    const productCategory = sequelize.define('ProductCategory', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            index: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        categoryId: {
            type: DataTypes.UUID,
            allowNull: false,
            index: true
        },
        color: {
            type: DataTypes.STRING,
            allowNull: true
        },
        code: {
            type: DataTypes.STRING,
            allowNull: true
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        }

    }, {  timestamps: true });
    productCategory.associate = (models) => {
        productCategory.belongsTo(models.Category, {
            foreignKey: "categoryId",
             onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
        productCategory.hasMany(models.ProductSubCategory, {
            foreignKey: 'productCategoryId',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        })

    }
    return productCategory;
}

