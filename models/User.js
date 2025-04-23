module.exports = (sequelize, DataTypes) => {
    const user = sequelize.define('User', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            index:true
        },
        fullName:{
            type:DataTypes.STRING,
            allowNull:false
        },
        password: {
            type:DataTypes.TEXT,
            allowNull:false
        },
        role:{
            type:DataTypes.ENUM,
            values:["ADMIN","SELLER"]
        },
        passwordChangedAt:{
            type:DataTypes.DATE,
            allowNull:true,
        },
        passwordResetToken:{
            type:DataTypes.STRING,
            allowNull:true,
        },
        passwordResetTokenExpires:{
            type:DataTypes.BIGINT,
            allowNull:true
        }

    }, {timestamps: true });
    user.associate = (models) => {
        user.hasMany( models.Sales, {foreignKey:'sellerId'
        } );
       
    }
    return user;
}

       