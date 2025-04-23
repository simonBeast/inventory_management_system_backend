module.exports = (sequelize, DataTypes) => {
    const sales = sequelize.define('Sales', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        sellerId: {
            type: DataTypes.UUID,
            allowNull: false,
            index: true
        },
        productId: {
            type: DataTypes.UUID,
            allowNull: false
        },
        quantity: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        salePricePerUnit: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        buyPricePerUnit: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        totalCost: {
            type: DataTypes.DOUBLE,
            allowNull: true
        },
        saleMonth: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        saleYear: {
            type: DataTypes.INTEGER,
            allowNull: false
        }

    }, { timestamps: true });

    sales.associate = (models) => {
        sales.belongsTo(models.User, {
            foreignKey: "sellerId"
        })
        sales.hasMany(models.Returns, {
            foreignKey: "saleId"
        }),
        sales.belongsTo(models.Product, {
                foreignKey: "productId",
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE'
        })
    }

    return sales;
}




