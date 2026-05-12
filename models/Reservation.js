module.exports = (sequelize, DataTypes) => {
    const reservation = sequelize.define('Reservation', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        productId: {
            type: DataTypes.UUID,
            allowNull: true,
            index: true
        },
        productSubCategoryId: {
            type: DataTypes.UUID,
            allowNull: true,
            index: true
        },
        quantity: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        reservedSalePrice: {
            type: DataTypes.DOUBLE,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM,
            values: ['pending', 'fulfilled', 'cancelled'],
            allowNull: false,
            defaultValue: 'pending'
        },
        note: {
            type: DataTypes.STRING(500),
            allowNull: true
        }
    }, { timestamps: true });

    reservation.associate = (models) => {
        reservation.belongsTo(models.Product, {
            foreignKey: 'productId',
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
        });
        reservation.belongsTo(models.ProductSubCategory, {
            foreignKey: 'productSubCategoryId',
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
        });
    };

    return reservation;
};
