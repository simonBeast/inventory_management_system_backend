module.exports = (sequelize, DataTypes) => {
    const expense = sequelize.define('Expense', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        category: {
            type: DataTypes.ENUM,
            values: [
                'rent',
                'utilities',
                'transport',
                'salaries',
                'maintenance',
                'supplies',
                'equipment',
                'tax',
                'other'
            ],
            allowNull: true,
            defaultValue: 'other'
        },
        amount: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        expenseDate: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, { timestamps: true });

    return expense;
};
