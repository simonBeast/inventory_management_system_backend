module.exports = (sequelize, DataTypes) => {
    const returns = sequelize.define('Returns', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        saleId:{
            type:DataTypes.UUID,
            allowNull:false,
            index:true
        },
        productId:{
            type:DataTypes.UUID,
            allowNull:false   
        },
        quantityReturned:{
            type:DataTypes.DOUBLE,
            allowNull:false
        },
        reason:{
            type: DataTypes.ENUM,
            values: ['damagedProduct', 'unwantedItem', 'wrongSize'],
            allowNull:true,
        },
        returnDate:{
            type:DataTypes.DATEONLY
        },
        returnStatus:{  
            type: DataTypes.ENUM,
            values: ['received', 'inspected', 'restocked','refunded'],
            allowNull:true,
        },
        description:{
            type:DataTypes.TEXT,
            allowNull:true,
        }
        
    }, {  timestamps: true });
    
    returns.associate = (models) => {
        returns.belongsTo(models.Sales, {
            foreignKey: "saleId",onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        })
        returns.belongsTo(models.Product, {
            foreignKey: "productId",
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        })
    }

    return returns;
}


