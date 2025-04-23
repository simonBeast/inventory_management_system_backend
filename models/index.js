const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config.json');

const basename = path.basename(__filename);
const db = {};
let sequelize;

sequelize = new Sequelize(config.production);

fs.readdirSync(__dirname)
    .filter(file => (
        file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js'
    ))
    .forEach((file) => {
        const modelDefiner = require(`./${file}`);
        db[file.slice(0, -3)] = modelDefiner(sequelize, DataTypes);
    });
Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;


module.exports = db;