module.exports = (sequelize, DataTypes) => {
    const transactionHistory = sequelize.define('TransactionHistory', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        transactionType: {
            type: DataTypes.ENUM,
            values: [
                'sale',
                'return',
                'stock_in',
                'stock_out',
                'sale_update',
                'sale_cancel',
                'return_update',
                'return_cancel'
            ],
            allowNull: false
        },
        transactionDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: new Date(Date.now())
        },
        sellerId: {
            type: DataTypes.UUID,
            allowNull: true,
            index:true
        },
        productId: {
            type: DataTypes.UUID,
            allowNull: false,
            index:true
        },
        quantity: {
            type: DataTypes.DOUBLE,
            allowNull: true
        },
        unitPrice: {
            type: DataTypes.DOUBLE,
            allowNull: true 
        },
        totalCost: {
            type: DataTypes.DOUBLE,
            allowNull: true
        },
        returnReason: {
            type: DataTypes.ENUM,
            values: ['damagedProduct', 'unwantedItem', 'wrongSize'],
            allowNull: true 
        }

    }, { timestamps: true });
    transactionHistory.associate = (models) => {
        transactionHistory.belongsTo(models.Product, {
            foreignKey: 'productId'
        });
    };
    return transactionHistory;
}
