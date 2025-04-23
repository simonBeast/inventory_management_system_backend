
module.exports = (sequelize, DataTypes) => {
    const Category = sequelize.define('Category', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            index:true,
        }

    }, {  timestamps: true });
    Category.associate = async (models) => {
        Category.hasMany( models.ProductCategory,{foreignKey:'categoryId',as:"ProductCategory"
        });
    }
    return Category;
}
